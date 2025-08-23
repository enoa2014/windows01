const DatabaseManager = require('../src/database/DatabaseManager');
const CareBeneficiaryManager = require('../src/services/CareBeneficiaryManager');
const path = require('path');

async function importCareService() {
    const dbManager = new DatabaseManager();
    const careManager = new CareBeneficiaryManager(dbManager);
    
    try {
        console.log('🔧 初始化数据库连接...');
        await dbManager.initialize();
        
        console.log('📂 开始导入 2024.xls 关怀服务数据...');
        const filePath = path.join(__dirname, '../2024.xls');
        
        const result = await careManager.importFromExcel(filePath);
        
        console.log('✅ 导入完成!');
        console.log(`📊 导入结果: 成功导入 ${result.imported || result} 条记录`);
        
        // 验证导入结果
        const records = await careManager.getRecords({}, { limit: 5 });
        console.log('🔍 验证导入结果 (前5条):');
        records.forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.year}-${String(record.month).padStart(2,'0')} | ${record.service_center} | ${record.activity_name} | 受益: ${record.total_beneficiaries}`);
        });
        
        // 获取统计信息
        const stats = await careManager.getStatistics();
        console.log('📈 统计信息:');
        console.log(`  总记录数: ${stats.totalRecords}`);
        console.log(`  总受益人次: ${stats.totalBeneficiaries}`);
        console.log(`  总志愿者: ${stats.totalVolunteers}`);
        console.log(`  总服务时长: ${stats.totalHours}小时`);
        
    } catch (error) {
        console.error('❌ 导入失败:', error.message);
        console.error(error);
    } finally {
        await dbManager.close();
    }
}

// 运行导入
importCareService();