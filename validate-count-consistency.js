const DatabaseManager = require('./src/database/DatabaseManager.js');

async function validateCountConsistency() {
    const dbManager = new DatabaseManager();
    
    try {
        await dbManager.initialize();
        
        console.log('🔍 数据一致性验证测试');
        console.log('='.repeat(50));
        
        // 1. 直接查询验证基础数据
        console.log('\n📊 1. 基础数据验证');
        
        const totalPersonsQuery = await dbManager.get('SELECT COUNT(DISTINCT id) as count FROM persons');
        console.log(`总患者数 (persons表): ${totalPersonsQuery.count} 人`);
        
        // 检查患者档案重复情况
        const duplicateProfileCheck = await dbManager.all(`
            SELECT person_id, COUNT(*) as profile_count 
            FROM patient_profiles 
            GROUP BY person_id 
            HAVING COUNT(*) > 1
            ORDER BY profile_count DESC
            LIMIT 10
        `);
        
        console.log(`\n有多个档案的患者数: ${duplicateProfileCheck.length}`);
        if (duplicateProfileCheck.length > 0) {
            console.log('重复档案详情:');
            for (let dup of duplicateProfileCheck.slice(0, 5)) {
                const person = await dbManager.get('SELECT name FROM persons WHERE id = ?', [dup.person_id]);
                console.log(`  - ${person.name} (ID: ${dup.person_id}): ${dup.profile_count}个档案`);
            }
        }
        
        // 2. 测试修复后的统计结果
        console.log('\n📈 2. 修复后统计结果');
        const stats = await dbManager.getExtendedStatistics();
        
        console.log(`总患者数: ${stats.totalPatients} 人`);
        console.log(`年龄摘要-总患者数: ${stats.ageSummary.totalCount} 人`);
        console.log(`年龄摘要-有效年龄记录: ${stats.ageSummary.validCount} 人`);
        console.log(`有效比例: ${stats.ageSummary.validPercentage}%`);
        
        // 3. 一致性检验
        console.log('\n✅ 3. 一致性检验');
        
        const checks = [
            {
                name: '总患者数统计一致性',
                condition: stats.totalPatients === stats.ageSummary.totalCount,
                details: `${stats.totalPatients} === ${stats.ageSummary.totalCount}`
            },
            {
                name: '有效年龄记录 ≤ 总患者数',
                condition: stats.ageSummary.validCount <= stats.totalPatients,
                details: `${stats.ageSummary.validCount} ≤ ${stats.totalPatients}`
            },
            {
                name: '总患者数与直接查询一致',
                condition: stats.totalPatients === totalPersonsQuery.count,
                details: `${stats.totalPatients} === ${totalPersonsQuery.count}`
            },
            {
                name: '有效比例计算正确',
                condition: Math.abs(stats.ageSummary.validPercentage - (stats.ageSummary.validCount / stats.ageSummary.totalCount * 100)) < 0.1,
                details: `${stats.ageSummary.validPercentage}% ≈ ${(stats.ageSummary.validCount / stats.ageSummary.totalCount * 100).toFixed(1)}%`
            }
        ];
        
        checks.forEach(check => {
            const status = check.condition ? '✅ 通过' : '❌ 失败';
            console.log(`${status} ${check.name}: ${check.details}`);
        });
        
        // 4. 年龄段分布验证
        console.log('\n📊 4. 年龄段分布验证');
        
        let ageDistributionTotal = 0;
        console.log('年龄段分布:');
        stats.ageDistribution.forEach(range => {
            console.log(`  ${range.age_range}: ${range.count}人 (${range.percentage}%)`);
            ageDistributionTotal += range.count;
        });
        
        console.log(`\n年龄段总计: ${ageDistributionTotal} 人`);
        console.log(`与有效年龄记录匹配: ${ageDistributionTotal === stats.ageSummary.validCount ? '✅' : '❌'} (${ageDistributionTotal} vs ${stats.ageSummary.validCount})`);
        
        // 5. 综合评估
        console.log('\n🎯 5. 综合评估');
        
        const allChecksPass = checks.every(check => check.condition);
        const ageDistributionMatch = ageDistributionTotal === stats.ageSummary.validCount;
        const basicLogicCorrect = stats.ageSummary.validCount <= stats.totalPatients;
        
        if (allChecksPass && ageDistributionMatch && basicLogicCorrect) {
            console.log('🎉 修复成功！所有数据一致性检验通过');
            console.log('');
            console.log('✅ 数据现在符合逻辑:');
            console.log(`   总患者数: ${stats.totalPatients}人`);
            console.log(`   有效年龄记录: ${stats.ageSummary.validCount}人 (≤ 总患者数)`);
            console.log(`   年龄段分布总计: ${ageDistributionTotal}人 (= 有效年龄记录)`);
            console.log(`   平均年龄: ${stats.ageSummary.averageAge}岁`);
        } else {
            console.log('⚠️ 仍存在数据不一致问题:');
            if (!basicLogicCorrect) {
                console.log(`   - 有效年龄记录(${stats.ageSummary.validCount}) > 总患者数(${stats.totalPatients})`);
            }
            if (!ageDistributionMatch) {
                console.log(`   - 年龄段总计(${ageDistributionTotal}) ≠ 有效年龄记录(${stats.ageSummary.validCount})`);
            }
            if (!allChecksPass) {
                console.log('   - 基础统计检验失败');
            }
        }
        
        // 6. 性别统计快速检验
        console.log('\n👥 6. 性别统计验证');
        const genderTotal = Object.values(stats.genderStats).reduce((sum, count) => sum + count, 0);
        console.log(`性别统计总数: ${genderTotal}人`);
        console.log(`性别统计合理性: ${genderTotal <= stats.totalPatients ? '✅' : '❌'}`);
        
    } catch (error) {
        console.error('验证失败:', error);
    } finally {
        await dbManager.close();
    }
}

validateCountConsistency().catch(console.error);