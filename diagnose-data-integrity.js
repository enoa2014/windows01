const DatabaseManager = require('./src/database/DatabaseManager.js');

class DataIntegrityDiagnoser {
    constructor() {
        this.dbManager = new DatabaseManager();
    }

    async initialize() {
        await this.dbManager.initialize();
    }

    async diagnose() {
        console.log('🔍 数据完整性诊断工具');
        console.log('='.repeat(50));

        try {
            await this.checkBasicCounts();
            await this.checkDuplicatePersons();
            await this.checkPatientProfileDuplicates();
            await this.checkAgeCalculationIssues();
            await this.demonstrateFix();
        } catch (error) {
            console.error('诊断过程出错:', error);
        } finally {
            await this.dbManager.close();
        }
    }

    async checkBasicCounts() {
        console.log('\n📊 1. 基础数据统计');
        console.log('-'.repeat(30));

        const totalPersons = await this.dbManager.get('SELECT COUNT(*) as count FROM persons');
        const totalProfiles = await this.dbManager.get('SELECT COUNT(*) as count FROM patient_profiles');
        const totalMedical = await this.dbManager.get('SELECT COUNT(*) as count FROM medical_info');
        const totalCheckIns = await this.dbManager.get('SELECT COUNT(*) as count FROM check_in_records');

        console.log(`总人数: ${totalPersons.count}`);
        console.log(`患者档案数: ${totalProfiles.count}`);
        console.log(`医疗信息数: ${totalMedical.count}`);
        console.log(`入住记录数: ${totalCheckIns.count}`);

        if (totalProfiles.count > totalPersons.count) {
            console.log('⚠️  警告: 患者档案数 > 人数，可能存在重复档案');
        }
    }

    async checkDuplicatePersons() {
        console.log('\n👥 2. 检查重复人员记录');
        console.log('-'.repeat(30));

        const duplicateNames = await this.dbManager.all(`
            SELECT name, COUNT(*) as count 
            FROM persons 
            GROUP BY name 
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        `);

        console.log(`重复姓名数量: ${duplicateNames.length}`);
        if (duplicateNames.length > 0) {
            console.log('重复的姓名:');
            duplicateNames.slice(0, 5).forEach(item => {
                console.log(`  - ${item.name}: ${item.count}次`);
            });
        }

        const duplicateIdCards = await this.dbManager.all(`
            SELECT id_card, COUNT(*) as count 
            FROM persons 
            WHERE id_card IS NOT NULL AND id_card != ''
            GROUP BY id_card 
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        `);

        console.log(`重复身份证数量: ${duplicateIdCards.length}`);
        if (duplicateIdCards.length > 0) {
            console.log('重复的身份证:');
            duplicateIdCards.slice(0, 3).forEach(item => {
                console.log(`  - ${item.id_card}: ${item.count}次`);
            });
        }
    }

    async checkPatientProfileDuplicates() {
        console.log('\n📋 3. 检查患者档案重复');
        console.log('-'.repeat(30));

        const profileDuplicates = await this.dbManager.all(`
            SELECT person_id, COUNT(*) as count 
            FROM patient_profiles 
            GROUP BY person_id 
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        `);

        console.log(`重复档案的人员数: ${profileDuplicates.length}`);
        if (profileDuplicates.length > 0) {
            console.log('存在多个档案的人员:');
            for (let i = 0; i < Math.min(5, profileDuplicates.length); i++) {
                const dup = profileDuplicates[i];
                const person = await this.dbManager.get('SELECT name FROM persons WHERE id = ?', [dup.person_id]);
                console.log(`  - ${person.name} (ID: ${dup.person_id}): ${dup.count}个档案`);
            }
        }
    }

    async checkAgeCalculationIssues() {
        console.log('\n🎂 4. 年龄计算问题分析');
        console.log('-'.repeat(30));

        // 检查JOIN前后的数据变化
        const personsWithAge = await this.dbManager.all(`
            SELECT COUNT(*) as count
            FROM persons p
            LEFT JOIN patient_profiles pp ON p.id = pp.person_id
            WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
        `);

        const distinctPersonsWithAge = await this.dbManager.all(`
            SELECT COUNT(*) as count
            FROM (
                SELECT DISTINCT p.id
                FROM persons p
                LEFT JOIN patient_profiles pp ON p.id = pp.person_id
                WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
            )
        `);

        console.log(`JOIN后有年龄的记录数: ${personsWithAge[0].count}`);
        console.log(`去重后有年龄的人数: ${distinctPersonsWithAge[0].count}`);

        if (personsWithAge[0].count > distinctPersonsWithAge[0].count) {
            console.log('⚠️  发现JOIN产生重复记录！');
            
            // 找出重复的具体案例
            const duplicateExamples = await this.dbManager.all(`
                SELECT p.id, p.name, COUNT(*) as profile_count
                FROM persons p
                LEFT JOIN patient_profiles pp ON p.id = pp.person_id
                WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
                GROUP BY p.id, p.name
                HAVING COUNT(*) > 1
                LIMIT 5
            `);

            if (duplicateExamples.length > 0) {
                console.log('造成重复的具体案例:');
                duplicateExamples.forEach(example => {
                    console.log(`  - ${example.name} (ID: ${example.id}): ${example.profile_count}个档案`);
                });
            }
        }
    }

    async demonstrateFix() {
        console.log('\n🔧 5. 修复效果演示');
        console.log('-'.repeat(30));

        // 修复前 - 原始查询
        console.log('修复前的年龄分布统计:');
        const beforeFix = await this.dbManager.all(`
            WITH age_calculations AS (
                SELECT 
                    p.id as person_id,
                    p.name,
                    pp.birth_date,
                    CASE 
                        WHEN pp.birth_date IS NOT NULL AND pp.birth_date != '' THEN
                            CAST((julianday('now') - julianday(
                                CASE 
                                    WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]' THEN
                                        SUBSTR(pp.birth_date, 1, 4) || '-' || SUBSTR(pp.birth_date, 6, 2) || '-' || SUBSTR(pp.birth_date, 9, 2)
                                    ELSE pp.birth_date
                                END
                            )) / 365.25 AS INTEGER)
                        ELSE NULL
                    END as age
                FROM persons p
                LEFT JOIN patient_profiles pp ON p.id = pp.person_id
                WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
            ),
            age_ranges AS (
                SELECT 
                    CASE 
                        WHEN age <= 12 THEN '7-12岁'
                        ELSE '其他'
                    END as age_range,
                    age,
                    name,
                    person_id
                FROM age_calculations
                WHERE age >= 7 AND age <= 12
            )
            SELECT 
                age_range,
                COUNT(*) as count
            FROM age_ranges
            GROUP BY age_range
        `);

        // 修复后 - 带DISTINCT的查询
        console.log('修复后的年龄分布统计:');
        const afterFix = await this.dbManager.all(`
            WITH age_calculations AS (
                SELECT DISTINCT
                    p.id as person_id,
                    p.name,
                    pp.birth_date,
                    CASE 
                        WHEN pp.birth_date IS NOT NULL AND pp.birth_date != '' THEN
                            CAST((julianday('now') - julianday(
                                CASE 
                                    WHEN pp.birth_date GLOB '[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]' THEN
                                        SUBSTR(pp.birth_date, 1, 4) || '-' || SUBSTR(pp.birth_date, 6, 2) || '-' || SUBSTR(pp.birth_date, 9, 2)
                                    ELSE pp.birth_date
                                END
                            )) / 365.25 AS INTEGER)
                        ELSE NULL
                    END as age
                FROM persons p
                LEFT JOIN patient_profiles pp ON p.id = pp.person_id
                WHERE pp.birth_date IS NOT NULL AND pp.birth_date != ''
            ),
            age_ranges AS (
                SELECT 
                    CASE 
                        WHEN age <= 12 THEN '7-12岁'
                        ELSE '其他'
                    END as age_range,
                    age,
                    name,
                    person_id
                FROM age_calculations
                WHERE age >= 7 AND age <= 12
            )
            SELECT 
                age_range,
                COUNT(*) as count
            FROM age_ranges
            GROUP BY age_range
        `);

        if (beforeFix.length > 0 && afterFix.length > 0) {
            console.log(`修复前7-12岁人数: ${beforeFix[0]?.count || 0}`);
            console.log(`修复后7-12岁人数: ${afterFix[0]?.count || 0}`);
            console.log(`减少了: ${(beforeFix[0]?.count || 0) - (afterFix[0]?.count || 0)} 人的重复统计`);
        }
    }
}

// 运行诊断
async function runDiagnosis() {
    const diagnoser = new DataIntegrityDiagnoser();
    await diagnoser.initialize();
    await diagnoser.diagnose();
}

runDiagnosis().catch(console.error);