/**
 * 测试从主页到家庭服务页面的完整数据流
 */

const DatabaseManager = require('./src/database/DatabaseManager');
const FamilyServiceManager = require('./src/services/FamilyServiceManager');

async function testFamilyServiceNavigation() {
    console.log('🔍 测试家庭服务页面导航和数据加载流程');
    
    const db = new DatabaseManager();
    await db.initialize();
    
    try {
        console.log('\n📊 1. 测试主页统计数据获取');
        
        // 测试主页应该显示的家庭服务概览数据
        const fsm = new FamilyServiceManager(db);
        const homeStats = await fsm.getOverviewStats();
        
        console.log('主页应该显示的家庭服务统计:');
        console.log('  - 总家庭数量:', homeStats.overall?.totalFamilies || '未获取');
        console.log('  - 总服务人次:', homeStats.overall?.totalServices || '未获取');
        console.log('  - 今年记录数:', homeStats.currentYear?.recordsThisYear || '未获取');
        
        console.log('\n🔄 2. 测试页面初始化时的数据加载');
        
        // 测试页面初始化时会调用的API
        const overviewStats = await fsm.getOverviewStats();
        console.log('getOverviewStats() 调用成功:', !!overviewStats.overall);
        
        const filterOptions = await fsm.getFilterOptions();
        console.log('getFilterOptions() 调用成功:', !!filterOptions.years);
        console.log('可用年份:', filterOptions.years);
        
        const records = await fsm.getRecords({}, { currentPage: 1, pageSize: 12 });
        console.log('getRecords() 调用成功，记录数:', records.length);
        
        console.log('\n🔍 3. 检查记录数据质量');
        
        // 分析记录数据质量
        const validRecords = records.filter(r => r.family_count > 0 || r.total_service_count > 0);
        const emptyRecords = records.filter(r => r.family_count === 0 && r.total_service_count === 0);
        
        console.log(`总记录: ${records.length}, 有效记录: ${validRecords.length}, 空记录: ${emptyRecords.length}`);
        
        if (emptyRecords.length > 0) {
            console.log('\n⚠️  发现空记录问题:');
            console.log('前3条空记录:');
            emptyRecords.slice(0, 3).forEach(record => {
                console.log(`  ${record.year_month}: 家庭${record.family_count}, 服务${record.total_service_count}`);
            });
        }
        
        if (validRecords.length > 0) {
            console.log('\n✅ 有效记录示例:');
            validRecords.slice(0, 3).forEach(record => {
                console.log(`  ${record.year_month}: 家庭${record.family_count}, 服务${record.total_service_count}`);
            });
        }
        
        console.log('\n🎯 4. 模拟前端排序和分页');
        
        // 测试默认排序 (date-desc)
        const sortedRecords = records.sort((a, b) => new Date(b.year_month) - new Date(a.year_month));
        console.log('默认排序后前3条记录:');
        sortedRecords.slice(0, 3).forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.year_month}: 家庭${record.family_count}, 服务${record.total_service_count}`);
        });
        
        // 测试过滤有效记录的排序
        const validSortedRecords = validRecords.sort((a, b) => new Date(b.year_month) - new Date(a.year_month));
        console.log('\n过滤空记录后的排序结果:');
        validSortedRecords.slice(0, 3).forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.year_month}: 家庭${record.family_count}, 服务${record.total_service_count}`);
        });
        
        console.log('\n📋 5. 测试IPC调用链路');
        
        // 检查IPC处理器是否正确注册
        console.log('应该注册的IPC频道:');
        console.log('  - family-service:get-overview-stats');
        console.log('  - family-service:get-records');
        console.log('  - family-service:get-filter-options');
        
        console.log('\n✅ 测试完成');
        console.log('\n💡 结论:');
        
        if (emptyRecords.length > validRecords.length) {
            console.log('❌ 主要问题: 空记录占主导，导致页面显示无数据');
            console.log('🔧 解决方案: 删除空记录或修改查询逻辑过滤空记录');
        } else if (validRecords.length === 0) {
            console.log('❌ 主要问题: 没有有效数据');
            console.log('🔧 解决方案: 需要导入实际的家庭服务数据');
        } else {
            console.log('✅ 数据正常，可能是前端显示逻辑问题');
        }
        
    } finally {
        await db.close();
    }
}

if (require.main === module) {
    testFamilyServiceNavigation().catch(console.error);
}

module.exports = testFamilyServiceNavigation;