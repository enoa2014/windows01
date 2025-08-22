const DatabaseManager = require('./src/database/DatabaseManager');
const path = require('path');

async function testUpdatedDatabaseManager() {
    const dbManager = new DatabaseManager();
    
    // 直接设置正确的数据库路径
    dbManager.dbPath = path.join(process.env.APPDATA, 'patient-checkin-manager', 'patients.db');
    
    try {
        console.log('连接到数据库...');
        console.log('数据库路径:', dbManager.dbPath);
        
        // 不需要初始化表结构，直接连接现有数据库
        dbManager.db = await dbManager.connectDatabase();
        
        console.log('测试新的getExtendedStatistics方法...\n');
        
        const stats = await dbManager.getExtendedStatistics();
        
        console.log('=== 年龄统计摘要 ===');
        console.log('总患者数:', stats.ageSummary.totalCount);
        console.log('有效年龄记录:', stats.ageSummary.validCount);
        console.log('有效比例:', stats.ageSummary.validPercentage + '%');
        console.log('平均年龄:', stats.ageSummary.averageAge + '岁');
        console.log('最小年龄:', stats.ageSummary.minAge + '岁');
        console.log('最大年龄:', stats.ageSummary.maxAge + '岁');
        
        console.log('\n=== 年龄段分布详情 ===');
        stats.ageDistribution.forEach((range, index) => {
            console.log(`${index + 1}. ${range.age_range}: ${range.count}人 (${range.percentage}%)`);
            console.log(`   平均年龄: ${range.range_avg_age}岁`);
            if (range.patient_examples) {
                const examples = range.patient_examples.split(', ').slice(0, 3).join(', ');
                const totalCount = range.patient_examples.split(', ').length;
                console.log(`   患者示例: ${examples}${totalCount > 3 ? ` 等${totalCount}人` : ''}`);
            }
            console.log('');
        });
        
        // 验证数据合理性
        const totalPercentage = stats.ageDistribution.reduce((sum, item) => sum + item.percentage, 0);
        console.log('=== 数据验证 ===');
        console.log('总百分比:', totalPercentage + '%', totalPercentage === 100 ? '✅' : '❌');
        
        const totalCount = stats.ageDistribution.reduce((sum, item) => sum + item.count, 0);
        console.log('分布总人数:', totalCount);
        console.log('有效年龄总数:', stats.ageSummary.validCount);
        console.log('人数匹配:', totalCount === stats.ageSummary.validCount ? '✅' : '❌');
        
        console.log('\n=== 其他统计信息 ===');
        console.log('总记录数:', stats.totalRecords);
        console.log('多次入院患者:', stats.multipleAdmissions);
        console.log('性别统计:', stats.genderStats);
        
        console.log('\n✅ DatabaseManager更新测试完成');
        
    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        if (dbManager.db) {
            await dbManager.close();
        }
    }
}

testUpdatedDatabaseManager();