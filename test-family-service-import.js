/**
 * 家庭服务数据导入测试脚本
 * 用于测试导入入住汇总.xls文件中的家庭服务数据
 */

const DatabaseManager = require('./src/database/DatabaseManager');
const FamilyServiceManager = require('./src/services/FamilyServiceManager');
const path = require('path');

async function testFamilyServiceImport() {
    console.log('🚀 开始测试家庭服务数据导入功能');
    
    try {
        // 初始化数据库
        const dbManager = new DatabaseManager();
        await dbManager.initialize();
        console.log('✅ 数据库初始化完成');

        // 创建家庭服务管理器
        const familyServiceManager = new FamilyServiceManager(dbManager);

        // 首先运行数据库迁移（创建表）
        console.log('📊 创建家庭服务数据表...');
        await dbManager.run(`
            -- 创建家庭服务记录表
            CREATE TABLE IF NOT EXISTS family_service_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sequence_number TEXT,
                year_month DATE NOT NULL,
                family_count INTEGER DEFAULT 0,
                residents_count INTEGER DEFAULT 0,
                residence_days INTEGER DEFAULT 0,
                accommodation_count INTEGER DEFAULT 0,
                care_service_count INTEGER DEFAULT 0,
                volunteer_service_count INTEGER DEFAULT 0,
                total_service_count INTEGER DEFAULT 0,
                notes TEXT,
                cumulative_residence_days INTEGER DEFAULT 0,
                cumulative_service_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 创建索引
        console.log('📈 创建数据索引...');
        await dbManager.run(`
            CREATE INDEX IF NOT EXISTS idx_family_service_year_month 
                ON family_service_records(year_month);
            CREATE INDEX IF NOT EXISTS idx_family_service_total_count 
                ON family_service_records(total_service_count);
        `);

        // 插入测试数据
        console.log('📝 插入测试数据...');
        const testRecords = [
            {
                sequenceNumber: '1',
                yearMonth: '2024-01-01',
                familyCount: 12,
                residentsCount: 37,
                residenceDays: 96,
                accommodationCount: 118,
                careServiceCount: 83,
                volunteerServiceCount: 57,
                totalServiceCount: 158,
                notes: '2024年1月服务记录',
                cumulativeResidenceDays: 96,
                cumulativeServiceCount: 158
            },
            {
                sequenceNumber: '2', 
                yearMonth: '2023-12-01',
                familyCount: 15,
                residentsCount: 42,
                residenceDays: 118,
                accommodationCount: 143,
                careServiceCount: 96,
                volunteerServiceCount: 76,
                totalServiceCount: 219,
                notes: '2023年12月服务记录',
                cumulativeResidenceDays: 214,
                cumulativeServiceCount: 377
            },
            {
                sequenceNumber: '3',
                yearMonth: '2023-11-01',
                familyCount: 18,
                residentsCount: 38,
                residenceDays: 87,
                accommodationCount: 125,
                careServiceCount: 72,
                volunteerServiceCount: 65,
                totalServiceCount: 190,
                notes: '2023年11月服务记录',
                cumulativeResidenceDays: 301,
                cumulativeServiceCount: 567
            },
            {
                sequenceNumber: '4',
                yearMonth: '2023-10-01',
                familyCount: 20,
                residentsCount: 45,
                residenceDays: 125,
                accommodationCount: 168,
                careServiceCount: 89,
                volunteerServiceCount: 78,
                totalServiceCount: 257,
                notes: '2023年10月服务记录',
                cumulativeResidenceDays: 426,
                cumulativeServiceCount: 824
            },
            {
                sequenceNumber: '5',
                yearMonth: '2023-09-01',
                familyCount: 16,
                residentsCount: 41,
                residenceDays: 108,
                accommodationCount: 149,
                careServiceCount: 76,
                volunteerServiceCount: 68,
                totalServiceCount: 225,
                notes: '2023年9月服务记录',
                cumulativeResidenceDays: 534,
                cumulativeServiceCount: 1049
            }
        ];

        // 检查现有记录数量
        const existingCount = await dbManager.get('SELECT COUNT(*) as count FROM family_service_records');
        console.log(`ℹ️ 现有记录数: ${existingCount.count}`);
        
        if (existingCount.count === 0) {
            for (const record of testRecords) {
                const result = await familyServiceManager.createRecord(record);
                if (result.success) {
                    console.log(`✅ 插入记录: ${record.sequenceNumber} - ${record.yearMonth}`);
                } else {
                    console.log(`❌ 插入失败: ${record.sequenceNumber}`);
                }
            }
        } else {
            console.log(`ℹ️ 跳过插入测试数据，数据库中已存在 ${existingCount.count} 条记录`);
        }

        // 测试数据查询
        console.log('\n📋 测试数据查询功能...');
        const records = await familyServiceManager.getRecords();
        console.log(`✅ 查询到 ${records.length} 条记录`);

        // 测试统计功能
        console.log('\n📊 测试统计功能...');
        const stats = await familyServiceManager.getOverviewStats();
        console.log('📈 统计概览:', {
            总记录数: stats.overall.totalRecords,
            总家庭数: stats.overall.totalFamilies,
            总服务人次: stats.overall.totalServices,
            平均天数: stats.overall.avgDaysPerFamily
        });

        // 测试筛选功能
        console.log('\n🔍 测试筛选功能...');
        const filteredRecords = await familyServiceManager.getRecords({ year: '2023' });
        console.log(`✅ 2023年记录: ${filteredRecords.length} 条`);

        // 测试筛选选项
        console.log('\n⚙️ 测试筛选选项...');
        const filterOptions = await familyServiceManager.getFilterOptions();
        console.log('📋 可用年份:', filterOptions.years);

        // 如果存在Excel文件，测试导入功能
        const excelPath = path.join(__dirname, '入住汇总.xls');
        const fs = require('fs');
        
        if (fs.existsSync(excelPath)) {
            console.log('\n📁 发现Excel文件，测试导入功能...');
            const importResult = await familyServiceManager.importFromExcel(excelPath, { allowDuplicates: true });
            
            if (importResult.success) {
                console.log('✅ Excel导入成功:', {
                    成功: importResult.successCount,
                    失败: importResult.errorCount,
                    重复: importResult.duplicateCount,
                    用时: `${importResult.executionTime}ms`
                });
            } else {
                console.log('❌ Excel导入失败:', importResult.errors);
            }

            // 重新查询统计数据
            const newStats = await familyServiceManager.getOverviewStats();
            console.log('📈 导入后统计:', {
                总记录数: newStats.overall.totalRecords,
                总家庭数: newStats.overall.totalFamilies,
                总服务人次: newStats.overall.totalServices
            });
        } else {
            console.log('\n⚠️ 未找到入住汇总.xls文件，跳过Excel导入测试');
        }

        // 测试导出功能
        console.log('\n📤 测试导出功能...');
        const exportPath = path.join(__dirname, 'test_export.xlsx');
        const exportResult = await familyServiceManager.exportToExcel(exportPath);
        
        if (exportResult.success) {
            console.log(`✅ 导出成功: ${exportResult.recordCount} 条记录 -> ${exportPath}`);
        } else {
            console.log(`❌ 导出失败: ${exportResult.error}`);
        }

        console.log('\n🎉 家庭服务数据功能测试完成！');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        console.error('错误详情:', error.stack);
    }
}

// 运行测试
if (require.main === module) {
    testFamilyServiceImport();
}

module.exports = { testFamilyServiceImport };