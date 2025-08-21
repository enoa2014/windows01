/**
 * 诊断数据库位置和表结构差异
 */

const fs = require('fs');
const path = require('path');
const DatabaseManager = require('./src/database/DatabaseManager');

async function diagnoseDatabases() {
    console.log('🔍 诊断数据库位置和表结构');
    
    // 开发数据库路径
    const devDbPath = path.join(__dirname, 'data', 'patients.db');
    
    // 生产数据库路径  
    const prodDbPath = path.join(
        require('os').homedir(), 
        'AppData', 'Roaming', 'patient-checkin-manager', 'patients.db'
    );
    
    console.log('\n📂 数据库路径:');
    console.log('开发数据库:', devDbPath);
    console.log('生产数据库:', prodDbPath);
    
    console.log('\n📊 文件存在性检查:');
    console.log('开发数据库存在:', fs.existsSync(devDbPath));
    console.log('生产数据库存在:', fs.existsSync(prodDbPath));
    
    if (fs.existsSync(devDbPath)) {
        const devStats = fs.statSync(devDbPath);
        console.log(`开发数据库大小: ${(devStats.size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    if (fs.existsSync(prodDbPath)) {
        const prodStats = fs.statSync(prodDbPath);
        console.log(`生产数据库大小: ${(prodStats.size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // 检查开发数据库表结构
    if (fs.existsSync(devDbPath)) {
        console.log('\n🏗️ 开发数据库表结构:');
        const devDb = new DatabaseManager(devDbPath);
        await devDb.initialize();
        
        try {
            const devTables = await devDb.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
            devTables.forEach(table => console.log(`  ✅ ${table.name}`));
            
            // 检查family_service_records数据
            const devFamilyRecords = await devDb.all('SELECT COUNT(*) as count FROM family_service_records');
            console.log(`  📊 family_service_records: ${devFamilyRecords[0].count} 条记录`);
            
        } catch (error) {
            console.log(`  ❌ 查询失败: ${error.message}`);
        } finally {
            await devDb.close();
        }
    }
    
    // 检查生产数据库表结构
    if (fs.existsSync(prodDbPath)) {
        console.log('\n🏭 生产数据库表结构:');
        const prodDb = new DatabaseManager(prodDbPath);
        await prodDb.initialize();
        
        try {
            const prodTables = await prodDb.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
            prodTables.forEach(table => console.log(`  ✅ ${table.name}`));
            
            // 检查是否有family_service_records表
            const hasFamilyTable = prodTables.some(t => t.name === 'family_service_records');
            if (!hasFamilyTable) {
                console.log('  ❌ 缺少 family_service_records 表');
            }
            
        } catch (error) {
            console.log(`  ❌ 查询失败: ${error.message}`);
        } finally {
            await prodDb.close();
        }
    }
    
    console.log('\n🎯 解决方案:');
    console.log('需要将开发数据库中的 family_service_records 表和数据迁移到生产数据库');
}

if (require.main === module) {
    diagnoseDatabases().catch(console.error);
}

module.exports = diagnoseDatabases;