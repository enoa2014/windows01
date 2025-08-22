const DatabaseManager = require('./src/database/DatabaseManager.js');

async function debugAgeDataLoss() {
    const dbManager = new DatabaseManager();
    
    try {
        await dbManager.initialize();
        
        console.log('🔍 年龄数据丢失调试');
        console.log('='.repeat(50));
        
        // 1. 检查原始数据
        console.log('\n📊 1. 原始数据检查');
        const totalPersons = await dbManager.get('SELECT COUNT(*) as count FROM persons');
        const personsWithProfiles = await dbManager.get('SELECT COUNT(*) as count FROM patient_profiles');
        
        console.log(`总人数: ${totalPersons.count}`);
        console.log(`患者档案数: ${personsWithProfiles.count}`);
        
        // 2. 检查出生日期数据
        console.log('\n📅 2. 出生日期数据分析');
        const birthDateStats = await dbManager.all(`
            SELECT 
                COUNT(*) as total,
                COUNT(pp.birth_date) as has_birth_date,
                COUNT(CASE WHEN pp.birth_date IS NOT NULL AND pp.birth_date != '' THEN 1 END) as valid_birth_date
            FROM persons p
            LEFT JOIN patient_profiles pp ON p.id = pp.person_id
        `);
        
        console.log(`总记录数: ${birthDateStats[0].total}`);
        console.log(`有birth_date字段: ${birthDateStats[0].has_birth_date}`);
        console.log(`有效birth_date: ${birthDateStats[0].valid_birth_date}`);
        
        // 3. 样本出生日期格式检查
        console.log('\n📝 3. 出生日期格式样本');
        const sampleBirthDates = await dbManager.all(`
            SELECT DISTINCT pp.birth_date, COUNT(*) as count
            FROM persons p
            LEFT JOIN patient_profiles pp ON p.id = pp.person_id
            WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
            GROUP BY pp.birth_date
            ORDER BY count DESC
            LIMIT 10
        `);
        
        sampleBirthDates.forEach(sample => {
            console.log(`  "${sample.birth_date}" - ${sample.count}人`);
        });
        
        // 4. 测试年龄计算逻辑
        console.log('\n🧮 4. 年龄计算测试');
        const ageTestResults = await dbManager.all(`
            SELECT 
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
                END as calculated_age
            FROM persons p
            LEFT JOIN patient_profiles pp ON p.id = pp.person_id
            WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
            ORDER BY calculated_age
            LIMIT 15
        `);
        
        console.log('年龄计算样本:');
        ageTestResults.forEach(result => {
            console.log(`  ${result.name}: ${result.birth_date} → ${result.calculated_age}岁`);
        });
        
        // 5. 测试DISTINCT是否导致数据丢失
        console.log('\n🔄 5. DISTINCT影响测试');
        
        const withoutDistinct = await dbManager.all(`
            SELECT COUNT(*) as count
            FROM persons p
            LEFT JOIN patient_profiles pp ON p.id = pp.person_id
            WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
        `);
        
        const withDistinct = await dbManager.all(`
            SELECT COUNT(*) as count
            FROM (
                SELECT DISTINCT p.id, p.name, pp.birth_date
                FROM persons p
                LEFT JOIN patient_profiles pp ON p.id = pp.person_id
                WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
            )
        `);
        
        console.log(`不使用DISTINCT: ${withoutDistinct[0].count}条记录`);
        console.log(`使用DISTINCT: ${withDistinct[0].count}条记录`);
        console.log(`DISTINCT丢失了: ${withoutDistinct[0].count - withDistinct[0].count}条记录`);
        
        // 6. 年龄段分布测试（简化版）
        console.log('\n📊 6. 年龄段分布测试');
        const ageRangeTest = await dbManager.all(`
            WITH age_calculations AS (
                SELECT DISTINCT
                    p.id as person_id,
                    p.name,
                    pp.birth_date,
                    CASE 
                        WHEN pp.birth_date IS NOT NULL AND pp.birth_date != '' THEN
                            CAST((julianday('now') - julianday(
                                CASE 
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
            )
            SELECT 
                CASE 
                    WHEN age < 1 THEN '0-1岁'
                    WHEN age <= 3 THEN '1-3岁'
                    WHEN age <= 6 THEN '4-6岁'
                    WHEN age <= 12 THEN '7-12岁'
                    WHEN age <= 18 THEN '13-18岁'
                    ELSE '18岁以上'
                END as age_range,
                COUNT(*) as count,
                GROUP_CONCAT(name) as examples
            FROM age_calculations
            WHERE age IS NOT NULL
            GROUP BY 
                CASE 
                    WHEN age < 1 THEN '0-1岁'
                    WHEN age <= 3 THEN '1-3岁'
                    WHEN age <= 6 THEN '4-6岁'
                    WHEN age <= 12 THEN '7-12岁'
                    WHEN age <= 18 THEN '13-18岁'
                    ELSE '18岁以上'
                END
            ORDER BY count DESC
        `);
        
        console.log('当前年龄段分布:');
        let totalInRanges = 0;
        ageRangeTest.forEach(range => {
            console.log(`  ${range.age_range}: ${range.count}人`);
            console.log(`    示例: ${range.examples.split(',').slice(0, 3).join(', ')}...`);
            totalInRanges += range.count;
        });
        
        console.log(`\n年龄段总计: ${totalInRanges}人`);
        console.log(`应该等于有效年龄记录: ${withDistinct[0].count}人`);
        console.log(`匹配: ${totalInRanges === withDistinct[0].count ? '✅' : '❌'}`);
        
    } catch (error) {
        console.error('调试失败:', error);
    } finally {
        await dbManager.close();
    }
}

debugAgeDataLoss().catch(console.error);