/**
 * 最终验证生产数据库修复结果
 * 直接连接生产数据库进行验证
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const prodDbPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'patient-checkin-manager', 'patients.db');

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

async function finalVerification() {
    console.log('🔍 最终验证生产数据库');
    console.log('生产数据库路径:', prodDbPath);
    
    if (!fs.existsSync(prodDbPath)) {
        throw new Error('生产数据库不存在');
    }
    
    const db = await connectDatabase(prodDbPath);
    
    try {
        console.log('\n📋 检查所有表:');
        const tables = await dbAll(db, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        tables.forEach(table => {
            console.log(`  ✅ ${table.name}`);
        });
        
        console.log('\n🎯 family_service_records 表验证:');
        
        // 检查表是否存在
        const familyTable = await dbGet(db, 
            "SELECT name FROM sqlite_master WHERE type='table' AND name='family_service_records'"
        );
        
        if (!familyTable) {
            throw new Error('❌ family_service_records表不存在！');
        }
        console.log('✅ family_service_records表存在');
        
        // 检查记录数量
        const recordCount = await dbGet(db, 'SELECT COUNT(*) as count FROM family_service_records');
        console.log(`📊 总记录数: ${recordCount.count}`);
        
        if (recordCount.count === 0) {
            throw new Error('❌ 表中没有数据！');
        }
        
        // 检查统计数据
        const stats = await dbGet(db, `
            SELECT 
                COUNT(*) as totalRecords,
                SUM(family_count) as totalFamilies,
                SUM(residents_count) as totalResidents,
                SUM(total_service_count) as totalServices,
                SUM(residence_days) as totalResidenceDays,
                AVG(CASE WHEN family_count > 0 THEN residence_days * 1.0 / family_count ELSE 0 END) as avgDaysPerFamily,
                MIN(year_month) as firstRecordDate,
                MAX(year_month) as lastRecordDate
            FROM family_service_records
        `);
        
        console.log('📈 统计数据:');
        console.log(`  总记录数: ${stats.totalRecords}`);
        console.log(`  总家庭数: ${stats.totalFamilies}`);
        console.log(`  总住院人次: ${stats.totalResidents}`);
        console.log(`  总服务人次: ${stats.totalServices}`);
        console.log(`  总住院天数: ${stats.totalResidenceDays}`);
        console.log(`  平均住院天数/家庭: ${Math.round(stats.avgDaysPerFamily * 10) / 10}`);
        console.log(`  时间范围: ${stats.firstRecordDate} ~ ${stats.lastRecordDate}`);
        
        // 检查年份分布
        const yearData = await dbAll(db, `
            SELECT DISTINCT strftime('%Y', year_month) as year
            FROM family_service_records
            ORDER BY year DESC
        `);
        
        console.log('📅 年份分布:');
        yearData.forEach(item => {
            console.log(`  ${item.year}`);
        });
        
        // 显示样本数据
        console.log('\n📝 样本数据:');
        const samples = await dbAll(db, 
            'SELECT year_month, family_count, total_service_count, notes FROM family_service_records ORDER BY year_month DESC LIMIT 3'
        );
        
        samples.forEach((sample, i) => {
            console.log(`  ${i + 1}. ${sample.year_month}: ${sample.family_count}家庭, ${sample.total_service_count}服务 - ${sample.notes || '无备注'}`);
        });
        
        console.log('\n✅ 生产数据库验证成功！');
        console.log('🎉 应用现在应该能正常启动并显示家庭服务数据');
        
    } finally {
        await new Promise(resolve => db.close(resolve));
    }
}

if (require.main === module) {
    finalVerification().catch(console.error);
}

module.exports = finalVerification;