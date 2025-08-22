/**
 * Excel文件结构分析脚本
 * 分析入住汇总.xls文件中的家庭服务工作表结构
 */

const XLSX = require('xlsx');
const path = require('path');

function analyzeExcelStructure() {
    try {
        const excelPath = path.join(__dirname, '入住汇总.xls');
        console.log('📁 分析Excel文件:', excelPath);
        
        // 读取Excel文件
        const workbook = XLSX.readFile(excelPath);
        console.log('📊 工作表列表:', workbook.SheetNames);
        
        // 查找家庭服务相关的工作表
        let targetSheetName = null;
        for (const sheetName of workbook.SheetNames) {
            if (sheetName.includes('家庭') || sheetName.includes('服务') || sheetName.includes('Family')) {
                targetSheetName = sheetName;
                break;
            }
        }
        
        if (!targetSheetName) {
            console.log('🔍 未找到家庭服务工作表，显示所有工作表内容：');
            workbook.SheetNames.forEach((sheetName, index) => {
                console.log(`\n=== 工作表 ${index + 1}: ${sheetName} ===`);
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // 显示前5行数据
                jsonData.slice(0, 5).forEach((row, rowIndex) => {
                    console.log(`第${rowIndex + 1}行:`, row);
                });
            });
            return;
        }
        
        console.log(`\n✅ 找到目标工作表: ${targetSheetName}`);
        const worksheet = workbook.Sheets[targetSheetName];
        
        // 转换为JSON数组
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`📊 总行数: ${jsonData.length}`);
        
        // 分析表头（通常在第一行或第二行）
        console.log('\n📋 数据结构分析:');
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
            const row = jsonData[i];
            console.log(`第${i + 1}行 (${row.length}列):`, row);
            
            // 检查是否为表头行
            if (row && row.length > 0) {
                const hasDateColumn = row.some(cell => 
                    cell && (
                        cell.toString().includes('年月') ||
                        cell.toString().includes('日期') ||
                        cell.toString().includes('时间') ||
                        cell.toString().includes('Date')
                    )
                );
                
                const hasServiceColumn = row.some(cell => 
                    cell && (
                        cell.toString().includes('服务') ||
                        cell.toString().includes('家庭') ||
                        cell.toString().includes('入住') ||
                        cell.toString().includes('Service')
                    )
                );
                
                if (hasDateColumn && hasServiceColumn) {
                    console.log(`    ✅ 疑似表头行 (包含日期和服务相关字段)`);
                }
            }
        }
        
        // 分析数据类型分布
        if (jsonData.length > 1) {
            console.log('\n🔍 数据类型分析:');
            const headerRow = jsonData[0] || [];
            const firstDataRow = jsonData[1] || [];
            
            for (let col = 0; col < Math.max(headerRow.length, firstDataRow.length); col++) {
                const header = headerRow[col] || `列${col + 1}`;
                const sample = firstDataRow[col];
                const sampleType = typeof sample;
                const sampleValue = sample ? sample.toString().substring(0, 20) : 'null';
                
                console.log(`  列${col + 1}: ${header} | 样本: "${sampleValue}" (${sampleType})`);
            }
        }
        
        // 查找可能的家庭服务字段
        console.log('\n🎯 家庭服务字段匹配分析:');
        const familyServiceFields = {
            '年月': ['年月', '日期', '时间', 'Date', '月份'],
            '家庭数': ['家庭', '家庭数', 'Family', '户数'],
            '入住人次': ['入住', '人次', '居民', '住院', 'Resident'],
            '入住天数': ['天数', '日数', 'Days', '住院天数'],
            '住宿人次': ['住宿', '床位', 'Accommodation'],
            '护理服务人次': ['护理', '服务', '照料', 'Care'],
            '志愿服务人次': ['志愿', 'Volunteer', '义工'],
            '总服务人次': ['总计', '合计', 'Total', '总服务'],
            '备注': ['备注', '说明', 'Note', 'Remark']
        };
        
        if (jsonData.length > 0) {
            const possibleHeaderRow = jsonData[0];
            Object.keys(familyServiceFields).forEach(fieldName => {
                const keywords = familyServiceFields[fieldName];
                let matchedCol = -1;
                
                possibleHeaderRow.forEach((cell, index) => {
                    if (cell && keywords.some(keyword => cell.toString().includes(keyword))) {
                        matchedCol = index;
                    }
                });
                
                if (matchedCol >= 0) {
                    console.log(`  ✅ ${fieldName}: 列${matchedCol + 1} (${possibleHeaderRow[matchedCol]})`);
                } else {
                    console.log(`  ❌ ${fieldName}: 未找到匹配字段`);
                }
            });
        }
        
        // 输出建议的列映射配置
        console.log('\n⚙️ 建议的列映射配置:');
        console.log('const FAMILY_SERVICE_COLUMN_MAPPING = {');
        if (jsonData.length > 0) {
            const headerRow = jsonData[0];
            headerRow.forEach((cell, index) => {
                if (cell) {
                    console.log(`    ${index}: '${cell}', // 列${index + 1}: ${cell}`);
                }
            });
        }
        console.log('};');
        
    } catch (error) {
        console.error('❌ Excel分析失败:', error);
        console.error('错误详情:', error.stack);
    }
}

// 运行分析
if (require.main === module) {
    analyzeExcelStructure();
}

module.exports = { analyzeExcelStructure };