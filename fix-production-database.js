/**
 * 直接修复生产数据库的family_service_records表
 * 使用明确的数据库路径，不依赖DatabaseManager的环境检测
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 明确的数据库路径
const devDbPath = path.join(__dirname, 'data', 'patients.db');
const prodDbPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'patient-checkin-manager', 'patients.db');

// 简单的数据库连接函数
function connectDatabase(dbPath) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

// 数据库查询函数
function dbRun(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes, lastID: this.lastID });
            }
        });
    });
}

function dbAll(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function dbGet(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

async function fixProductionDatabase() {
    console.log('🔧 直接修复生产数据库');
    
    console.log('开发数据库:', devDbPath);
    console.log('生产数据库:', prodDbPath);
    
    // 检查文件存在性
    if (!fs.existsSync(devDbPath)) {
        throw new Error('开发数据库不存在');
    }
    
    if (!fs.existsSync(prodDbPath)) {
        throw new Error('生产数据库不存在');
    }
    
    let devDb = null;
    let prodDb = null;
    
    try {
        // 连接开发数据库
        console.log('\n📖 连接开发数据库...');
        devDb = await connectDatabase(devDbPath);
        
        // 检查开发数据库的表结构
        const devTables = await dbAll(devDb, "SELECT name FROM sqlite_master WHERE type='table' AND name='family_service_records'");
        if (devTables.length === 0) {
            throw new Error('开发数据库中没有family_service_records表');
        }
        console.log('✅ 开发数据库有family_service_records表');
        
        // 获取开发数据库数据
        const familyRecords = await dbAll(devDb, 'SELECT * FROM family_service_records ORDER BY id');
        console.log(`📊 读取到 ${familyRecords.length} 条家庭服务记录`);
        
        if (familyRecords.length === 0) {
            throw new Error('开发数据库中没有家庭服务数据');
        }
        
        // 连接生产数据库
        console.log('\n💾 连接生产数据库...');
        prodDb = await connectDatabase(prodDbPath);
        
        // 检查生产数据库表结构
        const prodTables = await dbAll(prodDb, "SELECT name FROM sqlite_master WHERE type='table' AND name='family_service_records'");
        console.log(`生产数据库family_service_records表存在: ${prodTables.length > 0 ? '是' : '否'}`);
        
        if (prodTables.length === 0) {
            console.log('🔨 创建family_service_records表...');
            
            // 获取开发数据库的表结构
            const createTableSql = await dbGet(devDb, 
                "SELECT sql FROM sqlite_master WHERE type='table' AND name='family_service_records'"
            );
            
            if (!createTableSql || !createTableSql.sql) {
                throw new Error('无法获取表结构');
            }
            
            console.log('表结构SQL:', createTableSql.sql);
            
            // 在生产数据库中创建表
            await dbRun(prodDb, createTableSql.sql);
            console.log('✅ 成功创建family_service_records表');
        }
        
        // 检查生产数据库现有数据
        const existingCount = await dbGet(prodDb, 'SELECT COUNT(*) as count FROM family_service_records');
        console.log(`生产数据库现有记录数: ${existingCount.count}`);
        
        if (existingCount.count > 0) {
            console.log('🔄 清除生产数据库中的旧数据...');
            await dbRun(prodDb, 'DELETE FROM family_service_records');
            await dbRun(prodDb, 'DELETE FROM sqlite_sequence WHERE name = "family_service_records"');
        }
        
        // 开始插入数据
        console.log('📝 插入数据到生产数据库...');
        
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
            await dbRun(prodDb, insertSql, [
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
        
        console.log(`✅ 成功插入 ${insertCount} 条记录`);
        
        // 验证插入结果
        const finalCount = await dbGet(prodDb, 'SELECT COUNT(*) as count FROM family_service_records');
        console.log(`验证: 生产数据库现在有 ${finalCount.count} 条记录`);
        
        // 验证统计数据
        const stats = await dbGet(prodDb, `
            SELECT 
                SUM(family_count) as totalFamilies,
                SUM(total_service_count) as totalServices
            FROM family_service_records
        `);
        console.log(`统计: ${stats.totalFamilies} 个家庭, ${stats.totalServices} 人次服务`);
        
    } finally {
        // 关闭数据库连接
        if (devDb) {
            await new Promise(resolve => devDb.close(resolve));
        }
        if (prodDb) {
            await new Promise(resolve => prodDb.close(resolve));
        }
    }
    
    console.log('\n🎉 生产数据库修复完成！');
    console.log('现在可以重新启动应用程序');
}

if (require.main === module) {
    fixProductionDatabase().catch(console.error);
}

module.exports = fixProductionDatabase;