const DatabaseManager = require('./src/database/DatabaseManager.js');

async function diagnoseAgeInconsistency() {
    const dbManager = new DatabaseManager();
    
    try {
        await dbManager.initialize();
        
        console.log('🔍 年龄段数据不一致性诊断');
        console.log('='.repeat(60));
        
        // 1. 获取年龄分布统计数据
        console.log('\n📊 1. 年龄分布统计数据');
        const stats = await dbManager.getExtendedStatistics();
        
        if (!stats.ageDistribution || stats.ageDistribution.length === 0) {
            console.log('❌ 无年龄分布数据');
            return;
        }
        
        console.log('年龄分布统计:');
        stats.ageDistribution.forEach(range => {
            console.log(`  ${range.age_range}: ${range.count}人 (${range.percentage}%)`);
        });
        
        // 2. 检查每个年龄段的患者列表
        console.log('\n👥 2. 年龄段患者列表对比');
        
        for (const range of stats.ageDistribution) {
            console.log(`\n🔍 ${range.age_range} 年龄段详细分析:`);
            console.log(`  统计数据显示: ${range.count}人`);
            
            const patients = await dbManager.getAgeGroupPatients(range.age_range);
            console.log(`  患者列表查询: ${patients.length}人`);
            console.log(`  数据是否一致: ${range.count === patients.length ? '✅' : '❌'}`);
            
            if (range.count !== patients.length) {
                console.log(`  ⚠️ 发现不一致！差异: ${Math.abs(range.count - patients.length)}人`);
                
                // 显示统计中的患者示例
                if (range.patient_examples) {
                    const statsPatients = range.patient_examples.split(', ');
                    console.log(`  统计中的患者示例 (${statsPatients.length}个):`);
                    statsPatients.slice(0, 5).forEach(name => {
                        console.log(`    - ${name}`);
                    });
                }
                
                // 显示查询结果中的患者
                console.log(`  查询结果中的患者 (${patients.length}个):`);
                patients.slice(0, 5).forEach(patient => {
                    console.log(`    - ${patient.name} (${patient.age}岁)`);
                });
            }
        }
        
        // 3. 深度分析：检查重复患者档案问题
        console.log('\n🔬 3. 深度分析 - 患者档案重复问题');
        
        const duplicateProfiles = await dbManager.all(`
            SELECT 
                p.id as person_id,
                p.name,
                COUNT(pp.id) as profile_count,
                GROUP_CONCAT(pp.birth_date, ' | ') as birth_dates
            FROM persons p
            LEFT JOIN patient_profiles pp ON p.id = pp.person_id
            WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
            GROUP BY p.id, p.name
            HAVING COUNT(pp.id) > 1
            ORDER BY profile_count DESC
            LIMIT 10
        `);
        
        console.log(`发现 ${duplicateProfiles.length} 个患者有多个档案:`);
        duplicateProfiles.forEach(patient => {
            console.log(`  ${patient.name} (ID: ${patient.person_id}): ${patient.profile_count}个档案`);
            console.log(`    出生日期: ${patient.birth_dates}`);
        });
        
        // 4. 测试具体的7-12岁年龄段
        console.log('\n🎯 4. 重点分析：7-12岁年龄段');
        
        // 使用统计查询的逻辑
        const statsQuery = await dbManager.all(`
            WITH patient_birth_dates AS (
                SELECT 
                    p.id as person_id,
                    p.name,
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
                                    WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9]' THEN
                                        SUBSTR(birth_date, 1, 4) || '-0' || SUBSTR(birth_date, 6, 1) || '-0' || SUBSTR(birth_date, 8, 1)
                                    WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9].[0-9][0-9]' THEN
                                        SUBSTR(birth_date, 1, 4) || '-0' || SUBSTR(birth_date, 6, 1) || '-' || SUBSTR(birth_date, 8, 2)
                                    WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9]' THEN
                                        SUBSTR(birth_date, 1, 4) || '-' || SUBSTR(birth_date, 6, 2) || '-0' || SUBSTR(birth_date, 9, 1)
                                    WHEN birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]' THEN
                                        SUBSTR(birth_date, 1, 4) || '-' || SUBSTR(birth_date, 6, 2) || '-' || SUBSTR(birth_date, 9, 2)
                                    WHEN birth_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN
                                        birth_date
                                    WHEN birth_date LIKE '%.%.%' THEN
                                        REPLACE(birth_date, '.', '-')
                                    ELSE birth_date
                                END
                            )) / 365.25 AS INTEGER)
                        ELSE NULL
                    END as age
                FROM patient_birth_dates
            )
            SELECT 
                person_id,
                name,
                birth_date,
                age
            FROM age_calculations
            WHERE age BETWEEN 7 AND 12
            ORDER BY name
        `);
        
        console.log(`统计查询逻辑下的7-12岁患者: ${statsQuery.length}人`);
        statsQuery.forEach(patient => {
            console.log(`  ${patient.name}: ${patient.age}岁 (${patient.birth_date})`);
        });
        
        // 使用患者列表查询的逻辑
        const listQuery = await dbManager.getAgeGroupPatients('7-12岁');
        console.log(`\n患者列表查询逻辑下的7-12岁患者: ${listQuery.length}人`);
        listQuery.forEach(patient => {
            console.log(`  ${patient.name}: ${patient.age}岁`);
        });
        
        // 5. 建议修复方案
        console.log('\n💡 5. 修复建议');
        console.log('问题根源: 两个查询使用了不同的数据获取逻辑');
        console.log('修复方案: 统一年龄段患者列表查询，使其与统计查询保持一致');
        
    } catch (error) {
        console.error('诊断失败:', error);
    } finally {
        await dbManager.close();
    }
}

diagnoseAgeInconsistency().catch(console.error);