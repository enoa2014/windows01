const DatabaseManager = require('./src/database/DatabaseManager.js');
const path = require('path');

async function checkDatabasePath() {
    const dbManager = new DatabaseManager();
    
    console.log('🔍 数据库路径检查');
    console.log('='.repeat(40));
    
    // 显示数据库路径
    console.log(`数据库路径: ${dbManager.dbPath}`);
    
    try {
        await dbManager.initialize();
        
        // 检查数据库内容
        const stats = await dbManager.getStatistics();
        console.log(`\n📊 数据库内容:`);
        console.log(`总患者数: ${stats.totalPatients} 人`);
        console.log(`总记录数: ${stats.totalRecords} 条`);
        
        if (stats.totalPatients > 0) {
            console.log('\n✅ 找到了包含数据的数据库！');
            
            // 测试修复后的查询
            const extendedStats = await dbManager.getExtendedStatistics();
            console.log(`\n📈 修复后的统计结果:`);
            console.log(`总患者数: ${extendedStats.totalPatients} 人`);
            console.log(`有效年龄记录: ${extendedStats.ageSummary.validCount} 人`);
            console.log(`平均年龄: ${extendedStats.ageSummary.averageAge} 岁`);
            
            // 年龄分布验证
            let ageDistributionTotal = 0;
            console.log('\n📊 年龄分布:');
            extendedStats.ageDistribution.forEach(range => {
                console.log(`  ${range.age_range}: ${range.count}人`);
                ageDistributionTotal += range.count;
            });
            
            console.log(`\n✅ 数据一致性检验:`);
            console.log(`年龄分布总计: ${ageDistributionTotal} 人`);
            console.log(`与有效年龄记录匹配: ${ageDistributionTotal === extendedStats.ageSummary.validCount ? '✅' : '❌'}`);
            console.log(`每个年龄段 ≤ 总患者数: ${extendedStats.ageDistribution.every(r => r.count <= extendedStats.totalPatients) ? '✅' : '❌'}`);
            
        } else {
            console.log('\n⚠️ 当前数据库为空，需要找到包含数据的数据库文件');
        }
        
    } catch (error) {
        console.error('❌ 数据库操作失败:', error.message);
    } finally {
        await dbManager.close();
    }
}

checkDatabasePath().catch(console.error);