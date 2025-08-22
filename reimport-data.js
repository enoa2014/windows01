#!/usr/bin/env node

// 重新导入Excel数据
const DatabaseManager = require('./src/database/DatabaseManager');
const ExcelImporter = require('./src/services/ExcelImporter');
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

async function main() {
    console.log('🔄 重新导入Excel数据');
    console.log('===================');
    
    const dbManager = new DatabaseManager();
    const correctDbPath = path.join(getElectronUserDataPath(), 'patients.db');
    dbManager.dbPath = correctDbPath;
    
    try {
        await dbManager.initialize();
        
        // 1. 清除现有数据
        console.log('🗑️  清除现有数据...');
        await dbManager.run('DELETE FROM family_info');
        await dbManager.run('DELETE FROM medical_info');
        await dbManager.run('DELETE FROM persons');
        await dbManager.run('DELETE FROM sqlite_sequence'); // 重置自增ID
        
        console.log('✅ 数据清除完成');
        
        // 2. 重新导入Excel数据
        console.log('\n📥 开始重新导入Excel数据...');
        const excelImporter = new ExcelImporter(dbManager);
        const excelPath = path.join(__dirname, 'b.xlsx');
        
        const result = await excelImporter.importFile(excelPath);
        
        console.log('\n📊 导入结果:');
        console.log(`  成功导入: ${result.imported} 条记录`);
        console.log(`  跳过重复: ${result.skipped} 条记录`);
        console.log(`  处理总数: ${result.total} 条记录`);
        
        if (result.errors.length > 0) {
            console.log(`  错误记录: ${result.errors.length} 条`);
            console.log('  前5个错误:');
            result.errors.slice(0, 5).forEach(error => {
                console.log(`    ${error.record}: ${error.error}`);
            });
        }
        
        // 3. 验证导入结果
        console.log('\n✅ 验证导入结果...');
        const totalPatients = await dbManager.get('SELECT COUNT(*) as count FROM persons');
        const totalFamily = await dbManager.get('SELECT COUNT(*) as count FROM family_info');
        const totalMedical = await dbManager.get('SELECT COUNT(*) as count FROM medical_info');
        
        console.log(`  患者记录数: ${totalPatients.count}`);
        console.log(`  家庭信息记录数: ${totalFamily.count}`);
        console.log(`  医疗信息记录数: ${totalMedical.count}`);
        
        // 4. 检查胡矩豪记录
        console.log('\n🎯 查找胡矩豪记录...');
        const huJuhao = await dbManager.all(`
            SELECT 
                p.id, 
                p.name as patient_name,
                fi.father_name,
                fi.father_phone,
                fi.mother_name,
                fi.mother_phone
            FROM persons p
            LEFT JOIN family_info fi ON p.id = fi.person_id
            WHERE p.name LIKE '%胡矩豪%'
        `);
        
        if (huJuhao.length > 0) {
            huJuhao.forEach(patient => {
                console.log(`  ✅ 找到胡矩豪 - ID ${patient.id}: "${patient.patient_name}"`);
                console.log(`    父亲: "${patient.father_name || '无'}" (${patient.father_phone || '无电话'})`);
                console.log(`    母亲: "${patient.mother_name || '无'}" (${patient.mother_phone || '无电话'})`);
            });
        } else {
            console.log('  ❌ 仍未找到胡矩豪记录');
        }
        
        // 5. 检查前5个患者
        console.log('\n👥 检查前5个患者记录...');
        const firstPatients = await dbManager.all(`
            SELECT 
                p.id, 
                p.name as patient_name,
                fi.father_name,
                fi.mother_name
            FROM persons p
            LEFT JOIN family_info fi ON p.id = fi.person_id
            ORDER BY p.id
            LIMIT 5
        `);
        
        firstPatients.forEach(patient => {
            console.log(`  患者 ID ${patient.id}: "${patient.patient_name}"`);
            console.log(`    父亲: "${patient.father_name || '无'}"  母亲: "${patient.mother_name || '无'}"`);
        });
        
    } catch (error) {
        console.error('❌ 重新导入过程中出现错误:', error);
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