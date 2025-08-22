// 批量修复所有重复的人员记录

const DatabaseManager = require('./src/database/DatabaseManager');
const path = require('path');
const os = require('os');

async function fixAllDuplicates() {
    const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'patient-checkin-manager');
    const dbPath = path.join(appDataPath, 'patients.db');
    
    const db = new DatabaseManager();
    db.dbPath = dbPath;
    
    try {
        await db.initialize();
        
        console.log('🔍 查找所有重复的姓名...');
        const duplicateNames = await db.all(`
            SELECT name, COUNT(*) as count
            FROM persons 
            GROUP BY name 
            HAVING COUNT(*) > 1
            ORDER BY count DESC, name
        `);
        
        console.log(`发现 ${duplicateNames.length} 个姓名有重复记录`);
        
        let totalMerged = 0;
        
        for (const nameGroup of duplicateNames) {
            console.log(`\n处理 "${nameGroup.name}" (${nameGroup.count}条记录):`);
            
            const persons = await db.all(`
                SELECT * FROM persons 
                WHERE name = ?
                ORDER BY id
            `, [nameGroup.name]);
            
            // 显示所有记录
            persons.forEach((person, index) => {
                console.log(`  ${index + 1}. ID: ${person.id}, 身份证: "${person.id_card}"`);
            });
            
            // 确定主记录：优先选择有有效身份证号的记录
            let primaryPerson = persons.find(p => p.id_card && p.id_card !== '' && p.id_card !== 'null' && p.id_card !== '-');
            
            // 如果没有有效身份证号的记录，选择最早的记录
            if (!primaryPerson) {
                primaryPerson = persons[0];
            }
            
            const duplicatesToMerge = persons.filter(p => p.id !== primaryPerson.id);
            
            if (duplicatesToMerge.length === 0) {
                console.log('  ℹ️  没有需要合并的记录');
                continue;
            }
            
            console.log(`  选择主记录: ID ${primaryPerson.id} (身份证: "${primaryPerson.id_card}")`);
            console.log(`  需要合并: ${duplicatesToMerge.map(p => `ID ${p.id}`).join(', ')}`);
            
            // 开始事务
            await db.run('BEGIN TRANSACTION');
            
            try {
                for (const duplicate of duplicatesToMerge) {
                    console.log(`    合并 ID ${duplicate.id} → ID ${primaryPerson.id}...`);
                    
                    // 更新所有关联表
                    await db.run('UPDATE patient_profiles SET person_id = ? WHERE person_id = ?', [primaryPerson.id, duplicate.id]);
                    await db.run('UPDATE check_in_records SET person_id = ? WHERE person_id = ?', [primaryPerson.id, duplicate.id]);
                    await db.run('UPDATE medical_info SET person_id = ? WHERE person_id = ?', [primaryPerson.id, duplicate.id]);
                    await db.run('UPDATE family_info SET person_id = ? WHERE person_id = ?', [primaryPerson.id, duplicate.id]);
                    
                    // 如果主记录没有身份证号，但要合并的记录有，则更新主记录
                    if ((!primaryPerson.id_card || primaryPerson.id_card === 'null' || primaryPerson.id_card === '') 
                        && duplicate.id_card && duplicate.id_card !== 'null' && duplicate.id_card !== '' && duplicate.id_card !== '-') {
                        await db.run('UPDATE persons SET id_card = ? WHERE id = ?', [duplicate.id_card, primaryPerson.id]);
                        primaryPerson.id_card = duplicate.id_card; // 更新本地对象
                        console.log(`      ✅ 更新主记录身份证号为: ${duplicate.id_card}`);
                    }
                    
                    // 删除重复记录
                    await db.run('DELETE FROM persons WHERE id = ?', [duplicate.id]);
                    totalMerged++;
                }
                
                // 提交事务
                await db.run('COMMIT');
                console.log(`  ✅ 成功合并 ${duplicatesToMerge.length} 条记录`);
                
            } catch (error) {
                await db.run('ROLLBACK');
                console.error(`  ❌ 合并失败: ${error.message}`);
            }
        }
        
        console.log(`\n✅ 合并完成！总共处理了 ${totalMerged} 条重复记录`);
        
        // 验证结果
        console.log('\n🔍 验证结果:');
        const remainingDuplicates = await db.all(`
            SELECT name, COUNT(*) as count
            FROM persons 
            GROUP BY name 
            HAVING COUNT(*) > 1
        `);
        
        if (remainingDuplicates.length === 0) {
            console.log('✅ 所有重复记录已清理完毕');
        } else {
            console.log(`⚠️  仍有 ${remainingDuplicates.length} 个姓名存在重复记录:`);
            remainingDuplicates.forEach(item => {
                console.log(`  ${item.name}: ${item.count}条记录`);
            });
        }
        
        // 显示最终统计
        const totalPersons = await db.get('SELECT COUNT(*) as count FROM persons');
        console.log(`\n📊 最终统计: 共 ${totalPersons.count} 条人员记录`);
        
    } catch (error) {
        console.error('操作失败:', error);
    } finally {
        await db.close();
    }
}

fixAllDuplicates();