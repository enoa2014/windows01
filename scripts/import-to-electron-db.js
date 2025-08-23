const DatabaseManager = require('../src/database/DatabaseManager');
const CareBeneficiaryManager = require('../src/services/CareBeneficiaryManager');
const path = require('path');

async function importToElectronDB() {
    const dbManager = new DatabaseManager();
    // 使用Electron的数据库路径
    dbManager.dbPath = 'C:\\Users\\86152\\AppData\\Roaming\\patient-checkin-manager\\patients.db';
    
    try {
        console.log('🔧 连接Electron数据库...');
        await dbManager.initialize();
        
        const careManager = new CareBeneficiaryManager(dbManager);
        
        console.log('📂 开始导入 2024.xls 到 Electron 数据库...');
        const filePath = path.join(__dirname, '../2024.xls');
        
        const result = await careManager.importFromExcel(filePath);
        
        console.log('✅ 导入完成!');
        console.log(`📊 导入结果: 成功导入 ${result.imported || result} 条记录`);
        
        // 验证导入结果
        const records = await careManager.getRecords({}, { limit: 5 });
        console.log('🔍 验证导入结果 (前5条):');
        records.forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.year}-${String(record.month).padStart(2,'0')} | ${record.service_center || '(空)'} | ${record.activity_name || '(空)'} | 受益: ${record.total_beneficiaries}`);
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
importToElectronDB();