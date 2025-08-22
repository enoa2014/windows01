/**
 * 验证生产数据库的家庭服务数据
 */

const path = require('path');
const DatabaseManager = require('./src/database/DatabaseManager');
const FamilyServiceManager = require('./src/services/FamilyServiceManager');

async function verifyProductionDatabase() {
    console.log('🔍 验证生产数据库');
    
    // 生产数据库路径
    const prodDbPath = path.join(
        require('os').homedir(), 
        'AppData', 'Roaming', 'patient-checkin-manager', 'patients.db'
    );
    
    console.log('生产数据库路径:', prodDbPath);
    
    // 使用默认的DatabaseManager（应该会使用生产数据库路径）
    const db = new DatabaseManager();
    await db.initialize();
    
    try {
        console.log('\n📊 表结构检查:');
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        tables.forEach(table => {
            console.log(`  ✅ ${table.name}`);
        });
        
        const hasFamilyTable = tables.some(t => t.name === 'family_service_records');
        console.log(`\nfamily_service_records 表存在: ${hasFamilyTable ? '✅ 是' : '❌ 否'}`);
        
        if (hasFamilyTable) {
            console.log('\n📈 数据验证:');
            
            // 基础数据统计
            const recordCount = await db.get('SELECT COUNT(*) as count FROM family_service_records');
            console.log(`总记录数: ${recordCount.count}`);
            
            const stats = await db.get(`
                SELECT 
                    SUM(family_count) as totalFamilies,
                    SUM(total_service_count) as totalServices,
                    MIN(year_month) as firstDate,
                    MAX(year_month) as lastDate
                FROM family_service_records
            `);
            
            console.log(`总家庭数: ${stats.totalFamilies}`);
            console.log(`总服务人次: ${stats.totalServices}`);
            console.log(`时间范围: ${stats.firstDate} ~ ${stats.lastDate}`);
            
            // 使用FamilyServiceManager测试
            console.log('\n🧪 FamilyServiceManager测试:');
            const fsm = new FamilyServiceManager(db);
            
            try {
                const overviewStats = await fsm.getOverviewStats();
                console.log('✅ getOverviewStats() 成功');
                console.log(`  总家庭: ${overviewStats.overall?.totalFamilies}`);
                console.log(`  总服务: ${overviewStats.overall?.totalServices}`);
                
                const filterOptions = await fsm.getFilterOptions();
                console.log('✅ getFilterOptions() 成功');
                console.log(`  年份选项: ${filterOptions.years?.length} 个`);
                
                const records = await fsm.getRecords({}, { currentPage: 1, pageSize: 3 });
                console.log('✅ getRecords() 成功');
                console.log(`  获取记录: ${records.length} 条`);
                
                console.log('\n🎯 模拟应用启动时的调用:');
                
                // 模拟主页统计调用
                const homeStats = await fsm.getOverviewStats();
                if (homeStats?.overall) {
                    console.log(`✅ 主页统计: 家庭 ${homeStats.overall.totalFamilies}, 服务 ${homeStats.overall.totalServices}`);
                } else {
                    console.log('❌ 主页统计获取失败');
                }
                
            } catch (fsmError) {
                console.error('❌ FamilyServiceManager 测试失败:', fsmError.message);
            }
        }
        
    } finally {
        await db.close();
    }
    
    console.log('\n✅ 生产数据库验证完成');
    console.log('应用现在应该能正常启动并显示家庭服务数据');
}

if (require.main === module) {
    verifyProductionDatabase().catch(console.error);
}

module.exports = verifyProductionDatabase;