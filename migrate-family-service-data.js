/**
 * 迁移family_service_records数据到生产数据库
 */

const fs = require('fs');
const path = require('path');
const DatabaseManager = require('./src/database/DatabaseManager');

async function migrateFamilyServiceData() {
    console.log('🚀 开始迁移家庭服务数据到生产数据库');
    
    // 数据库路径
    const devDbPath = path.join(__dirname, 'data', 'patients.db');
    const prodDbPath = path.join(
        require('os').homedir(), 
        'AppData', 'Roaming', 'patient-checkin-manager', 'patients.db'
    );
    
    console.log('开发数据库:', devDbPath);
    console.log('生产数据库:', prodDbPath);
    
    // 检查文件存在性
    if (!fs.existsSync(devDbPath)) {
        throw new Error('开发数据库不存在');
    }
    
    if (!fs.existsSync(prodDbPath)) {
        throw new Error('生产数据库不存在');
    }
    
    // 连接开发数据库
    console.log('\n📖 读取开发数据库数据...');
    const devDb = new DatabaseManager(devDbPath);
    await devDb.initialize();
    
    let familyRecords = [];
    try {
        // 获取所有family_service_records数据
        familyRecords = await devDb.all('SELECT * FROM family_service_records ORDER BY id');
        console.log(`✅ 读取到 ${familyRecords.length} 条家庭服务记录`);
        
        // 显示样本数据
        if (familyRecords.length > 0) {
            console.log('📊 数据样本:');
            const sample = familyRecords[0];
            console.log(`  ID: ${sample.id}, 年月: ${sample.year_month}, 家庭数: ${sample.family_count}, 服务数: ${sample.total_service_count}`);
        }
        
    } finally {
        await devDb.close();
    }
    
    if (familyRecords.length === 0) {
        console.log('⚠️  开发数据库中没有家庭服务记录');
        return;
    }
    
    // 连接生产数据库
    console.log('\n💾 写入生产数据库...');
    const prodDb = new DatabaseManager(prodDbPath);
    await prodDb.initialize();
    
    try {
        // 检查生产数据库中是否已有数据
        const existingCount = await prodDb.get('SELECT COUNT(*) as count FROM family_service_records');
        console.log(`生产数据库现有记录数: ${existingCount.count}`);
        
        if (existingCount.count > 0) {
            console.log('🔄 清除生产数据库中的旧数据...');
            await prodDb.run('DELETE FROM family_service_records');
            await prodDb.run('DELETE FROM sqlite_sequence WHERE name = "family_service_records"');
        }
        
        // 开始事务
        await prodDb.run('BEGIN TRANSACTION');
        
        try {
            // 插入数据
            const insertSql = `
                INSERT INTO family_service_records (
                    id, sequence_number, year_month, family_count, residents_count, 
                    residence_days, accommodation_count, care_service_count, 
                    volunteer_service_count, total_service_count, notes, 
                    cumulative_residence_days, cumulative_service_count, 
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            let insertCount = 0;
            for (const record of familyRecords) {
                await prodDb.run(insertSql, [
                    record.id,
                    record.sequence_number,
                    record.year_month,
                    record.family_count,
                    record.residents_count,
                    record.residence_days,
                    record.accommodation_count,
                    record.care_service_count,
                    record.volunteer_service_count,
                    record.total_service_count,
                    record.notes,
                    record.cumulative_residence_days,
                    record.cumulative_service_count,
                    record.created_at,
                    record.updated_at
                ]);
                insertCount++;
                
                if (insertCount % 10 === 0) {
                    console.log(`  已插入 ${insertCount} / ${familyRecords.length} 条记录`);
                }
            }
            
            // 提交事务
            await prodDb.run('COMMIT');
            console.log(`✅ 成功插入 ${insertCount} 条记录`);
            
            // 验证插入结果
            const finalCount = await prodDb.get('SELECT COUNT(*) as count FROM family_service_records');
            console.log(`验证: 生产数据库现在有 ${finalCount.count} 条记录`);
            
            // 验证统计数据
            const stats = await prodDb.get(`
                SELECT 
                    SUM(family_count) as totalFamilies,
                    SUM(total_service_count) as totalServices
                FROM family_service_records
            `);
            console.log(`统计: ${stats.totalFamilies} 个家庭, ${stats.totalServices} 人次服务`);
            
        } catch (error) {
            await prodDb.run('ROLLBACK');
            throw error;
        }
        
    } finally {
        await prodDb.close();
    }
    
    console.log('\n🎉 数据迁移完成！');
    console.log('现在可以重新启动应用程序测试家庭服务功能');
}

if (require.main === module) {
    migrateFamilyServiceData().catch(console.error);
}

module.exports = migrateFamilyServiceData;