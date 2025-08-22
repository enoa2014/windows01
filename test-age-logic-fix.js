const DatabaseManager = require('./src/database/DatabaseManager.js');

async function testAgeLogicFix() {
    const dbManager = new DatabaseManager();
    
    try {
        await dbManager.initialize();
        
        console.log('🔍 年龄逻辑修复验证测试');
        console.log('='.repeat(50));
        
        // 1. 基础数据检查
        console.log('\n📊 1. 基础数据验证');
        const totalPersons = await dbManager.get('SELECT COUNT(DISTINCT id) as count FROM persons');
        const totalWithProfiles = await dbManager.get(`
            SELECT COUNT(DISTINCT p.id) as count 
            FROM persons p 
            LEFT JOIN patient_profiles pp ON p.id = pp.person_id 
            WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
        `);
        
        console.log(`总患者数: ${totalPersons.count} 人`);
        console.log(`有出生日期的患者数: ${totalWithProfiles.count} 人`);
        console.log(`预期有效年龄比例: ${(totalWithProfiles.count / totalPersons.count * 100).toFixed(1)}%`);
        
        // 2. 修复后的统计结果
        console.log('\n📈 2. 修复后的统计结果');
        const stats = await dbManager.getExtendedStatistics();
        
        console.log(`统计显示总患者数: ${stats.ageSummary.totalCount} 人`);
        console.log(`统计显示有效年龄记录: ${stats.ageSummary.validCount} 人`);
        console.log(`统计显示有效比例: ${stats.ageSummary.validPercentage}%`);
        console.log(`平均年龄: ${stats.ageSummary.averageAge} 岁`);
        
        // 3. 数据一致性验证
        console.log('\n✅ 3. 数据一致性验证');
        const totalCountMatch = stats.ageSummary.totalCount === totalPersons.count;
        const validCountMatch = stats.ageSummary.validCount === totalWithProfiles.count;
        
        console.log(`总患者数一致性: ${totalCountMatch ? '✅ 通过' : '❌ 不一致'}`);
        console.log(`有效年龄数一致性: ${validCountMatch ? '✅ 通过' : '❌ 不一致'}`);
        
        // 4. 年龄段分布验证
        console.log('\n📊 4. 年龄段分布验证');
        let ageDistributionTotal = 0;
        stats.ageDistribution.forEach(range => {
            console.log(`${range.age_range}: ${range.count}人 (${range.percentage}%)`);
            ageDistributionTotal += range.count;
        });
        
        console.log(`年龄段总人数: ${ageDistributionTotal} 人`);
        console.log(`与有效年龄记录匹配: ${ageDistributionTotal === stats.ageSummary.validCount ? '✅ 通过' : '❌ 不一致'}`);
        
        // 5. 逻辑合理性检查
        console.log('\n🧮 5. 逻辑合理性检查');
        const logicalChecks = [
            {
                name: '总患者数 ≥ 有效年龄记录数',
                passed: stats.ageSummary.totalCount >= stats.ageSummary.validCount,
                detail: `${stats.ageSummary.totalCount} ≥ ${stats.ageSummary.validCount}`
            },
            {
                name: '各年龄段人数 ≤ 总患者数',
                passed: stats.ageDistribution.every(range => range.count <= stats.ageSummary.totalCount),
                detail: `最大年龄段: ${Math.max(...stats.ageDistribution.map(r => r.count))} ≤ ${stats.ageSummary.totalCount}`
            },
            {
                name: '有效比例在合理范围(20%-100%)',
                passed: stats.ageSummary.validPercentage >= 20 && stats.ageSummary.validPercentage <= 100,
                detail: `${stats.ageSummary.validPercentage}%`
            },
            {
                name: '平均年龄在合理范围(0-25岁)',
                passed: stats.ageSummary.averageAge >= 0 && stats.ageSummary.averageAge <= 25,
                detail: `${stats.ageSummary.averageAge}岁`
            }
        ];
        
        logicalChecks.forEach(check => {
            console.log(`${check.passed ? '✅' : '❌'} ${check.name}: ${check.detail}`);
        });
        
        const allPassed = logicalChecks.every(check => check.passed);
        console.log(`\n🎯 总体测试结果: ${allPassed ? '✅ 全部通过' : '❌ 存在问题'}`);
        
        if (allPassed) {
            console.log('\n🎉 年龄统计逻辑修复成功！');
            console.log('现在统计数据应该显示正确的按人计算的结果。');
        } else {
            console.log('\n⚠️ 仍存在逻辑问题，需要进一步排查。');
        }
        
    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        await dbManager.close();
    }
}

testAgeLogicFix().catch(console.error);