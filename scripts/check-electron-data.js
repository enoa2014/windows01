const DatabaseManager = require('../src/database/DatabaseManager');
const CareBeneficiaryManager = require('../src/services/CareBeneficiaryManager');

async function checkElectronData() {
    const dbManager = new DatabaseManager();
    // 使用Electron数据库路径
    dbManager.dbPath = 'C:\\Users\\86152\\AppData\\Roaming\\patient-checkin-manager\\patients.db';
    
    try {
        console.log('🔧 连接Electron数据库...');
        await dbManager.initialize();
        
        const careManager = new CareBeneficiaryManager(dbManager);
        const records = await careManager.getRecords({}, {limit: 3});
        
        console.log('📊 Electron数据库中的关怀服务记录:');
        console.log(`总记录数: ${records.length}`);
        
        if (records.length > 0) {
            records.forEach((r, i) => {
                console.log(`${i+1}. ${r.year}-${String(r.month).padStart(2,'0')} | ${r.service_center} | ${r.activity_name || '(空)'}`);
            });
        } else {
            console.log('❌ 没有找到关怀服务记录！');
        }
        
        // 检查统计数据
        const stats = await careManager.getStatistics();
        console.log('📈 统计数据:', stats);
        
        // 检查数据库表是否存在
        const tableInfo = await dbManager.get("SELECT name FROM sqlite_master WHERE type='table' AND name='care_beneficiary_records'");
        console.log('🗃️ 表存在性检查:', tableInfo ? '✅ 存在' : '❌ 不存在');
        
    } catch (error) {
        console.error('❌ 检查失败:', error);
    } finally {
        await dbManager.close();
    }
}

checkElectronData();