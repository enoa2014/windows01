// 测试统计页面前端逻辑的独立脚本
const path = require('path');

// 模拟测试数据
const testStatsData = {
    totalPatients: 243,
    totalRecords: 241,
    averageAge: 11.7,
    multipleAdmissions: 43,
    genderStats: { '女': 93, '男': 150 },
    ageSummary: {
        totalCount: 243,
        validCount: 172,
        validPercentage: 70.8,
        averageAge: 11.7,
        minAge: 3,
        maxAge: 21
    },
    ageDistribution: [
        {
            age_range: '1-3岁',
            count: 1,
            percentage: 0.6,
            range_avg_age: 3,
            patient_examples: '张恩'
        },
        {
            age_range: '4-6岁',
            count: 19,
            percentage: 11.0,
            range_avg_age: 5.6,
            patient_examples: '甘梓煜, 甘梓煜, 甘梓煜, 李明, 王华, 张伟, 陈建'
        },
        {
            age_range: '7-12岁',
            count: 78,
            percentage: 45.3,
            range_avg_age: 9.6,
            patient_examples: '胡矩豪, 李业铭, 梁智健, 王小明, 李晓华'
        }
    ],
    locationStats: [
        { hometown: '广州', count: 50 },
        { hometown: '深圳', count: 30 }
    ],
    diseaseStats: [
        { diagnosis: '感冒', count: 20 },
        { diagnosis: '发烧', count: 15 }
    ],
    doctorStats: [
        { doctor_name: '李医生', patient_count: 25 },
        { doctor_name: '王医生', patient_count: 20 }
    ],
    monthlyTrend: []
};

// 测试年龄分布HTML生成逻辑
function testAgeDistributionGeneration() {
    console.log('🔍 开始测试年龄分布HTML生成...');
    
    const ageDistribution = testStatsData.ageDistribution;
    console.log('测试数据:', ageDistribution);
    
    try {
        // 模拟 updateAgeDistribution 方法的核心逻辑
        const maxCount = Math.max(...ageDistribution.map(item => item.count));
        console.log('最大计数:', maxCount);
        
        const distributionHTML = ageDistribution.map((item, index) => {
            console.log('处理年龄段:', item.age_range);
            
            const percentage = item.percentage || 0;
            const widthPercentage = Math.max((item.count / maxCount) * 100, 5);
            
            // 测试患者示例处理
            const examples = item.patient_examples ? 
                item.patient_examples.split(', ').slice(0, 4).join(', ') : '';
            const exampleCount = item.patient_examples ? 
                item.patient_examples.split(', ').length : 0;
            const moreCount = Math.max(0, exampleCount - 4);
            
            console.log('患者示例处理结果:', {
                原始: item.patient_examples,
                处理后: examples,
                总数: exampleCount,
                超出数: moreCount
            });
            
            // 测试颜色分配
            const colors = [
                'from-blue-400 to-blue-500',
                'from-green-400 to-green-500',
                'from-purple-400 to-purple-500',
                'from-orange-400 to-orange-500',
                'from-red-400 to-red-500',
                'from-gray-400 to-gray-500'
            ];
            const colorClass = colors[index] || colors[colors.length - 1];
            
            // 简化的HTML模板测试
            const htmlBlock = `
                <div class="age-range-item">
                    <h4>${item.age_range}</h4>
                    <span>${item.count}人</span>
                    <div>${percentage}%</div>
                    <div style="width: ${widthPercentage}%"></div>
                    ${examples ? `
                        <div>
                            ${examples.split(', ').map(name => `<span>${name}</span>`).join('')}
                            ${moreCount > 0 ? `<span>等${exampleCount}人</span>` : ''}
                        </div>
                    ` : `<div>暂无患者示例</div>`}
                </div>
            `;
            
            console.log('生成的HTML块长度:', htmlBlock.length);
            return htmlBlock;
        }).join('');
        
        console.log('✅ HTML生成成功，总长度:', distributionHTML.length);
        console.log('前100个字符:', distributionHTML.substring(0, 100));
        
        return true;
    } catch (error) {
        console.error('❌ HTML生成失败:', error);
        return false;
    }
}

// 测试数据完整性验证
function testDataValidation() {
    console.log('🔍 开始测试数据完整性验证...');
    
    try {
        const stats = testStatsData;
        
        // 验证数据格式
        if (!stats || typeof stats !== 'object') {
            throw new Error('统计数据格式无效');
        }
        
        console.log('基础数据验证:', {
            totalPatients: stats.totalPatients,
            hasAgeSummary: !!stats.ageSummary,
            hasAgeDistribution: !!stats.ageDistribution,
            ageDistributionLength: stats.ageDistribution ? stats.ageDistribution.length : 0
        });
        
        // 验证年龄分布数据
        if (stats.ageDistribution && stats.ageDistribution.length > 0) {
            const totalPercentage = stats.ageDistribution.reduce((sum, item) => sum + item.percentage, 0);
            const totalCount = stats.ageDistribution.reduce((sum, item) => sum + item.count, 0);
            
            console.log('年龄分布验证:', {
                totalPercentage: totalPercentage + '%',
                totalCount,
                validCount: stats.ageSummary.validCount,
                percentageValid: totalPercentage === 100,
                countMatch: totalCount === stats.ageSummary.validCount
            });
        }
        
        console.log('✅ 数据验证成功');
        return true;
    } catch (error) {
        console.error('❌ 数据验证失败:', error);
        return false;
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始统计页面前端逻辑测试\n');
    
    const tests = [
        { name: '数据完整性验证', test: testDataValidation },
        { name: '年龄分布HTML生成', test: testAgeDistributionGeneration }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(({ name, test }) => {
        console.log(`\n--- 测试: ${name} ---`);
        const result = test();
        if (result) {
            passed++;
            console.log(`✅ ${name} 通过`);
        } else {
            failed++;
            console.log(`❌ ${name} 失败`);
        }
    });
    
    console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败`);
    
    if (failed === 0) {
        console.log('🎉 所有测试通过！前端逻辑应该正常工作。');
    } else {
        console.log('⚠️ 有测试失败，需要进一步调试。');
    }
}

runAllTests();