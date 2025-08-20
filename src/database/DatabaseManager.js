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