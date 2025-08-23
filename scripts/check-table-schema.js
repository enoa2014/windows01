const DatabaseManager = require('../src/database/DatabaseManager');

async function checkTableSchema() {
    const dbManager = new DatabaseManager();
    dbManager.dbPath = 'C:\\Users\\86152\\AppData\\Roaming\\patient-checkin-manager\\patients.db';
    
    try {
        console.log('🔧 连接Electron数据库...');
        await dbManager.initialize();
        
        // 检查表结构
        const schema = await dbManager.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='care_beneficiary_records'");
        console.log('🗃️ 表结构:');
        console.log(schema ? schema.sql : '表不存在');
        
        // 检查表中的记录数
        const count = await dbManager.get("SELECT COUNT(*) as count FROM care_beneficiary_records");
        console.log(`📊 记录数: ${count.count}`);
        
        // 如果有记录，显示一些样本
        if (count.count > 0) {
            const samples = await dbManager.all("SELECT * FROM care_beneficiary_records LIMIT 3");
            console.log('📋 样本记录:');
            samples.forEach((r, i) => {
                console.log(`${i+1}. ID:${r.id} | ${r.year}-${r.month} | ${r.service_center} | ${r.activity_name}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error);
    } finally {
        await dbManager.close();
    }
}

checkTableSchema();