const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const { app } = require('electron');

class DatabaseManager {
    constructor() {
        this.db = null;
        // 数据库文件路径
        const userDataPath = app ? app.getPath('userData') : './data';
        this.dbPath = path.join(userDataPath, 'patients.db');
    }

    async initialize() {
        try {
            // 确保数据目录存在
            await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
            
            // 连接数据库
            this.db = await this.connectDatabase();
            
            // 启用外键约束
            await this.run('PRAGMA foreign_keys = ON');
            
            // 创建表结构
            await this.createTables();
            
            console.log('数据库初始化完成:', this.dbPath);
        } catch (error) {
            console.error('数据库初始化失败:', error);
            throw error;
        }
    }

    connectDatabase() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(db);
                }
            });
        });
    }

    async createTables() {
        try {
            const schemaPath = path.join(__dirname, '../../database-schema.sql');
            const schema = await fs.readFile(schemaPath, 'utf8');
            
            // 清理注释行并保留多行SQL语句结构
            const cleanedSchema = schema
                .split('\n')
                .filter(line => !line.trim().startsWith('--') && line.trim())
                .join('\n');
            
            const statements = cleanedSchema.split(';').filter(stmt => stmt.trim());
            
            // 分离表创建和索引创建语句
            const createTableStatements = [];
            const createIndexStatements = [];
            
            for (const statement of statements) {
                const trimmed = statement.trim();
                if (trimmed) {
                    if (trimmed.toUpperCase().startsWith('CREATE TABLE')) {
                        createTableStatements.push(trimmed);
                    } else if (trimmed.toUpperCase().startsWith('CREATE')) {
                        createIndexStatements.push(trimmed);
                    }
                }
            }
            
            // 先创建表
            for (const statement of createTableStatements) {
                try {
                    await this.run(statement);
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        console.warn('表创建警告:', error.message);
                    }
                }
            }
            
            // 再创建索引
            for (const statement of createIndexStatements) {
                try {
                    await this.run(statement);
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        console.warn('索引创建警告:', error.message);
                    }
                }
            }
        } catch (error) {
            console.error('创建表结构失败:', error);
            throw error;
        }
    }

    // 封装数据库操作为Promise
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // 人员去重逻辑
    async findOrCreatePerson(name, idCard = null) {
        // 规范化处理
        const normalizedName = name ? name.trim() : '';
        const normalizedIdCard = (idCard && idCard.trim() && idCard.trim() !== '-') ? idCard.trim() : null;

        if (!normalizedName) {
            throw new Error('姓名不能为空');
        }

        let existingPerson = null;

        try {
            if (normalizedIdCard) {
                // 有身份证号：首先查找相同身份证号的人
                existingPerson = await this.get(
                    'SELECT * FROM persons WHERE id_card = ? AND id_card IS NOT NULL',
                    [normalizedIdCard]
                );
                
                // 如果没有找到相同身份证号的人，查找同名但无身份证号的人
                if (!existingPerson) {
                    const sameNamePerson = await this.get(
                        'SELECT * FROM persons WHERE name = ? AND (id_card IS NULL OR id_card = "")',
                        [normalizedName]
                    );
                    
                    if (sameNamePerson) {
                        // 更新现有人员的身份证号
                        await this.run(
                            'UPDATE persons SET id_card = ? WHERE id = ?',
                            [normalizedIdCard, sameNamePerson.id]
                        );
                        return sameNamePerson.id;
                    }
                }
            } else {
                // 无身份证号：查找同名的人
                // 优先找无身份证号的记录，如果没有则找任何同名记录
                existingPerson = await this.get(
                    'SELECT * FROM persons WHERE name = ? AND (id_card IS NULL OR id_card = "") ORDER BY id',
                    [normalizedName]
                );
                
                // 如果没有找到无身份证号的同名记录，查找任何同名记录
                if (!existingPerson) {
                    existingPerson = await this.get(
                        'SELECT * FROM persons WHERE name = ? ORDER BY id',
                        [normalizedName]
                    );
                }
            }

            if (existingPerson) {
                return existingPerson.id;
            }

            // 创建新人员记录
            const result = await this.run(
                'INSERT INTO persons (name, id_card, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
                [normalizedName, normalizedIdCard]
            );

            return result.id;
        } catch (error) {
            console.error('创建人员记录失败:', error);
            throw error;
        }
    }

    // 插入完整的患者记录
    async insertPatientRecord(recordData) {
        const personId = await this.findOrCreatePerson(recordData.name, recordData.idCard);

        // 插入患者档案
        await this.run(`
            INSERT OR REPLACE INTO patient_profiles 
            (person_id, gender, birth_date, hometown, ethnicity) 
            VALUES (?, ?, ?, ?, ?)
        `, [personId, recordData.gender, recordData.birthDate, recordData.hometown, recordData.ethnicity]);

        // 插入入住记录
        if (recordData.checkInDate) {
            await this.run(`
                INSERT INTO check_in_records 
                (person_id, check_in_date, attendees, details, treatment_plan) 
                VALUES (?, ?, ?, ?, ?)
            `, [personId, recordData.checkInDate, recordData.attendees, recordData.symptoms, recordData.followUpPlan]);
        }

        // 插入医疗信息
        if (recordData.hospital) {
            await this.run(`
                INSERT INTO medical_info 
                (person_id, hospital, diagnosis, doctor_name, symptoms, treatment_process, follow_up_plan, record_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [personId, recordData.hospital, recordData.diagnosis, recordData.doctorName, 
                recordData.symptoms, recordData.treatmentProcess, recordData.followUpPlan, recordData.checkInDate]);
        }

        // 插入家庭信息
        if (recordData.homeAddress) {
            await this.run(`
                INSERT OR REPLACE INTO family_info 
                (person_id, home_address, father_name, father_phone, father_id_card, 
                 mother_name, mother_phone, mother_id_card, other_guardian, economic_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [personId, recordData.homeAddress, recordData.fatherName, recordData.fatherPhone, 
                recordData.fatherIdCard, recordData.motherName, recordData.motherPhone, 
                recordData.motherIdCard, recordData.otherGuardian, recordData.economicStatus]);
        }

        return personId;
    }

    // 获取患者列表（合并显示）
    async getPatients() {
        const sql = `
            SELECT 
                p.id as person_id,
                p.name,
                pp.gender,
                pp.birth_date,
                pp.hometown,
                p.id_card,
                mi.diagnosis,
                COUNT(DISTINCT cir.id) as check_in_count,
                MAX(cir.check_in_date) as latest_check_in
            FROM persons p
            LEFT JOIN patient_profiles pp ON p.id = pp.person_id
            LEFT JOIN medical_info mi ON p.id = mi.person_id
            LEFT JOIN check_in_records cir ON p.id = cir.person_id
            GROUP BY p.id
            ORDER BY latest_check_in DESC, p.name
        `;
        
        return await this.all(sql);
    }

    // 获取患者详细信息
    async getPatientDetail(personId) {
        const [profile, family, checkIns, medicalInfo] = await Promise.all([
            this.get(`
                SELECT p.*, pp.gender, pp.birth_date, pp.hometown, pp.ethnicity
                FROM persons p
                LEFT JOIN patient_profiles pp ON p.id = pp.person_id
                WHERE p.id = ?
            `, [personId]),
            
            this.get(`
                SELECT * FROM family_info WHERE person_id = ?
            `, [personId]),
            
            this.all(`
                SELECT * FROM check_in_records 
                WHERE person_id = ? 
                ORDER BY check_in_date DESC
            `, [personId]),
            
            this.all(`
                SELECT * FROM medical_info 
                WHERE person_id = ? 
                ORDER BY record_date DESC
            `, [personId])
        ]);

        return {
            profile,
            family,
            checkIns,
            medicalInfo
        };
    }

    // 搜索患者
    async searchPatients(query) {
        const searchTerm = `%${query.trim()}%`;
        const sql = `
            SELECT 
                p.id as person_id,
                p.name,
                pp.gender,
                pp.birth_date,
                pp.hometown,
                mi.diagnosis,
                COUNT(DISTINCT cir.id) as check_in_count,
                MAX(cir.check_in_date) as latest_check_in
            FROM persons p
            LEFT JOIN patient_profiles pp ON p.id = pp.person_id
            LEFT JOIN medical_info mi ON p.id = mi.person_id
            LEFT JOIN check_in_records cir ON p.id = cir.person_id
            WHERE p.name LIKE ? OR pp.hometown LIKE ? OR mi.diagnosis LIKE ?
            GROUP BY p.id
            ORDER BY latest_check_in DESC, p.name
        `;
        
        return await this.all(sql, [searchTerm, searchTerm, searchTerm]);
    }

    // 获取统计信息
    async getStatistics() {
        const [totalPatients, totalRecords] = await Promise.all([
            this.get('SELECT COUNT(*) as count FROM persons'),
            this.get('SELECT COUNT(*) as count FROM check_in_records')
        ]);

        return {
            totalPatients: totalPatients.count,
            totalRecords: totalRecords.count
        };
    }

    async getExtendedStatistics() {
        try {
            // 优化：分批获取统计数据，减少并发查询压力
            // 1. 基础统计（高优先级）
            const [totalPatients, totalRecords] = await Promise.all([
                this.get('SELECT COUNT(DISTINCT p.id) as count FROM persons p'),
                this.get('SELECT COUNT(*) as count FROM check_in_records')
            ]);

            // 2. 患者相关统计（中优先级）
            const [genderStats, multipleAdmissions, averageAge] = await Promise.all([
                this.all(`
                    SELECT pp.gender, COUNT(*) as count 
                    FROM persons p 
                    LEFT JOIN patient_profiles pp ON p.id = pp.person_id 
                    WHERE pp.gender IS NOT NULL AND pp.gender != ''
                    GROUP BY pp.gender
                `),
                this.get(`
                    SELECT COUNT(*) as count 
                    FROM persons p 
                    WHERE (
                        SELECT COUNT(*) 
                        FROM check_in_records cir 
                        WHERE cir.person_id = p.id
                    ) > 1
                `),
                this.get(`
                    SELECT ROUND(AVG(
                        CASE 
                            WHEN pp.birth_date IS NOT NULL 
                            AND pp.birth_date != '' 
                            THEN 
                                CASE 
                                    -- 处理点号分隔的日期格式 (2014.3.27 -> 2014-03-27)
                                    WHEN pp.birth_date LIKE '%.%.%' THEN
                                        (julianday('now') - julianday(
                                            CASE 
                                                WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9]' THEN
                                                    SUBSTR(pp.birth_date, 1, 4) || '-0' || SUBSTR(pp.birth_date, 6, 1) || '-0' || SUBSTR(pp.birth_date, 8, 1)
                                                WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9][0-9]' THEN
                                                    SUBSTR(pp.birth_date, 1, 4) || '-0' || SUBSTR(pp.birth_date, 6, 1) || '-' || SUBSTR(pp.birth_date, 8, 2)
                                                WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9]' THEN
                                                    SUBSTR(pp.birth_date, 1, 4) || '-' || SUBSTR(pp.birth_date, 6, 2) || '-0' || SUBSTR(pp.birth_date, 9, 1)
                                                WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]' THEN
                                                    SUBSTR(pp.birth_date, 1, 4) || '-' || SUBSTR(pp.birth_date, 6, 2) || '-' || SUBSTR(pp.birth_date, 9, 2)
                                                ELSE REPLACE(pp.birth_date, '.', '-')
                                            END
                                        )) / 365.25
                                    -- 处理标准格式的日期
                                    WHEN date(pp.birth_date) IS NOT NULL THEN
                                        (julianday('now') - julianday(date(pp.birth_date))) / 365.25
                                    ELSE NULL
                                END
                            ELSE NULL
                        END
                    ), 1) as avg_age
                    FROM persons p
                    LEFT JOIN patient_profiles pp ON p.id = pp.person_id
                    WHERE pp.birth_date IS NOT NULL 
                    AND pp.birth_date != ''
                `)
            ]);

            // 3. 年龄统计摘要 - 修复总数不一致问题
            const ageSummary = await this.get(`
                WITH all_patients AS (
                    SELECT 
                        p.id as person_id,
                        p.name,
                        -- 每个患者只取一个出生日期（最新的非空记录）
                        (SELECT pp.birth_date 
                         FROM patient_profiles pp 
                         WHERE pp.person_id = p.id 
                         AND pp.birth_date IS NOT NULL 
                         AND pp.birth_date != ''
                         ORDER BY pp.id DESC 
                         LIMIT 1) as birth_date
                    FROM persons p
                ),
                age_calculations AS (
                    SELECT 
                        person_id,
                        name,
                        birth_date,
                        CASE 
                            WHEN birth_date IS NOT NULL AND birth_date != '' THEN
                                CAST((julianday('now') - julianday(
                                    CASE 
                                        -- 处理点号分隔的日期格式 (2014.3.27 -> 2014-03-27)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-0' || SUBSTR(birth_date, 6, 1) || '-0' || SUBSTR(birth_date, 8, 1)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9][0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-0' || SUBSTR(birth_date, 6, 1) || '-' || SUBSTR(birth_date, 8, 2)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-' || SUBSTR(birth_date, 6, 2) || '-0' || SUBSTR(birth_date, 9, 1)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-' || SUBSTR(birth_date, 6, 2) || '-' || SUBSTR(birth_date, 9, 2)
                                        -- 处理已经是标准格式的日期
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN
                                            birth_date
                                        -- 尝试将点号替换为短横线
                                        WHEN birth_date LIKE '%.%.%' THEN
                                            REPLACE(birth_date, '.', '-')
                                        ELSE birth_date
                                    END
                                )) / 365.25 AS INTEGER)
                            ELSE NULL
                        END as age
                    FROM all_patients
                )
                SELECT 
                    COUNT(*) as totalCount,
                    COUNT(age) as validCount,
                    ROUND(COUNT(age) * 100.0 / COUNT(*), 1) as validPercentage,
                    ROUND(AVG(age), 1) as averageAge,
                    MIN(age) as minAge,
                    MAX(age) as maxAge
                FROM age_calculations
            `);

            // 4. 年龄分布统计 - 确保与年龄摘要使用相同逻辑
            const ageDistribution = await this.all(`
                WITH patient_birth_dates AS (
                    SELECT 
                        p.id as person_id,
                        p.name,
                        -- 每个患者只取一个出生日期（最新的非空记录）
                        (SELECT pp.birth_date 
                         FROM patient_profiles pp 
                         WHERE pp.person_id = p.id 
                         AND pp.birth_date IS NOT NULL 
                         AND pp.birth_date != ''
                         ORDER BY pp.id DESC 
                         LIMIT 1) as birth_date
                    FROM persons p
                    WHERE (SELECT pp.birth_date 
                           FROM patient_profiles pp 
                           WHERE pp.person_id = p.id 
                           AND pp.birth_date IS NOT NULL 
                           AND pp.birth_date != ''
                           ORDER BY pp.id DESC 
                           LIMIT 1) IS NOT NULL
                ),
                age_calculations AS (
                    SELECT 
                        person_id,
                        name,
                        birth_date,
                        CASE 
                            WHEN birth_date IS NOT NULL AND birth_date != '' THEN
                                CAST((julianday('now') - julianday(
                                    CASE 
                                        -- 处理点号分隔的日期格式 (2014.3.27 -> 2014-03-27)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-0' || SUBSTR(birth_date, 6, 1) || '-0' || SUBSTR(birth_date, 8, 1)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9][0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-0' || SUBSTR(birth_date, 6, 1) || '-' || SUBSTR(birth_date, 8, 2)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-' || SUBSTR(birth_date, 6, 2) || '-0' || SUBSTR(birth_date, 9, 1)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-' || SUBSTR(birth_date, 6, 2) || '-' || SUBSTR(birth_date, 9, 2)
                                        -- 处理已经是标准格式的日期
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN
                                            birth_date
                                        -- 尝试将点号替换为短横线
                                        WHEN birth_date LIKE '%.%.%' THEN
                                            REPLACE(birth_date, '.', '-')
                                        ELSE birth_date
                                    END
                                )) / 365.25 AS INTEGER)
                            ELSE NULL
                        END as age
                    FROM patient_birth_dates
                ),
                age_ranges AS (
                    SELECT 
                        CASE 
                            WHEN age < 1 THEN '0-1岁'
                            WHEN age <= 3 THEN '1-3岁'
                            WHEN age <= 6 THEN '4-6岁'
                            WHEN age <= 12 THEN '7-12岁'
                            WHEN age <= 18 THEN '13-18岁'
                            ELSE '18岁以上'
                        END as age_range,
                        age,
                        name,
                        person_id
                    FROM age_calculations
                    WHERE age IS NOT NULL
                )
                SELECT 
                    age_range,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM age_ranges), 1) as percentage,
                    ROUND(AVG(age), 1) as range_avg_age,
                    GROUP_CONCAT(name, ', ') as patient_examples
                FROM age_ranges
                GROUP BY age_range
                ORDER BY 
                    CASE age_range
                        WHEN '0-1岁' THEN 1
                        WHEN '1-3岁' THEN 2
                        WHEN '4-6岁' THEN 3
                        WHEN '7-12岁' THEN 4
                        WHEN '13-18岁' THEN 5
                        WHEN '18岁以上' THEN 6
                    END
            `);

            // 籍贯分布统计
            const locationStats = await this.all(`
                SELECT pp.hometown, COUNT(*) as count
                FROM persons p
                LEFT JOIN patient_profiles pp ON p.id = pp.person_id
                WHERE pp.hometown IS NOT NULL AND pp.hometown != ''
                GROUP BY pp.hometown
                ORDER BY count DESC
                LIMIT 10
            `);

            // 疾病分布统计
            const diseaseStats = await this.all(`
                SELECT mi.diagnosis, COUNT(*) as count
                FROM medical_info mi
                WHERE mi.diagnosis IS NOT NULL AND mi.diagnosis != ''
                GROUP BY mi.diagnosis
                ORDER BY count DESC
                LIMIT 10
            `);

            // 医生统计
            const doctorStats = await this.all(`
                SELECT mi.doctor_name, COUNT(*) as patient_count
                FROM medical_info mi
                WHERE mi.doctor_name IS NOT NULL AND mi.doctor_name != ''
                GROUP BY mi.doctor_name
                ORDER BY patient_count DESC
                LIMIT 10
            `);

            // 月度趋势（最近12个月）
            const monthlyTrend = await this.all(`
                SELECT 
                    strftime('%Y-%m', cir.check_in_date) as month,
                    COUNT(*) as admissions
                FROM check_in_records cir
                WHERE cir.check_in_date IS NOT NULL
                    AND date(cir.check_in_date) >= date('now', '-12 months')
                GROUP BY month
                ORDER BY month
            `);

            // 确保数据完整性和降级处理
            const result = {
                totalPatients: totalPatients?.count || 0,
                totalRecords: totalRecords?.count || 0,
                averageAge: ageSummary?.averageAge || 0, // 使用更准确的年龄计算
                multipleAdmissions: multipleAdmissions?.count || 0,
                genderStats: genderStats?.reduce((acc, item) => {
                    if (item.gender && item.count) {
                        acc[item.gender] = item.count;
                    }
                    return acc;
                }, {}) || {},
                // 新增年龄分析数据
                ageSummary: {
                    totalCount: ageSummary?.totalCount || 0,
                    validCount: ageSummary?.validCount || 0,
                    validPercentage: ageSummary?.validPercentage || 0,
                    averageAge: ageSummary?.averageAge || 0,
                    minAge: ageSummary?.minAge || 0,
                    maxAge: ageSummary?.maxAge || 0
                },
                ageDistribution: ageDistribution || [],
                locationStats: locationStats || [],
                diseaseStats: diseaseStats || [],
                doctorStats: doctorStats || [],
                monthlyTrend: monthlyTrend || []
            };

            console.log('统计数据计算完成:', { 
                totalPatients: result.totalPatients, 
                averageAge: result.averageAge,
                hasAgeDistribution: result.ageDistribution.length > 0
            });

            return result;
        } catch (error) {
            console.error('获取扩展统计数据失败:', error);
            throw error;
        }
    }

    async getAgeGroupPatients(ageRange) {
        try {
            let ageCondition;
            switch (ageRange) {
                case '0-1岁':
                    ageCondition = 'age < 1';
                    break;
                case '1-3岁':
                    ageCondition = 'age BETWEEN 1 AND 3';
                    break;
                case '4-6岁':
                    ageCondition = 'age BETWEEN 4 AND 6';
                    break;
                case '7-12岁':
                    ageCondition = 'age BETWEEN 7 AND 12';
                    break;
                case '13-18岁':
                    ageCondition = 'age BETWEEN 13 AND 18';
                    break;
                case '18岁以上':
                    ageCondition = 'age > 18';
                    break;
                default:
                    ageCondition = 'age < 0';
            }

            const patients = await this.all(`
                WITH patient_birth_dates AS (
                    SELECT 
                        p.id as person_id,
                        p.name,
                        -- 每个患者只取一个出生日期（最新的非空记录）- 与统计查询保持完全一致
                        (SELECT pp.birth_date 
                         FROM patient_profiles pp 
                         WHERE pp.person_id = p.id 
                         AND pp.birth_date IS NOT NULL 
                         AND pp.birth_date != ''
                         ORDER BY pp.id DESC 
                         LIMIT 1) as birth_date,
                        -- 获取性别信息（最新记录）
                        (SELECT pp.gender 
                         FROM patient_profiles pp 
                         WHERE pp.person_id = p.id 
                         AND pp.gender IS NOT NULL 
                         AND pp.gender != ''
                         ORDER BY pp.id DESC 
                         LIMIT 1) as gender
                    FROM persons p
                    WHERE (SELECT pp.birth_date 
                           FROM patient_profiles pp 
                           WHERE pp.person_id = p.id 
                           AND pp.birth_date IS NOT NULL 
                           AND pp.birth_date != ''
                           ORDER BY pp.id DESC 
                           LIMIT 1) IS NOT NULL
                ),
                age_calculations AS (
                    SELECT 
                        person_id,
                        name,
                        birth_date,
                        gender,
                        -- 使用与统计查询完全相同的年龄计算逻辑
                        CASE 
                            WHEN birth_date IS NOT NULL AND birth_date != '' THEN
                                CAST((julianday('now') - julianday(
                                    CASE 
                                        -- 处理点号分隔的日期格式 (2014.3.27 -> 2014-03-27)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-0' || SUBSTR(birth_date, 6, 1) || '-0' || SUBSTR(birth_date, 8, 1)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9][0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-0' || SUBSTR(birth_date, 6, 1) || '-' || SUBSTR(birth_date, 8, 2)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-' || SUBSTR(birth_date, 6, 2) || '-0' || SUBSTR(birth_date, 9, 1)
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]' THEN
                                            SUBSTR(birth_date, 1, 4) || '-' || SUBSTR(birth_date, 6, 2) || '-' || SUBSTR(birth_date, 9, 2)
                                        -- 处理已经是标准格式的日期
                                        WHEN birth_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN
                                            birth_date
                                        -- 尝试将点号替换为短横线
                                        WHEN birth_date LIKE '%.%.%' THEN
                                            REPLACE(birth_date, '.', '-')
                                        ELSE birth_date
                                    END
                                )) / 365.25 AS INTEGER)
                            ELSE NULL
                        END as age
                    FROM patient_birth_dates
                ),
                patient_with_age AS (
                    SELECT 
                        ac.person_id as id,
                        ac.name,
                        ac.age,
                        ac.gender,
                        -- 获取入住次数
                        (SELECT COUNT(*) 
                         FROM check_in_records cir 
                         WHERE cir.person_id = ac.person_id) as check_in_count,
                        -- 获取最新诊断
                        (SELECT mi.diagnosis 
                         FROM medical_info mi 
                         WHERE mi.person_id = ac.person_id
                         AND mi.diagnosis IS NOT NULL 
                         AND mi.diagnosis != ''
                         ORDER BY mi.record_date DESC 
                         LIMIT 1) as latest_diagnosis,
                        -- 获取最近入住时间
                        (SELECT MAX(cir.check_in_date) 
                         FROM check_in_records cir 
                         WHERE cir.person_id = ac.person_id) as latest_check_in
                    FROM age_calculations ac
                    WHERE ac.age IS NOT NULL AND ${ageCondition}
                )
                SELECT 
                    id,
                    name,
                    age,
                    gender,
                    COALESCE(latest_diagnosis, '无诊断信息') as main_diagnosis,
                    check_in_count,
                    latest_check_in
                FROM patient_with_age
                ORDER BY name
            `);
            
            return patients;
        } catch (error) {
            console.error('获取年龄段患者列表失败:', error);
            throw error;
        }
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) console.error('关闭数据库时出错:', err);
                    this.db = null;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // 调试方法
    isInitialized() {
        return this.db !== null;
    }
}

module.exports = DatabaseManager;