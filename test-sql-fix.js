const DatabaseManager = require('./src/database/DatabaseManager.js');

async function testSqlFix() {
    const dbManager = new DatabaseManager();
    
    try {
        await dbManager.initialize();
        
        console.log('🔧 SQL语法修复测试');
        console.log('='.repeat(40));
        
        console.log('\n✅ 测试年龄统计查询...');
        
        // 测试修复后的统计查询
        const stats = await dbManager.getExtendedStatistics();
        
        console.log('查询执行成功！');
        console.log(`总患者数: ${stats.totalPatients} 人`);
        console.log(`总记录数: ${stats.totalRecords} 条`);
        console.log(`平均年龄: ${stats.averageAge} 岁`);
        console.log(`多次入住: ${stats.multipleAdmissions} 人`);
        
        console.log('\n📊 年龄摘要:');
        console.log(`总计: ${stats.ageSummary.totalCount} 人`);
        console.log(`有效年龄: ${stats.ageSummary.validCount} 人`);
        console.log(`有效比例: ${stats.ageSummary.validPercentage}%`);
        console.log(`平均年龄: ${stats.ageSummary.averageAge} 岁`);
        console.log(`年龄范围: ${stats.ageSummary.minAge} - ${stats.ageSummary.maxAge} 岁`);
        
        console.log('\n📈 年龄分布:');
        if (stats.ageDistribution && stats.ageDistribution.length > 0) {
            stats.ageDistribution.forEach(range => {
                console.log(`${range.age_range}: ${range.count}人 (${range.percentage}%)`);
            });
        } else {
            console.log('无年龄分布数据');
        }
        
        // 数据一致性检验
        console.log('\n✅ 数据一致性检验:');
        const checks = [
            {
                name: '总患者数一致',
                pass: stats.totalPatients === stats.ageSummary.totalCount,
                detail: `${stats.totalPatients} === ${stats.ageSummary.totalCount}`
            },
            {
                name: '有效年龄 ≤ 总数',
                pass: stats.ageSummary.validCount <= stats.totalPatients,
                detail: `${stats.ageSummary.validCount} ≤ ${stats.totalPatients}`
            },
            {
                name: '年龄分布不为空',
                pass: stats.ageDistribution && stats.ageDistribution.length > 0,
                detail: `${stats.ageDistribution ? stats.ageDistribution.length : 0} 个年龄段`
            }
        ];
        
        checks.forEach(check => {
            console.log(`${check.pass ? '✅' : '❌'} ${check.name}: ${check.detail}`);
        });
        
        const allPass = checks.every(check => check.pass);
        console.log(`\n🎯 修复状态: ${allPass ? '✅ 成功' : '❌ 仍有问题'}`);
        
        if (allPass) {
            console.log('\n🎉 SQL语法错误已修复！应用现在可以正常启动了。');
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        
        if (error.message.includes('no such column')) {
            console.log('\n🔍 仍然存在SQL语法错误:');
            console.log('错误位置:', error.message);
        }
    } finally {
        await dbManager.close();
    }
}

testSqlFix().catch(console.error);