/**
 * 家庭服务显示问题修复脚本
 * 问题: 页面显示空数据，因为最新记录都是0值，被优先显示
 * 解决方案: 删除空数据记录或修改排序逻辑
 */

const DatabaseManager = require('./src/database/DatabaseManager');

async function fixFamilyServiceDisplay() {
    const db = new DatabaseManager();
    await db.initialize();
    
    try {
        console.log('🔍 诊断家庭服务显示问题...');
        
        // 1. 统计数据情况
        const totalRecords = await db.get('SELECT COUNT(*) as total FROM family_service_records');
        const emptyRecords = await db.get('SELECT COUNT(*) as empty FROM family_service_records WHERE family_count = 0 AND total_service_count = 0');
        const validRecords = await db.get('SELECT COUNT(*) as valid FROM family_service_records WHERE family_count > 0 OR total_service_count > 0');
        
        console.log(`📊 数据统计:`);
        console.log(`  总记录数: ${totalRecords.total}`);
        console.log(`  空数据记录: ${emptyRecords.empty}`);
        console.log(`  有效数据记录: ${validRecords.valid}`);
        
        // 2. 显示空数据记录
        const emptyList = await db.all(`
            SELECT id, year_month, family_count, total_service_count 
            FROM family_service_records 
            WHERE family_count = 0 AND total_service_count = 0 
            ORDER BY year_month DESC 
            LIMIT 10
        `);
        
        console.log(`\\n🗑️  空数据记录 (前10条):`);
        emptyList.forEach(record => {
            console.log(`  ID ${record.id}: ${record.year_month} - 家庭数:${record.family_count}, 服务人次:${record.total_service_count}`);
        });
        
        // 3. 显示有效数据记录
        const validList = await db.all(`
            SELECT id, year_month, family_count, total_service_count 
            FROM family_service_records 
            WHERE family_count > 0 OR total_service_count > 0 
            ORDER BY year_month DESC 
            LIMIT 5
        `);
        
        console.log(`\\n✅ 有效数据记录 (前5条):`);
        validList.forEach(record => {
            console.log(`  ID ${record.id}: ${record.year_month} - 家庭数:${record.family_count}, 服务人次:${record.total_service_count}`);
        });
        
        // 4. 提供修复选项
        console.log(`\\n🛠️  修复方案:`);
        console.log(`  方案1: 删除所有空数据记录 (推荐)`);
        console.log(`  方案2: 修改前端排序逻辑，优先显示有数据的记录`);
        console.log(`  方案3: 过滤掉家庭数和服务人次都为0的记录`);
        
        console.log(`\\n执行修复:`);
        console.log(`  方案1: node fix-family-service-display.js --delete-empty`);
        console.log(`  方案2: 修改 FamilyServiceManager.js 的排序逻辑`);
        console.log(`  方案3: 修改查询条件过滤空记录`);
        
        // 检查命令行参数
        const args = process.argv.slice(2);
        
        if (args.includes('--delete-empty')) {
            console.log(`\\n🗑️  删除空数据记录...`);
            const deleteResult = await db.run(`
                DELETE FROM family_service_records 
                WHERE family_count = 0 AND total_service_count = 0
            `);
            console.log(`✅ 已删除 ${deleteResult.changes} 条空数据记录`);
            
            // 重新统计
            const newTotal = await db.get('SELECT COUNT(*) as total FROM family_service_records');
            console.log(`📊 删除后剩余记录数: ${newTotal.total}`);
        }
        
        if (args.includes('--show-valid-only')) {
            console.log(`\\n🔍 测试只显示有效数据的查询...`);
            const testQuery = await db.all(`
                SELECT id, year_month, family_count, total_service_count, notes
                FROM family_service_records 
                WHERE family_count > 0 OR total_service_count > 0
                ORDER BY year_month DESC 
                LIMIT 12
            `);
            console.log(`✅ 有效数据查询结果 (${testQuery.length} 条):`);
            testQuery.forEach((record, index) => {
                console.log(`  ${index + 1}. ${record.year_month}: 家庭${record.family_count}, 服务${record.total_service_count}`);
            });
        }
        
    } finally {
        await db.close();
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    fixFamilyServiceDisplay().catch(console.error);
}

module.exports = fixFamilyServiceDisplay;