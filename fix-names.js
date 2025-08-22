#!/usr/bin/env node

// 姓名显示问题修复脚本
// 用法: node fix-names.js

const DatabaseManager = require('./src/database/DatabaseManager');
const DataFixer = require('./src/utils/DataFixer');
const path = require('path');
const os = require('os');

// 在Node.js环境中模拟Electron的app.getPath('userData')
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

async function main() {
    console.log('🏥 患儿入住信息管理系统 - 姓名修复工具');
    console.log('==========================================');
    
    // 创建DatabaseManager实例，并设置正确的数据库路径
    const dbManager = new DatabaseManager();
    const correctDbPath = path.join(getElectronUserDataPath(), 'patients.db');
    dbManager.dbPath = correctDbPath;
    
    console.log(`📂 数据库路径: ${correctDbPath}`);
    
    try {
        // 初始化数据库连接
        console.log('🔌 连接数据库...');
        await dbManager.initialize();
        
        // 生成修复前的报告
        console.log('\n📊 修复前数据分析:');
        const beforeReport = await DataFixer.generateFixReport(dbManager);
        
        if (beforeReport.suspicious === 0) {
            console.log('✅ 未检测到需要修复的姓名问题，数据看起来正常！');
            return;
        }
        
        // 执行修复
        console.log('\n🔧 开始执行修复...');
        const fixResult = await DataFixer.fixNameDisplayIssue(dbManager);
        
        // 生成修复后的报告
        console.log('\n📊 修复后数据分析:');
        const afterReport = await DataFixer.generateFixReport(dbManager);
        
        // 显示修复结果摘要
        console.log('\n🎯 修复结果摘要:');
        console.log(`  检查的记录数: ${fixResult.total}`);
        console.log(`  成功修复的记录数: ${fixResult.fixed}`);
        console.log(`  修复前可疑记录数: ${beforeReport.suspicious}`);
        console.log(`  修复后可疑记录数: ${afterReport.suspicious}`);
        
        if (fixResult.fixed > 0) {
            console.log('\n✅ 修复完成！建议重新启动应用以查看修复效果。');
        } else if (fixResult.total > 0) {
            console.log('\n⚠️  检测到问题但无法自动修复，请检查Excel导入的字段映射。');
            console.log('   建议检查Excel文件的表头是否正确标记了"姓名"字段。');
        }
        
        // 提供手动修复建议
        if (afterReport.suspicious > 0) {
            console.log('\n💡 手动修复建议:');
            console.log('   1. 检查Excel文件的表头结构');
            console.log('   2. 确保"姓名"列包含的是患者姓名而非家属姓名');
            console.log('   3. 如果需要，可以重新导入数据');
            console.log('   4. 或联系技术支持获取帮助');
        }
        
    } catch (error) {
        console.error('❌ 修复过程中出现错误:', error);
        console.error('请联系技术支持或检查日志获取更多信息。');
        process.exit(1);
    } finally {
        // 关闭数据库连接
        if (dbManager.db) {
            await dbManager.close();
            console.log('\n🔌 数据库连接已关闭');
        }
    }
}

// 运行主程序
main().catch(error => {
    console.error('💥 程序执行失败:', error);
    process.exit(1);
});