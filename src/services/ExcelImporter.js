const XLSX = require('xlsx');

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

        // 定义字段映射规则
        const fieldPatterns = {
            'sequence': /序号/,
            'name': /姓名/,
            'gender': /性别/,
            'birthDate': /出生日期|出生年月/,
            'hometown': /籍贯/,
            'ethnicity': /民族/,
            'idCard': /身份证号|身份证/,
            'checkInDate': /入住时间|入住日期/,
            'attendees': /入住人/,
            'hospital': /就诊医院|医院/,
            'diagnosis': /医院诊断|诊断/,
            'doctorName': /医生姓名|主治医生/,
            'symptoms': /症状详情|症状/,
            'treatmentProcess': /医治过程|治疗过程/,
            'followUpPlan': /后续治疗安排|后续安排/,
            'homeAddress': /家庭地址|地址/,
            'fatherInfo': /父亲.*信息|父亲/,
            'motherInfo': /母亲.*信息|母亲/,
            'otherGuardian': /其他监护人/,
            'economicStatus': /家庭经济/
        };

        headers.forEach((header, index) => {
            for (const [field, pattern] of Object.entries(fieldPatterns)) {
                if (pattern.test(header)) {
                    mapping[field] = index;
                    break;
                }
            }
        });

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

        return {
            sequence: getValue('sequence'),
            name: getValue('name'),
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