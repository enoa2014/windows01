const DatabaseManager = require('./src/database/DatabaseManager.js');

async function testPatientDetailNavigation() {
    const dbManager = new DatabaseManager();
    
    try {
        await dbManager.initialize();
        
        console.log('🔍 患者详情导航问题诊断');
        console.log('='.repeat(50));
        
        // 1. 获取年龄段患者列表，检查返回的字段
        console.log('\n📋 1. 检查年龄段患者列表返回的字段');
        
        const patients = await dbManager.getAgeGroupPatients('7-12岁');
        
        if (patients.length === 0) {
            console.log('❌ 无7-12岁患者数据，无法测试');
            return;
        }
        
        console.log(`找到 ${patients.length} 个患者:`);
        patients.forEach((patient, index) => {
            console.log(`\n患者 ${index + 1}:`);
            console.log(`  ID: ${patient.id} (类型: ${typeof patient.id})`);
            console.log(`  姓名: ${patient.name}`);
            console.log(`  年龄: ${patient.age}岁`);
            console.log(`  性别: ${patient.gender || '未知'}`);
            console.log(`  诊断: ${patient.main_diagnosis}`);
            
            // 检查所有字段
            console.log(`  所有字段:`, Object.keys(patient));
        });
        
        // 2. 测试getPatientDetail API
        console.log('\n🔍 2. 测试getPatientDetail API');
        
        const testPatient = patients[0];
        console.log(`测试患者: ${testPatient.name} (ID: ${testPatient.id})`);
        
        try {
            const patientDetail = await dbManager.getPatientDetail(testPatient.id);
            console.log('✅ getPatientDetail API调用成功');
            console.log('返回的数据结构:');
            console.log(`  - profile: ${patientDetail.profile ? '存在' : '不存在'}`);
            console.log(`  - family: ${patientDetail.family ? '存在' : '不存在'}`);
            console.log(`  - checkIns: ${patientDetail.checkIns ? patientDetail.checkIns.length + '条' : '不存在'}`);
            console.log(`  - medicalInfo: ${patientDetail.medicalInfo ? patientDetail.medicalInfo.length + '条' : '不存在'}`);
            
            if (patientDetail.profile) {
                console.log(`  - 患者姓名: ${patientDetail.profile.name}`);
                console.log(`  - 患者ID: ${patientDetail.profile.id}`);
            }
        } catch (error) {
            console.log('❌ getPatientDetail API调用失败:', error.message);
        }
        
        // 3. 检查字段名一致性
        console.log('\n🔄 3. 字段名一致性检查');
        
        // 检查常见的ID字段名
        const testId = testPatient.id;
        console.log(`患者列表返回的ID字段: ${testId}`);
        
        // 验证这个ID是否在persons表中存在
        const personExists = await dbManager.get('SELECT id, name FROM persons WHERE id = ?', [testId]);
        
        if (personExists) {
            console.log(`✅ ID ${testId} 在persons表中存在: ${personExists.name}`);
        } else {
            console.log(`❌ ID ${testId} 在persons表中不存在`);
        }
        
        // 4. 生成修复建议
        console.log('\n💡 4. 问题诊断和修复建议');
        
        console.log('检查点:');
        console.log(`1. 患者列表字段名: ${Object.keys(patients[0]).includes('id') ? '✅ 包含id字段' : '❌ 缺少id字段'}`);
        console.log(`2. persons表数据一致性: ${personExists ? '✅ 数据一致' : '❌ 数据不一致'}`);
        
        // 检查前端代码中的字段引用
        console.log('\n🔧 前端代码检查建议:');
        console.log('检查以下几点:');
        console.log('1. onclick事件是否正确引用patient.id');
        console.log('2. navigateToPatientDetail方法是否正确接收参数');
        console.log('3. showPatientDetail方法是否正确调用API');
        console.log('4. 浏览器控制台是否有JavaScript错误');
        
    } catch (error) {
        console.error('诊断失败:', error);
    } finally {
        await dbManager.close();
    }
}

testPatientDetailNavigation().catch(console.error);