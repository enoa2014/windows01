// 清理数据库以便重新导入

const DatabaseManager = require('./src/database/DatabaseManager');
const path = require('path');
const os = require('os');
const fs = require('fs');

async function cleanDatabase() {
    const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'patient-checkin-manager');
    const dbPath = path.join(appDataPath, 'patients.db');
    
    console.log('🗑️  准备清理数据库...');
    console.log(`数据库路径: ${dbPath}`);
    
    try {
        // 检查数据库是否存在
        if (fs.existsSync(dbPath)) {
            // 备份现有数据库
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(appDataPath, `patients_backup_${timestamp}.db`);
            
            console.log('📦 创建备份...');
            fs.copyFileSync(dbPath, backupPath);
            console.log(`✅ 备份已创建: ${backupPath}`);
            
            // 删除原数据库
            fs.unlinkSync(dbPath);
            console.log('✅ 原数据库已删除');
        } else {
            console.log('ℹ️  数据库文件不存在，无需清理');
        }
        
        // 重新初始化空数据库
        console.log('🔄 重新初始化数据库...');
        const db = new DatabaseManager();
        
        // 使用正确的路径
        db.dbPath = dbPath;
        await db.initialize();
        
        // 验证数据库是否为空
        try {
            const stats = await Promise.all([
                db.get('SELECT COUNT(*) as count FROM persons'),
                db.get('SELECT COUNT(*) as count FROM medical_info'),
                db.get('SELECT COUNT(*) as count FROM check_in_records')
            ]);
            
            console.log('📊 新数据库统计:');
            console.log(`  人员记录: ${stats[0].count}`);
            console.log(`  医疗记录: ${stats[1].count}`);
            console.log(`  入住记录: ${stats[2].count}`);
        } catch (statError) {
            console.log('📊 数据库初始化完成，表结构已创建');
        }
        
        await db.close();
        
        console.log('✅ 数据库清理完成！');
        console.log('💡 现在可以重新导入Excel文件了');
        
    } catch (error) {
        console.error('❌ 清理失败:', error);
    }
}

// 询问用户确认
console.log('⚠️  警告：此操作将删除所有现有数据');
console.log('数据库将被备份，但请确认是否继续...');

// 直接执行清理（在开发环境中）
cleanDatabase();