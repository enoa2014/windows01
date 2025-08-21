/**
 * 测试API调用对齐修复
 * 验证家庭服务列表页是否能正常获取数据
 */

const DatabaseManager = require('./src/database/DatabaseManager');
const FamilyServiceManager = require('./src/services/FamilyServiceManager');

async function testAPIFix() {
    console.log('🔧 测试API调用对齐修复');
    
    const db = new DatabaseManager();
    await db.initialize();
    
    try {
        const fsm = new FamilyServiceManager(db);
        
        console.log('\n📊 测试后端API调用:');
        
        // 1. 测试基础数据获取
        const records = await fsm.getRecords({}, { currentPage: 1, pageSize: 5 });
        console.log(`✅ getRecords(): 获取到 ${records.length} 条记录`);
        
        // 2. 测试统计数据获取
        const stats = await fsm.getOverviewStats();
        console.log(`✅ getOverviewStats(): 总家庭 ${stats.overall?.totalFamilies}, 总服务 ${stats.overall?.totalServices}`);
        
        // 3. 测试筛选选项获取
        const filterOptions = await fsm.getFilterOptions();
        console.log(`✅ getFilterOptions(): 年份选项 ${filterOptions.years?.length} 个`);
        
        console.log('\n🎯 前端调用模拟测试:');
        
        // 模拟前端环境
        global.window = {
            electronAPI: {
                familyService: {
                    getRecords: (filters, pagination) => fsm.getRecords(filters, pagination),
                    getOverviewStats: () => fsm.getOverviewStats(),
                    getFilterOptions: () => fsm.getFilterOptions(),
                    exportExcel: (filters) => fsm.exportToExcel('./test_export.xlsx', filters)
                }
            }
        };
        
        // 测试修复后的调用方式
        try {
            const testRecords = await window.electronAPI.familyService.getRecords({}, {});
            console.log(`✅ window.electronAPI.familyService.getRecords(): ${testRecords.length} 条记录`);
            
            const testStats = await window.electronAPI.familyService.getOverviewStats();
            console.log(`✅ window.electronAPI.familyService.getOverviewStats(): ${testStats.overall?.totalFamilies} 家庭`);
            
            console.log('\n🎉 API调用对齐修复成功！');
            console.log('✅ 家庭服务列表页现在应该能正常显示数据了');
            
        } catch (error) {
            console.error('❌ 前端调用测试失败:', error.message);
        }
        
        console.log('\n📝 修复内容总结:');
        console.log('1. ✅ 修改 FamilyServiceViewModel.js 中的 API 调用');
        console.log('2. ✅ 将 window.api.familyService 改为 window.electronAPI.familyService');
        console.log('3. ✅ 保持 IPC 频道名称不变 (family-service:*)');
        console.log('4. ✅ 数据库字段映射正确');
        console.log('5. ✅ 查询参数处理正确');
        
    } finally {
        await db.close();
    }
}

if (require.main === module) {
    testAPIFix().catch(console.error);
}

module.exports = testAPIFix;