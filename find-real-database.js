const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function findRealDatabase() {
    console.log('🔍 查找真实的数据库文件');
    console.log('='.repeat(50));
    
    // Electron应用的常见用户数据目录路径
    const possiblePaths = [
        // Windows AppData路径
        path.join(os.homedir(), 'AppData', 'Roaming', 'app02', 'patients.db'),
        path.join(os.homedir(), 'AppData', 'Local', 'app02', 'patients.db'),
        // 项目目录
        path.join(__dirname, 'data', 'patients.db'),
        path.join(__dirname, 'patients.db'),
        // 常见的Electron应用名称
        path.join(os.homedir(), 'AppData', 'Roaming', 'medical-records', 'patients.db'),
        path.join(os.homedir(), 'AppData', 'Roaming', 'patient-management', 'patients.db'),
    ];
    
    console.log('📁 检查可能的数据库位置:');
    
    for (const dbPath of possiblePaths) {
        try {
            const stats = await fs.stat(dbPath);
            console.log(`✅ 找到: ${dbPath}`);
            console.log(`   文件大小: ${stats.size} bytes`);
            console.log(`   修改时间: ${stats.mtime.toLocaleString()}`);
            
            // 如果文件大小 > 10KB，很可能包含数据
            if (stats.size > 10240) {
                console.log(`   📊 可能包含数据 (${Math.round(stats.size / 1024)}KB)`);
                
                // 尝试读取这个数据库
                await testDatabase(dbPath);
            }
            console.log('');
        } catch (error) {
            console.log(`❌ 未找到: ${dbPath}`);
        }
    }
    
    // 也搜索整个用户目录中的patients.db文件
    console.log('🔍 在用户目录中搜索patients.db文件...');
    try {
        await searchForPatientsDb(os.homedir());
    } catch (error) {
        console.log('搜索过程中出现错误:', error.message);
    }
}

async function testDatabase(dbPath) {
    try {
        const DatabaseManager = require('./src/database/DatabaseManager.js');
        
        // 临时修改数据库路径
        const dbManager = new DatabaseManager();
        dbManager.dbPath = dbPath;
        
        await dbManager.initialize();
        
        const stats = await dbManager.getStatistics();
        console.log(`   📈 数据库内容: ${stats.totalPatients}个患者, ${stats.totalRecords}条记录`);
        
        if (stats.totalPatients > 0) {
            console.log(`   🎯 这可能就是我们要找的数据库！`);
            
            // 测试修复后的SQL查询
            const extendedStats = await dbManager.getExtendedStatistics();
            console.log(`   ✅ SQL修复测试成功！`);
            console.log(`   📊 有效年龄记录: ${extendedStats.ageSummary.validCount}人`);
            
            // 快速一致性检验
            const ageTotal = extendedStats.ageDistribution.reduce((sum, range) => sum + range.count, 0);
            console.log(`   🔄 数据一致性: 年龄分布总计=${ageTotal}, 有效记录=${extendedStats.ageSummary.validCount}`);
            console.log(`   ${ageTotal === extendedStats.ageSummary.validCount ? '✅ 一致' : '❌ 不一致'}`);
        }
        
        await dbManager.close();
    } catch (error) {
        console.log(`   ❌ 数据库测试失败: ${error.message}`);
    }
}

async function searchForPatientsDb(dir, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return;
    
    try {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            
            try {
                const stats = await fs.stat(fullPath);
                
                if (stats.isFile() && item === 'patients.db') {
                    console.log(`🎯 找到可能的数据库: ${fullPath}`);
                    console.log(`   文件大小: ${Math.round(stats.size / 1024)}KB`);
                    
                    if (stats.size > 10240) {
                        await testDatabase(fullPath);
                    }
                } else if (stats.isDirectory() && !item.startsWith('.') && 
                          !['node_modules', 'System Volume Information'].includes(item)) {
                    await searchForPatientsDb(fullPath, maxDepth, currentDepth + 1);
                }
            } catch (error) {
                // 跳过无法访问的文件/文件夹
            }
        }
    } catch (error) {
        // 跳过无法读取的目录
    }
}

findRealDatabase().catch(console.error);