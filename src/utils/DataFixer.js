// 数据修复工具 - 修复姓名字段显示问题

class DataFixer {
    /**
     * 检查并修复persons表中的姓名字段问题
     * 如果发现姓名字段包含母亲信息，尝试从family_info表中获取正确的患者姓名
     */
    static async fixNameDisplayIssue(dbManager) {
        console.log('🔧 开始修复姓名显示问题...');
        
        try {
            // 1. 检查当前的数据问题
            // 检查包含电话号码格式的姓名（表明是家长信息）
            const problematicRecords = await dbManager.all(`
                SELECT 
                    p.id,
                    p.name as current_name,
                    fi.mother_name,
                    fi.father_name
                FROM persons p
                LEFT JOIN family_info fi ON p.id = fi.person_id
                WHERE p.name LIKE '%母亲%' 
                   OR p.name LIKE '%妈妈%'
                   OR p.name LIKE '%父亲%'
                   OR p.name LIKE '%爸爸%'
                   OR (LENGTH(p.name) > 10 AND p.name LIKE '% 1%' AND p.name LIKE '% 4%')
            `);
            
            console.log(`🔍 发现${problematicRecords.length}条可能有问题的记录`);
            
            if (problematicRecords.length === 0) {
                console.log('✅ 未发现明显的姓名字段问题');
                return { fixed: 0, total: 0 };
            }
            
            // 2. 尝试修复每条记录
            let fixedCount = 0;
            
            for (const record of problematicRecords) {
                console.log(`\n📝 处理记录ID ${record.id}:`);
                console.log(`  当前姓名: "${record.current_name}"`);
                console.log(`  母亲姓名: "${record.mother_name || '无'}"`);
                console.log(`  父亲姓名: "${record.father_name || '无'}"`);
                
                // 尝试从当前姓名中提取患者姓名
                const extractedName = this.extractPatientName(record.current_name);
                
                if (extractedName && extractedName !== record.current_name) {
                    console.log(`  ➡️  提取到的患者姓名: "${extractedName}"`);
                    
                    // 更新数据库
                    await dbManager.run(`
                        UPDATE persons 
                        SET name = ?, updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    `, [extractedName, record.id]);
                    
                    fixedCount++;
                    console.log(`  ✅ 已修复`);
                } else {
                    console.log(`  ❌ 无法自动修复，需要手动处理`);
                }
            }
            
            console.log(`\n🎉 修复完成: ${fixedCount}/${problematicRecords.length} 条记录已修复`);
            
            return {
                fixed: fixedCount,
                total: problematicRecords.length,
                records: problematicRecords
            };
            
        } catch (error) {
            console.error('❌ 修复过程中出现错误:', error);
            throw error;
        }
    }
    
    /**
     * 从包含母亲/父亲信息的字符串中提取患者姓名
     * 特殊处理：姓名+电话+身份证的格式
     */
    static extractPatientName(nameString) {
        if (!nameString) return null;
        
        // 检查是否包含电话号码和身份证号的格式（表明这是家长信息）
        if (/\d{11}/.test(nameString) && /\d{15,18}/.test(nameString)) {
            // 这是"姓名 电话 身份证"格式的家长信息，提取姓名部分
            const parts = nameString.trim().split(/\s+/);
            if (parts.length >= 3) {
                const name = parts[0]; // 第一部分是姓名
                if (this.isValidPatientName(name)) {
                    return name;
                }
            }
        }
        
        // 尝试各种其他模式来提取患者姓名
        const patterns = [
            // 模式1: "患者姓名 母亲:xxx"
            /^([^母父]+)(?:\s*母亲|父亲)/,
            // 模式2: "姓名 (母亲信息)"
            /^([^()]+)(?:\s*\([^)]*\))?/,
            // 模式3: "姓名,母亲信息" 或 "姓名 母亲信息"
            /^([^,\s]+)(?:[,\s]+母亲|父亲)/,
            // 模式4: 只取第一个非空白字符序列
            /^([^\s]+)/
        ];
        
        for (const pattern of patterns) {
            const match = nameString.match(pattern);
            if (match && match[1] && match[1].trim().length > 0) {
                const extracted = match[1].trim();
                // 验证提取的姓名是否合理
                if (this.isValidPatientName(extracted)) {
                    return extracted;
                }
            }
        }
        
        return null;
    }
    
    /**
     * 验证提取的姓名是否像是患者姓名
     */
    static isValidPatientName(name) {
        // 排除明显的非患者姓名
        const invalidPatterns = [
            /母亲|妈妈|父亲|爸爸|监护人/,
            /电话|手机|联系/,
            /^\d+$/, // 纯数字
            /^[a-zA-Z]+$/ // 纯英文
        ];
        
        for (const pattern of invalidPatterns) {
            if (pattern.test(name)) {
                return false;
            }
        }
        
        // 验证长度合理性
        return name.length >= 1 && name.length <= 10;
    }
    
    /**
     * 生成修复报告
     */
    static async generateFixReport(dbManager) {
        console.log('📊 生成数据质量报告...');
        
        try {
            const totalPatients = await dbManager.get(`SELECT COUNT(*) as count FROM persons`);
            const patientsWithFamily = await dbManager.get(`
                SELECT COUNT(DISTINCT p.id) as count 
                FROM persons p 
                INNER JOIN family_info fi ON p.id = fi.person_id
            `);
            const suspiciousNames = await dbManager.all(`
                SELECT id, name
                FROM persons 
                WHERE name LIKE '%母亲%' 
                   OR name LIKE '%妈妈%'
                   OR name LIKE '%父亲%' 
                   OR name LIKE '%爸爸%'
                   OR name LIKE '%电话%'
                   OR name LIKE '%手机%'
                LIMIT 10
            `);
            
            console.log('\n📈 数据质量报告:');
            console.log(`  总患者数: ${totalPatients.count}`);
            console.log(`  有家庭信息的患者数: ${patientsWithFamily.count}`);
            console.log(`  可疑姓名记录数: ${suspiciousNames.length}`);
            
            if (suspiciousNames.length > 0) {
                console.log('\n🚨 可疑姓名记录样例:');
                suspiciousNames.forEach((record, index) => {
                    console.log(`  ${index + 1}. ID ${record.id}: "${record.name}"`);
                });
            }
            
            return {
                total: totalPatients.count,
                withFamily: patientsWithFamily.count,
                suspicious: suspiciousNames.length,
                suspiciousRecords: suspiciousNames
            };
            
        } catch (error) {
            console.error('❌ 生成报告时出现错误:', error);
            throw error;
        }
    }
}

module.exports = DataFixer;