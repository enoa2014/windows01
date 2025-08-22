const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function testNewAgeDistribution() {
    // 使用实际的数据库路径
    const dbPath = path.join(process.env.APPDATA, 'patient-checkin-manager', 'patients.db');
    console.log('连接到数据库:', dbPath);
    
    const db = new sqlite3.Database(dbPath);
    
    // 创建一个简化的dbManager对象来测试
    const dbManager = {
        db: db,
        run: (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID, changes: this.changes });
                });
            });
        },
        get: (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        },
        all: (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        },
        close: () => {
            return new Promise((resolve, reject) => {
                db.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    };
    
    // 添加getExtendedStatistics方法
    dbManager.getExtendedStatistics = async function() {
        try {
            console.log('开始获取扩展统计信息...');
            
            // 年龄摘要统计
            const ageSummaryQuery = `
                WITH age_calculations AS (
                    SELECT 
                        p.id as person_id,
                        p.name,
                        pp.birth_date,
                        CASE 
                            WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9][0-9]' THEN
                                SUBSTR(pp.birth_date, 1, 4) || '-0' || SUBSTR(pp.birth_date, 6, 1) || '-' || SUBSTR(pp.birth_date, 8, 2)
                            WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]' THEN
                                SUBSTR(pp.birth_date, 1, 4) || '-' || SUBSTR(pp.birth_date, 6, 2) || '-' || SUBSTR(pp.birth_date, 9, 2)
                            ELSE pp.birth_date
                        END as standardized_birth_date,
                        CASE 
                            WHEN pp.birth_date IS NOT NULL AND pp.birth_date != '' THEN
                                CAST((julianday('now') - julianday(
                                    CASE 
                                        WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9][0-9]' THEN
                                            SUBSTR(pp.birth_date, 1, 4) || '-0' || SUBSTR(pp.birth_date, 6, 1) || '-' || SUBSTR(pp.birth_date, 8, 2)
                                        WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]' THEN
                                            SUBSTR(pp.birth_date, 1, 4) || '-' || SUBSTR(pp.birth_date, 6, 2) || '-' || SUBSTR(pp.birth_date, 9, 2)
                                        ELSE pp.birth_date
                                    END
                                )) / 365.25 AS INTEGER)
                            ELSE NULL
                        END as age
                    FROM persons p
                    LEFT JOIN patient_profiles pp ON p.id = pp.person_id
                )
                SELECT 
                    COUNT(*) as totalCount,
                    COUNT(age) as validCount,
                    ROUND(COUNT(age) * 100.0 / COUNT(*), 1) as validPercentage,
                    ROUND(AVG(age), 1) as averageAge,
                    MIN(age) as minAge,
                    MAX(age) as maxAge
                FROM age_calculations
            `;
            
            console.log('执行年龄摘要查询...');
            const ageSummary = await this.get(ageSummaryQuery);
            console.log('年龄摘要结果:', ageSummary);
            
            // 年龄分布统计
            const ageDistributionQuery = `
                WITH age_calculations AS (
                    SELECT 
                        p.id as person_id,
                        p.name,
                        pp.birth_date,
                        CASE 
                            WHEN pp.birth_date IS NOT NULL AND pp.birth_date != '' THEN
                                CAST((julianday('now') - julianday(
                                    CASE 
                                        WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9][0-9]' THEN
                                            SUBSTR(pp.birth_date, 1, 4) || '-0' || SUBSTR(pp.birth_date, 6, 1) || '-' || SUBSTR(pp.birth_date, 8, 2)
                                        WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]' THEN
                                            SUBSTR(pp.birth_date, 1, 4) || '-' || SUBSTR(pp.birth_date, 6, 2) || '-' || SUBSTR(pp.birth_date, 9, 2)
                                        ELSE pp.birth_date
                                    END
                                )) / 365.25 AS INTEGER)
                            ELSE NULL
                        END as age
                    FROM persons p
                    LEFT JOIN patient_profiles pp ON p.id = pp.person_id
                    WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
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
            `;
            
            console.log('执行年龄分布查询...');
            const ageDistribution = await this.all(ageDistributionQuery);
            console.log('年龄分布结果条数:', ageDistribution.length);
            
            return {
                ageSummary: ageSummary || {
                    totalCount: 0,
                    validCount: 0,
                    validPercentage: 0,
                    averageAge: 0,
                    minAge: 0,
                    maxAge: 0
                },
                ageDistribution: ageDistribution || []
            };
        } catch (error) {
            console.error('获取扩展统计信息时发生错误:', error);
            throw error;
        }
    };
    
    try {
        
        console.log('测试新的年龄分布统计功能...\n');
        
        const stats = await dbManager.getExtendedStatistics();
        
        console.log('=== 年龄统计摘要 ===');
        console.log('总患者数:', stats.ageSummary.totalCount);
        console.log('有效年龄记录:', stats.ageSummary.validCount);
        console.log('有效比例:', stats.ageSummary.validPercentage + '%');
        console.log('平均年龄:', stats.ageSummary.averageAge + '岁');
        console.log('最小年龄:', stats.ageSummary.minAge + '岁');
        console.log('最大年龄:', stats.ageSummary.maxAge + '岁');
        
        console.log('\n=== 年龄段分布详情 ===');
        stats.ageDistribution.forEach((range, index) => {
            console.log(`${index + 1}. ${range.age_range}: ${range.count}人 (${range.percentage}%)`);
            console.log(`   平均年龄: ${range.range_avg_age}岁`);
            if (range.patient_examples) {
                const examples = range.patient_examples.split(', ').slice(0, 3).join(', ');
                const totalCount = range.patient_examples.split(', ').length;
                console.log(`   患者示例: ${examples}${totalCount > 3 ? ` 等${totalCount}人` : ''}`);
            }
            console.log('');
        });
        
        // 验证数据合理性
        const totalPercentage = stats.ageDistribution.reduce((sum, item) => sum + item.percentage, 0);
        console.log('=== 数据验证 ===');
        console.log('总百分比:', totalPercentage + '%', totalPercentage === 100 ? '✅' : '❌');
        
        const totalCount = stats.ageDistribution.reduce((sum, item) => sum + item.count, 0);
        console.log('分布总人数:', totalCount);
        console.log('有效年龄总数:', stats.ageSummary.validCount);
        console.log('人数匹配:', totalCount === stats.ageSummary.validCount ? '✅' : '❌');
        
    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        await dbManager.close();
    }
}

testNewAgeDistribution();