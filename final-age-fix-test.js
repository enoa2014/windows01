const DatabaseManager = require('./src/database/DatabaseManager.js');

async function finalAgeFixTest() {
    const dbManager = new DatabaseManager();
    
    try {
        await dbManager.initialize();
        
        console.log('🎯 年龄统计最终修复验证');
        console.log('='.repeat(50));
        
        // 获取修复后的统计数据
        const stats = await dbManager.getExtendedStatistics();
        
        console.log('\n📊 修复后的统计结果');
        console.log(`总患者数: ${stats.totalPatients} 人`);
        console.log(`总记录数: ${stats.totalRecords} 条`);
        console.log(`平均年龄: ${stats.averageAge} 岁`);
        console.log(`多次入住患者: ${stats.multipleAdmissions} 人`);
        
        console.log('\n🎂 年龄分析详情');
        console.log(`总患者数: ${stats.ageSummary.totalCount} 人`);
        console.log(`有效年龄记录: ${stats.ageSummary.validCount} 人`);
        console.log(`有效比例: ${stats.ageSummary.validPercentage}%`);
        console.log(`平均年龄: ${stats.ageSummary.averageAge} 岁`);
        console.log(`最小年龄: ${stats.ageSummary.minAge} 岁`);
        console.log(`最大年龄: ${stats.ageSummary.maxAge} 岁`);
        
        console.log('\n📈 年龄段分布');
        let totalInAgeRanges = 0;
        stats.ageDistribution.forEach(range => {
            console.log(`${range.age_range}: ${range.count}人 (${range.percentage}%)`);
            totalInAgeRanges += range.count;
            
            // 显示患者示例
            if (range.patient_examples) {
                const examples = range.patient_examples.split(', ').slice(0, 3).join(', ');
                console.log(`  示例: ${examples}${range.patient_examples.split(', ').length > 3 ? '...' : ''}`);
            }
        });
        
        console.log(`\n年龄段总计: ${totalInAgeRanges} 人`);
        
        console.log('\n✅ 数据一致性检验');
        const checks = [
            {
                name: '总患者数一致性',
                expected: 73,
                actual: stats.ageSummary.totalCount,
                pass: stats.ageSummary.totalCount === 73
            },
            {
                name: '有效年龄记录合理性',
                expected: '50-73',
                actual: stats.ageSummary.validCount,
                pass: stats.ageSummary.validCount >= 50 && stats.ageSummary.validCount <= 73
            },
            {
                name: '年龄段总数与有效记录数匹配',
                expected: stats.ageSummary.validCount,
                actual: totalInAgeRanges,
                pass: totalInAgeRanges === stats.ageSummary.validCount
            },
            {
                name: '每个年龄段人数 ≤ 总患者数',
                expected: '≤73',
                actual: Math.max(...stats.ageDistribution.map(r => r.count)),
                pass: stats.ageDistribution.every(range => range.count <= 73)
            },
            {
                name: '平均年龄合理性',
                expected: '0-25岁',
                actual: `${stats.ageSummary.averageAge}岁`,
                pass: stats.ageSummary.averageAge >= 0 && stats.ageSummary.averageAge <= 25
            },
            {
                name: '顶部卡片与详细分析一致',
                expected: stats.ageSummary.averageAge,
                actual: stats.averageAge,
                pass: stats.averageAge === stats.ageSummary.averageAge
            }
        ];
        
        checks.forEach(check => {
            const status = check.pass ? '✅ 通过' : '❌ 失败';
            console.log(`${status} ${check.name}: 期望 ${check.expected}, 实际 ${check.actual}`);
        });
        
        const allPassed = checks.every(check => check.pass);
        
        console.log('\n🎉 修复状态');
        if (allPassed) {
            console.log('✅ 所有检验通过！年龄统计问题已完全修复');
            console.log('🔧 主要修复内容:');
            console.log('   1. 统一使用准确的年龄计算方法');
            console.log('   2. 添加DISTINCT防止重复统计');
            console.log('   3. 改进日期格式解析覆盖更多格式');
            console.log('   4. 确保基于所有患者计算有效年龄比例');
        } else {
            console.log('⚠️ 仍有问题需要解决');
            const failedChecks = checks.filter(check => !check.pass);
            failedChecks.forEach(check => {
                console.log(`   - ${check.name}: ${check.actual} (期望: ${check.expected})`);
            });
        }
        
        // 额外的性别统计验证
        console.log('\n👥 性别统计验证');
        const genderTotal = Object.values(stats.genderStats).reduce((sum, count) => sum + count, 0);
        console.log(`性别统计总数: ${genderTotal} 人`);
        console.log(`与总患者数匹配: ${genderTotal <= stats.totalPatients ? '✅' : '❌'}`);
        
        console.log('\n性别分布:');
        Object.entries(stats.genderStats).forEach(([gender, count]) => {
            console.log(`  ${gender}: ${count}人`);
        });
        
    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        await dbManager.close();
    }
}

finalAgeFixTest().catch(console.error);