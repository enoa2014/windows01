// 分析hospital字段的内容分布

const DatabaseManager = require('./src/database/DatabaseManager');
const path = require('path');
const os = require('os');

async function analyzeHospitalField() {
    const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'patient-checkin-manager');
    const dbPath = path.join(appDataPath, 'patients.db');
    
    const db = new DatabaseManager();
    db.dbPath = dbPath;
    
    try {
        await db.initialize();
        
        console.log('🔍 分析hospital字段的内容分布:');
        
        // 获取所有不同的hospital值
        const hospitalValues = await db.all(`
            SELECT DISTINCT hospital, COUNT(*) as count
            FROM medical_info 
            WHERE hospital IS NOT NULL AND hospital != ''
            GROUP BY hospital
            ORDER BY count DESC
        `);
        
        console.log(`发现 ${hospitalValues.length} 种不同的hospital字段值:`);
        
        let diagnosisLike = [];
        let hospitalLike = [];
        
        hospitalValues.forEach((item, index) => {
            const value = item.hospital;
            const isDiagnosis = value.includes('白血病') || value.includes('癌') || 
                               value.includes('病') || value.includes('症');
            
            if (isDiagnosis) {
                diagnosisLike.push(item);
            } else {
                hospitalLike.push(item);
            }
            
            console.log(`${index + 1}. "${value}" (${item.count}次) - ${isDiagnosis ? '疑似诊断' : '疑似医院'}`);
        });
        
        console.log(`\n📊 分析结果:`);
        console.log(`疑似诊断信息: ${diagnosisLike.length} 种`);
        console.log(`疑似医院名称: ${hospitalLike.length} 种`);
        
        if (hospitalLike.length > 0) {
            console.log(`\n真实医院名称示例:`);
            hospitalLike.slice(0, 10).forEach(item => {
                console.log(`  "${item.hospital}" (${item.count}次)`);
            });
        }
        
        if (diagnosisLike.length > 0) {
            console.log(`\n诊断信息示例:`);
            diagnosisLike.slice(0, 10).forEach(item => {
                console.log(`  "${item.hospital}" (${item.count}次)`);
            });
        }
        
        // 检查diagnosis字段的使用情况
        console.log(`\n🔍 检查diagnosis字段的内容:`);
        const diagnosisValues = await db.all(`
            SELECT DISTINCT diagnosis, COUNT(*) as count
            FROM medical_info 
            WHERE diagnosis IS NOT NULL AND diagnosis != ''
            GROUP BY diagnosis
            ORDER BY count DESC
            LIMIT 10
        `);
        
        if (diagnosisValues.length > 0) {
            console.log(`diagnosis字段有 ${diagnosisValues.length} 种不同值:`);
            diagnosisValues.forEach(item => {
                console.log(`  "${item.diagnosis}" (${item.count}次)`);
            });
        } else {
            console.log('⚠️  diagnosis字段都为空');
        }
        
    } catch (error) {
        console.error('分析失败:', error);
    } finally {
        await db.close();
    }
}

analyzeHospitalField();