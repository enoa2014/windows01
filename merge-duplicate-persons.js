// 合并重复的人员记录

const DatabaseManager = require('./src/database/DatabaseManager');
const path = require('path');
const os = require('os');

async function mergeDuplicatePersons() {
    const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'patient-checkin-manager');
    const dbPath = path.join(appDataPath, 'patients.db');
    
    const db = new DatabaseManager();
    db.dbPath = dbPath;
    
    try {
        await db.initialize();
        
        console.log('🔍 查找重复的梁晓悦记录...');
        const duplicatePersons = await db.all(`
            SELECT * FROM persons 
            WHERE name = '梁晓悦'
            ORDER BY id
        `);
        
        if (duplicatePersons.length <= 1) {
            console.log('没有发现重复记录');
            return;
        }
        
        console.log(`找到 ${duplicatePersons.length} 条重复记录:`);
        duplicatePersons.forEach((person, index) => {
            console.log(`${index + 1}. ID: ${person.id}, 身份证: "${person.id_card}"`);
        });
        
        // 确定主记录（有身份证号的记录优先）
        const primaryPerson = duplicatePersons.find(p => p.id_card && p.id_card !== '' && p.id_card !== '-') || duplicatePersons[0];
        const duplicatesToMerge = duplicatePersons.filter(p => p.id !== primaryPerson.id);
        
        console.log(`\\n选择主记录: ID ${primaryPerson.id} (身份证: "${primaryPerson.id_card}")`);
        console.log(`需要合并的记录: ${duplicatesToMerge.map(p => `ID ${p.id}`).join(', ')}`);
        
        // 开始事务
        await db.run('BEGIN TRANSACTION');
        
        try {
            for (const duplicate of duplicatesToMerge) {
                console.log(`\\n合并 ID ${duplicate.id} 到 ID ${primaryPerson.id}...`);
                
                // 更新患者档案
                await db.run(`
                    UPDATE patient_profiles 
                    SET person_id = ? 
                    WHERE person_id = ?
                `, [primaryPerson.id, duplicate.id]);
                
                // 更新入住记录
                await db.run(`
                    UPDATE check_in_records 
                    SET person_id = ? 
                    WHERE person_id = ?
                `, [primaryPerson.id, duplicate.id]);
                
                // 更新医疗信息
                await db.run(`
                    UPDATE medical_info 
                    SET person_id = ? 
                    WHERE person_id = ?
                `, [primaryPerson.id, duplicate.id]);
                
                // 更新家庭信息
                await db.run(`
                    UPDATE family_info 
                    SET person_id = ? 
                    WHERE person_id = ?
                `, [primaryPerson.id, duplicate.id]);
                
                // 删除重复的人员记录
                await db.run(`
                    DELETE FROM persons 
                    WHERE id = ?
                `, [duplicate.id]);
                
                console.log(`✅ 已删除重复记录 ID ${duplicate.id}`);
            }
            
            // 如果主记录没有身份证号，更新为有效的身份证号
            const validIdCard = duplicatePersons.find(p => p.id_card && p.id_card !== '' && p.id_card !== '-')?.id_card;
            if (validIdCard && (!primaryPerson.id_card || primaryPerson.id_card === '' || primaryPerson.id_card === '-')) {
                await db.run(`
                    UPDATE persons 
                    SET id_card = ? 
                    WHERE id = ?
                `, [validIdCard, primaryPerson.id]);
                console.log(`✅ 已更新主记录的身份证号为: ${validIdCard}`);
            }
            
            // 提交事务
            await db.run('COMMIT');
            console.log('\\n✅ 事务提交成功');
            
        } catch (error) {
            // 回滚事务
            await db.run('ROLLBACK');
            console.error('❌ 合并失败，已回滚:', error);
            throw error;
        }
        
        // 验证结果
        console.log('\\n🔍 合并后的梁晓悦记录:');
        const finalPersons = await db.all(`
            SELECT * FROM persons 
            WHERE name = '梁晓悦'
            ORDER BY id
        `);
        
        finalPersons.forEach((person, index) => {
            console.log(`${index + 1}. ID: ${person.id}, 身份证: "${person.id_card}"`);
        });
        
        // 检查关联记录
        if (finalPersons.length === 1) {
            const personId = finalPersons[0].id;
            console.log(`\\n🔍 检查 ID ${personId} 的关联记录:`);
            
            const checkIns = await db.all('SELECT COUNT(*) as count FROM check_in_records WHERE person_id = ?', [personId]);
            const profiles = await db.all('SELECT COUNT(*) as count FROM patient_profiles WHERE person_id = ?', [personId]);
            const medical = await db.all('SELECT COUNT(*) as count FROM medical_info WHERE person_id = ?', [personId]);
            const family = await db.all('SELECT COUNT(*) as count FROM family_info WHERE person_id = ?', [personId]);
            
            console.log(`- 入住记录: ${checkIns[0].count} 条`);
            console.log(`- 患者档案: ${profiles[0].count} 条`);
            console.log(`- 医疗信息: ${medical[0].count} 条`);
            console.log(`- 家庭信息: ${family[0].count} 条`);
        }
        
    } catch (error) {
        console.error('操作失败:', error);
    } finally {
        await db.close();
    }
}

mergeDuplicatePersons();