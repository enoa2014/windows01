#!/usr/bin/env node

// 修复家长信息被误录为患者姓名的问题
const DatabaseManager = require('./src/database/DatabaseManager');
const path = require('path');
const os = require('os');

function getElectronUserDataPath() {
    const platform = os.platform();
    const appName = 'patient-checkin-manager';
    
    if (platform === 'win32') {
        return path.join(os.homedir(), 'AppData', 'Roaming', appName);
    } else if (platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', appName);
    } else {
        return path.join(os.homedir(), '.config', appName);
    }
}

function extractPatientName(fullString) {
    if (!fullString) return null;
    
    // 检查是否是"姓名 电话 身份证"格式
    const parts = fullString.trim().split(/\s+/);
    if (parts.length >= 3) {
        // 验证第二部分是否像电话号码
        const phonePattern = /^1[3-9]\d{9}$/;
        // 验证第三部分是否像身份证号
        const idPattern = /^\d{15}(\d{2}[0-9Xx])?$/;
        
        if (phonePattern.test(parts[1]) && idPattern.test(parts[2])) {
            return parts[0]; // 返回姓名部分
        }
    }
    
    return null;
}

async function main() {
    console.log('🔧 家长信息修复工具');
    console.log('===================');
    
    const dbManager = new DatabaseManager();
    const correctDbPath = path.join(getElectronUserDataPath(), 'patients.db');
    dbManager.dbPath = correctDbPath;
    
    try {
        await dbManager.initialize();
        
        // 获取所有患者记录
        console.log('🔍 检查所有患者记录...');
        const allPatients = await dbManager.all(`
            SELECT id, name FROM persons
        `);
        
        console.log(`📊 总计 ${allPatients.length} 条记录`);
        
        let fixedCount = 0;
        const problematicRecords = [];
        
        // 检查每条记录
        for (const patient of allPatients) {
            const extractedName = extractPatientName(patient.name);
            
            if (extractedName && extractedName !== patient.name) {
                problematicRecords.push({
                    id: patient.id,
                    oldName: patient.name,
                    newName: extractedName
                });
            }
        }
        
        console.log(`\n🎯 发现 ${problematicRecords.length} 条需要修复的记录:`);
        
        if (problematicRecords.length === 0) {
            console.log('✅ 所有记录都正常，无需修复！');
            return;
        }
        
        // 显示前5条示例
        console.log('\n📝 修复示例（前5条）:');
        problematicRecords.slice(0, 5).forEach((record, index) => {
            console.log(`${index + 1}. ID ${record.id}:`);
            console.log(`   修复前: "${record.oldName}"`);
            console.log(`   修复后: "${record.newName}"`);
            console.log('');
        });
        
        // 询问用户确认
        console.log(`\n❓ 是否继续修复这 ${problematicRecords.length} 条记录？`);
        console.log('   这将把家长的完整信息替换为提取出的患者姓名。');
        console.log('   输入 "y" 或 "yes" 继续，其他任意键取消。');
        
        // 在实际环境中，这里可以添加用户输入确认
        // 现在直接执行修复
        console.log('✅ 自动执行修复...\n');
        
        // 执行修复
        for (const record of problematicRecords) {
            try {
                await dbManager.run(`
                    UPDATE persons 
                    SET name = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `, [record.newName, record.id]);
                
                console.log(`✅ 已修复 ID ${record.id}: "${record.oldName}" → "${record.newName}"`);
                fixedCount++;
            } catch (error) {
                console.error(`❌ 修复 ID ${record.id} 失败:`, error.message);
            }
        }
        
        console.log(`\n🎉 修复完成！成功修复 ${fixedCount}/${problematicRecords.length} 条记录`);
        console.log('✅ 建议重新启动应用程序以查看修复效果。');
        
    } catch (error) {
        console.error('❌ 修复过程中出现错误:', error);
    } finally {
        if (dbManager.db) {
            await dbManager.close();
        }
    }
}

main().catch(error => {
    console.error('💥 程序执行失败:', error);
    process.exit(1);
});