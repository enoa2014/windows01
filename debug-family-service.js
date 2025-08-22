/**
 * Family Service Debug Script
 * Debug the family service data loading issue
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DatabaseManager = require('./src/database/DatabaseManager');
const FamilyServiceManager = require('./src/services/FamilyServiceManager');

async function debugFamilyService() {
    try {
        console.log('🔍 开始调试家庭服务数据加载...');
        
        // 初始化数据库
        const dbManager = new DatabaseManager();
        await dbManager.initialize();
        console.log('✅ 数据库初始化成功');
        
        // 初始化家庭服务管理器
        const familyServiceManager = new FamilyServiceManager(dbManager);
        console.log('✅ 家庭服务管理器初始化成功');
        
        // 测试 getOverviewStats
        console.log('\n📊 测试概览统计...');
        const overviewStats = await familyServiceManager.getOverviewStats();
        console.log('概览统计结果:', JSON.stringify(overviewStats, null, 2));
        
        // 测试 getRecords
        console.log('\n📋 测试记录获取...');
        const records = await familyServiceManager.getRecords({}, { currentPage: 1, pageSize: 5 });
        console.log('记录数量:', records.length);
        console.log('前5条记录:', JSON.stringify(records.slice(0, 3), null, 2));
        
        // 测试数据库直接查询
        console.log('\n🗄️ 测试数据库直接查询...');
        const directCount = await dbManager.get('SELECT COUNT(*) as count FROM family_service_records');
        console.log('直接查询记录数:', directCount);
        
        const directSample = await dbManager.all('SELECT * FROM family_service_records LIMIT 3');
        console.log('直接查询样本:', JSON.stringify(directSample, null, 2));
        
        await dbManager.close();
        console.log('\n✅ 调试完成');
        
    } catch (error) {
        console.error('❌ 调试过程中出错:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 如果直接运行这个脚本
if (require.main === module) {
    debugFamilyService();
}

module.exports = debugFamilyService;