// 最终测试：确保"-"身份证号被正确处理

const DatabaseManager = require('./src/database/DatabaseManager');
const path = require('path');
const os = require('os');

async function finalDashTest() {
    const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'patient-checkin-manager');
    const dbPath = path.join(appDataPath, 'patients.db');
    
    const db = new DatabaseManager();
    db.dbPath = dbPath;
    
    try {
        await db.initialize();
        
        console.log('🧪 最终测试："-"身份证号处理');
        
        // 测试场景1: 先导入有"-"身份证号的人员
        console.log('\n场景1: 导入身份证号为"-"的新人员...');
        const personId1 = await db.findOrCreatePerson('测试用户B', '-');
        console.log(`结果: person_id = ${personId1}`);
        
        // 检查数据库记录
        let testPerson = await db.get('SELECT * FROM persons WHERE id = ?', [personId1]);
        console.log(`数据库记录: ID ${testPerson.id}, 身份证: "${testPerson.id_card}"`);
        
        // 测试场景2: 导入相同姓名但有有效身份证号（应该更新现有记录）
        console.log('\n场景2: 导入相同姓名但有有效身份证号...');
        const personId2 = await db.findOrCreatePerson('测试用户B', '450123456789012345');
        console.log(`结果: person_id = ${personId2}`);
        
        // 检查更新后的记录
        testPerson = await db.get('SELECT * FROM persons WHERE id = ?', [personId2]);
        console.log(`更新后记录: ID ${testPerson.id}, 身份证: "${testPerson.id_card}"`);
        
        // 测试场景3: 再次用"-"导入（应该找到现有记录）
        console.log('\n场景3: 再次用"-"导入相同姓名...');
        const personId3 = await db.findOrCreatePerson('测试用户B', '-');
        console.log(`结果: person_id = ${personId3}`);
        
        // 验证所有ID是否相同
        console.log('\n📊 测试结果验证:');
        console.log(`场景1 ID: ${personId1}`);
        console.log(`场景2 ID: ${personId2}`);
        console.log(`场景3 ID: ${personId3}`);
        console.log(`所有ID相同: ${personId1 === personId2 && personId2 === personId3 ? '✅ 是' : '❌ 否'}`);
        
        // 检查最终记录状态
        const finalPersons = await db.all('SELECT * FROM persons WHERE name = ?', ['测试用户B']);
        console.log(`\n数据库中"测试用户B"的记录数: ${finalPersons.length}`);
        finalPersons.forEach((person, index) => {
            console.log(`${index + 1}. ID: ${person.id}, 身份证: "${person.id_card}"`);
        });
        
        // 清理测试数据
        console.log('\n🧹 清理测试数据...');
        await db.run('DELETE FROM persons WHERE name = ?', ['测试用户B']);
        console.log('✅ 清理完成');
        
    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        await db.close();
    }
}

finalDashTest();