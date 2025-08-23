const DatabaseManager = require('../src/database/DatabaseManager');

async function cleanCareServiceData() {
    const dbManager = new DatabaseManager();
    dbManager.dbPath = 'C:\\Users\\86152\\AppData\\Roaming\\patient-checkin-manager\\patients.db';
    
    try {
        console.log('🔧 连接Electron数据库...');
        await dbManager.initialize();
        
        // 1. 查看当前记录数
        const beforeCount = await dbManager.get("SELECT COUNT(*) as count FROM care_beneficiary_records");
        console.log(`📊 清理前记录数: ${beforeCount.count}`);
        
        // 2. 查看需要删除的记录
        const invalidRecords = await dbManager.all(`
            SELECT COUNT(*) as count FROM care_beneficiary_records 
            WHERE (
                (total_beneficiaries = 0 OR total_beneficiaries IS NULL) AND
                (volunteer_total_count = 0 OR volunteer_total_count IS NULL) AND
                (volunteer_total_hours = 0 OR volunteer_total_hours IS NULL) AND
                (adult_male + adult_female + child_male + child_female = 0) AND
                (activity_name = '' OR activity_name IS NULL) AND
                (service_center = '' OR service_center IS NULL)
            ) OR sequence_number = '总合计'
        `);
        console.log(`🗑️ 需要删除的无效记录数: ${invalidRecords[0].count}`);
        
        // 3. 删除无效记录
        const deleteResult = await dbManager.run(`
            DELETE FROM care_beneficiary_records 
            WHERE (
                (total_beneficiaries = 0 OR total_beneficiaries IS NULL) AND
                (volunteer_total_count = 0 OR volunteer_total_count IS NULL) AND
                (volunteer_total_hours = 0 OR volunteer_total_hours IS NULL) AND
                (adult_male + adult_female + child_male + child_female = 0) AND
                (activity_name = '' OR activity_name IS NULL) AND
                (service_center = '' OR service_center IS NULL)
            ) OR sequence_number = '总合计'
        `);
        console.log(`✅ 已删除 ${deleteResult.changes} 条无效记录`);
        
        // 4. 查看清理后记录数
        const afterCount = await dbManager.get("SELECT COUNT(*) as count FROM care_beneficiary_records");
        console.log(`📊 清理后记录数: ${afterCount.count}`);
        
        // 5. 显示保留的有效记录样本
        const validRecords = await dbManager.all(`
            SELECT * FROM care_beneficiary_records 
            WHERE (activity_name != '' AND activity_name IS NOT NULL) 
               OR (service_center != '' AND service_center IS NOT NULL)
               OR total_beneficiaries > 0
               OR volunteer_total_count > 0
            ORDER BY year DESC, month DESC 
            LIMIT 5
        `);
        
        console.log('📋 保留的有效记录样本:');
        validRecords.forEach((r, i) => {
            console.log(`${i+1}. ${r.year}-${String(r.month).padStart(2,'0')} | ${r.service_center || '(空)'} | ${r.activity_name || '(空)'} | 受益:${r.total_beneficiaries} | 志愿者:${r.volunteer_total_count}`);
        });
        
        // 6. 重新计算统计信息
        const stats = await dbManager.get(`
            SELECT 
                COUNT(*) as totalRecords,
                SUM(total_beneficiaries) as totalBeneficiaries,
                SUM(volunteer_total_count) as totalVolunteers,
                SUM(volunteer_total_hours) as totalHours
            FROM care_beneficiary_records
        `);
        
        console.log('📈 清理后统计:');
        console.log(`  总记录数: ${stats.totalRecords}`);
        console.log(`  总受益人次: ${stats.totalBeneficiaries}`);
        console.log(`  总志愿者: ${stats.totalVolunteers}`);
        console.log(`  总服务时长: ${stats.totalHours}小时`);
        
    } catch (error) {
        console.error('❌ 清理失败:', error);
    } finally {
        await dbManager.close();
    }
}

cleanCareServiceData();