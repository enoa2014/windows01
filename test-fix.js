/**
 * 测试修复后的功能
 * 模拟前端调用来验证家庭服务统计数据
 */

const DatabaseManager = require('./src/database/DatabaseManager');
const FamilyServiceManager = require('./src/services/FamilyServiceManager');

async function testFix() {
    console.log('🔍 测试修复后的功能');
    
    const db = new DatabaseManager();
    await db.initialize();
    
    try {
        const fsm = new FamilyServiceManager(db);
        
        console.log('\n📊 测试家庭服务统计API调用:');
        const overviewStats = await fsm.getOverviewStats();
        
        console.log('✅ getOverviewStats() 返回结果:');
        console.log('  - 总记录数:', overviewStats.overall?.totalRecords);
        console.log('  - 总家庭数:', overviewStats.overall?.totalFamilies);
        console.log('  - 总服务人次:', overviewStats.overall?.totalServices);
        console.log('  - 平均入住天数:', overviewStats.overall?.avgDaysPerFamily);
        
        console.log('\n🎯 主页应该显示:');
        console.log('  - homeFamilyCount:', overviewStats.overall?.totalFamilies || '-');
        console.log('  - homeServiceCount:', overviewStats.overall?.totalServices || '-');
        
        if (overviewStats.overall?.totalFamilies > 0) {
            console.log('\n✅ 修复成功！主页应该能正确显示家庭服务统计数据');
        } else {
            console.log('\n⚠️  数据异常，请检查数据库内容');
        }
        
    } finally {
        await db.close();
    }
}

if (require.main === module) {
    testFix().catch(console.error);
}

module.exports = testFix;