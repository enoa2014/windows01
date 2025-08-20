const XLSX = require('xlsx');
const ExcelDiagnostics = require('../utils/ExcelDiagnostics');

class ExcelImporter {
    constructor(databaseManager) {
        this.dbManager = databaseManager;
    }

    async importFile(filePath) {
        try {
            // 读取Excel文件
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // 转换为JSON数组
            const rawData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1, // 使用数组而不是对象
                defval: null // 空单元格返回null
            });

            // 诊断Excel结构
            console.log('🔍 开始Excel结构诊断...');
            const diagnosticResult = ExcelDiagnostics.analyzeExcelStructure(rawData);
            if (diagnosticResult) {
                ExcelDiagnostics.suggestFieldMapping(diagnosticResult);
            }
            
            // 解析表头和数据
            const parsedData = this.parseExcelData(rawData);
            
            // 导入到数据库
            let imported = 0;
            let skipped = 0;
            const errors = [];

            for (const record of parsedData) {
                try {
                    await this.dbManager.insertPatientRecord(record);
                    imported++;
                } catch (error) {
                    if (error.message.includes('已存在')) {
                        skipped++;
                    } else {
                        errors.push({
                            record: record.name,
                            error: error.message
                        });
                    }
                }
            }

            return {
                imported,
                skipped,
                errors,
                total: parsedData.length
            };

        } catch (error) {
            console.error('Excel导入失败:', error);
            throw new Error(`Excel文件处理失败: ${error.message}`);
        }
    }

    parseExcelData(rawData) {
        if (rawData.length < 3) {
            throw new Error('Excel文件格式不正确，至少需要表头和数据行');
        }

        // 找到表头行（通常是第1-2行）
        const headerRow1 = rawData[0] || [];
        const headerRow2 = rawData[1] || [];
        
        // 合并表头，创建列映射
        const columnMap = this.createColumnMapping(headerRow1, headerRow2);
        
        // 解析数据行（从第3行开始）
        const dataRows = rawData.slice(2);
        const parsedRecords = [];

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            if (!row || row.every(cell => !cell)) {
                continue; // 跳过空行
            }

            try {
                const record = this.parseDataRow(row, columnMap);
                if (record.name) { // 确保有姓名
                    parsedRecords.push(record);
                }
            } catch (error) {
                console.warn(`第${i + 3}行数据解析失败:`, error.message);
            }
        }

        return parsedRecords;
    }

    createColumnMapping(header1, header2) {
        // 根据数据结构分析创建列映射
        const mapping = {};
        const headers = header1.map((h1, index) => {
            const h2 = header2[index] || '';
            return `${h1 || ''}${h2 || ''}`.trim();
        });

        // 调试输出：显示所有检测到的表头
        console.log('🔍 Excel表头检测结果:');
        headers.forEach((header, index) => {
            console.log(`  列${index}: "${header}"`);
        });

        // 定义字段映射规则（按优先级排序，更具体的模式在前面）
        const fieldPatterns = {
            'sequence': /序号/,
            'name': /^姓名$|患者姓名|患儿姓名/,  // 更精确的姓名匹配
            'gender': /性别/,
            'birthDate': /出生日期|出生年月/,
            'hometown': /籍贯/,
            'ethnicity': /民族/,
            'checkInDate': /入住时间|入住日期/,
            'attendees': /入住人/,
            'diagnosis': /医院诊断|诊断/,
            'hospital': /就诊医院|^医院$/,
            'doctorName': /医生姓名|主治医生/,
            'symptoms': /症状详情|症状/,
            'treatmentProcess': /医治过程|治疗过程/,
            'followUpPlan': /后续治疗安排|后续安排/,
            'homeAddress': /家庭地址|地址/,
            // 父母信息必须在身份证字段之前，因为它们包含"身份证"关键词
            'fatherInfo': /父亲姓名、电话、身份证号|父亲.*姓名|父亲.*信息|父亲/,
            'motherInfo': /母亲姓名、电话、身份证号|母亲.*姓名|母亲.*信息|母亲/,
            'otherGuardian': /其他监护人/,
            'economicStatus': /家庭经济/,
            // 身份证字段放在最后，避免误匹配父母信息列
            'idCard': /^身份证号$|^身份证$/
        };

        console.log('🎯 字段映射结果:');
        headers.forEach((header, index) => {
            for (const [field, pattern] of Object.entries(fieldPatterns)) {
                if (pattern.test(header)) {
                    mapping[field] = index;
                    console.log(`  ${field} -> 列${index}: "${header}"`);
                    break;
                }
            }
        });

        // 特别检查姓名字段映射
        if (!mapping.name) {
            console.error('❌ 未找到姓名字段！可能的姓名相关列:');
            headers.forEach((header, index) => {
                if (header.includes('姓名') || header.includes('名字') || header.includes('母亲') || header.includes('父亲')) {
                    console.log(`  列${index}: "${header}"`);
                }
            });
        } else {
            console.log(`✅ 姓名字段映射到列${mapping.name}: "${headers[mapping.name]}"`);
        }

        return mapping;
    }

    parseDataRow(row, columnMap) {
        const getValue = (field) => {
            const index = columnMap[field];
            return index !== undefined ? (row[index] || '').toString().trim() : '';
        };

        // 解析父母信息（复合字段）
        const fatherInfo = this.parseParentInfo(getValue('fatherInfo'));
        const motherInfo = this.parseParentInfo(getValue('motherInfo'));

        // 调试输出姓名相关信息
        const patientName = getValue('name');
        console.log('👤 数据行解析调试:');
        console.log(`  患者姓名: "${patientName}" (来自列${columnMap.name})`);
        console.log(`  母亲姓名: "${motherInfo.name}"`);
        console.log(`  父亲姓名: "${fatherInfo.name}"`);
        
        // 如果姓名为空但有母亲姓名，这可能是字段映射错误的信号
        if (!patientName && motherInfo.name) {
            console.warn('⚠️  警告：患者姓名为空但母亲姓名不为空，可能存在字段映射错误！');
        }

        const record = {
            sequence: getValue('sequence'),
            name: patientName,
            gender: getValue('gender'),
            birthDate: this.normalizeDateFormat(getValue('birthDate')),
            hometown: getValue('hometown'),
            ethnicity: getValue('ethnicity'),
            idCard: getValue('idCard'),
            checkInDate: this.normalizeDateFormat(getValue('checkInDate')),
            attendees: getValue('attendees'),
            hospital: getValue('hospital'),
            diagnosis: getValue('diagnosis'),
            doctorName: getValue('doctorName'),
            symptoms: getValue('symptoms'),
            treatmentProcess: getValue('treatmentProcess'),
            followUpPlan: getValue('followUpPlan'),
            homeAddress: getValue('homeAddress'),
            fatherName: fatherInfo.name,
            fatherPhone: fatherInfo.phone,
            fatherIdCard: fatherInfo.idCard,
            motherName: motherInfo.name,
            motherPhone: motherInfo.phone,
            motherIdCard: motherInfo.idCard,
            otherGuardian: getValue('otherGuardian'),
            economicStatus: getValue('economicStatus')
        };

        // 最终记录调试
        console.log(`✏️  最终解析结果 - 姓名: "${record.name}"`);
        
        return record;
    }

    parseParentInfo(infoString) {
        if (!infoString) {
            return { name: '', phone: '', idCard: '' };
        }

        // 尝试解析格式：姓名 电话 身份证号
        const parts = infoString.split(/\s+/);
        
        let name = '';
        let phone = '';
        let idCard = '';

        for (const part of parts) {
            if (/^1[3-9]\d{9}$/.test(part)) {
                // 手机号格式
                phone = part;
            } else if (/^\d{15}(\d{2}[0-9Xx])?$/.test(part)) {
                // 身份证号格式
                idCard = part;
            } else if (part && !phone && !idCard) {
                // 第一个非手机号、非身份证的字段作为姓名
                name = part;
            }
        }

        return { name, phone, idCard };
    }

    normalizeDateFormat(dateString) {
        if (!dateString) return '';
        
        // 支持多种日期格式：YYYY.M.D, YYYY-M-D, YYYY/M/D
        const dateFormats = [
            /^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/,
            /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/
        ];

        for (const format of dateFormats) {
            const match = dateString.match(format);
            if (match) {
                const [, year, month, day] = match;
                return `${year}.${parseInt(month)}.${parseInt(day)}`;
            }
        }

        return dateString; // 保持原格式如果无法解析
    }
}

module.exports = ExcelImporter;