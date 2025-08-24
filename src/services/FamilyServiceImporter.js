/**
 * 家庭服务数据导入器（更新版）
 * 针对具体的Excel文件格式优化
 */

const ExcelImporter = require('./ExcelImporter');
const path = require('path');
const XLSX = require('xlsx');

class FamilyServiceImporter extends ExcelImporter {
    constructor(databaseManager) {
        super(databaseManager);
        this.databaseManager = databaseManager; // 保持一致的属性名
        this.tableName = 'family_service_records';
        this.sheetName = '家庭服务'; // Excel工作表名称
    }

    /**
     * 处理Excel日期序列号
     * @param {number|string} serialNumber Excel日期序列号
     * @returns {Date|null} 转换后的日期对象
     */
    processExcelDate(serialNumber) {
        try {
            if (typeof serialNumber === 'number' && !isNaN(serialNumber)) {
                // Excel日期序列号转换 
                const excelEpoch = new Date(1900, 0, 1);
                const msPerDay = 24 * 60 * 60 * 1000;
                const adjustedSerial = serialNumber > 59 ? serialNumber - 1 : serialNumber;
                const resultDate = new Date(excelEpoch.getTime() + (adjustedSerial - 1) * msPerDay);
                
                // 格式化为年月的第一天
                return new Date(resultDate.getFullYear(), resultDate.getMonth(), 1);
            }
            
            if (typeof serialNumber === 'string' && serialNumber.trim()) {
                const dateStr = serialNumber.toString().trim();
                if (dateStr.match(/^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}$/)) {
                    return new Date(dateStr.replace(/[\.\/]/g, '-'));
                }
                if (dateStr.match(/^\d{4}\.\d{1,2}$/)) {
                    const [year, month] = dateStr.split('.');
                    return new Date(parseInt(year), parseInt(month) - 1, 1);
                }
            }
            
            return null;
        } catch (error) {
            console.warn(`日期转换失败: ${serialNumber}`, error);
            return null;
        }
    }

    /**
     * 安全的数字解析
     * @param {any} value 待解析的值
     * @param {number} defaultValue 默认值
     * @returns {number} 解析后的数字
     */
    parseNumber(value, defaultValue = 0) {
        if (value === null || value === undefined || value === '') {
            return defaultValue;
        }
        
        const num = typeof value === 'string' ? 
            parseFloat(value.replace(/[^\d.-]/g, '')) : 
            parseFloat(value);
            
        return isNaN(num) ? defaultValue : Math.max(0, num);
    }

    /**
     * 导入家庭服务Excel数据 - 针对具体格式优化
     * @param {string} filePath Excel文件路径
     * @param {Object} options 导入选项
     * @returns {Object} 导入结果
     */
    async importFamilyServiceData(filePath, options = {}) {
        const startTime = Date.now();
        const result = {
            success: false,
            totalRows: 0,
            successCount: 0,
            errorCount: 0,
            errors: [],
            warnings: [],
            duplicateCount: 0,
            executionTime: 0
        };

        try {
            console.log(`开始导入家庭服务数据: ${filePath}`);
            
            // 读取Excel文件
            const workbook = XLSX.readFile(filePath);
            
            if (!workbook.SheetNames.includes(this.sheetName)) {
                throw new Error(`找不到工作表: ${this.sheetName}`);
            }
            
            const worksheet = workbook.Sheets[this.sheetName];
            
            // 使用数组格式读取，便于按行索引处理
            const rawData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1, 
                defval: null,
                blankrows: false
            });
            
            console.log(`读取到 ${rawData.length} 行数据`);
            
            if (rawData.length < 3) {
                throw new Error('Excel文件数据不足（需要至少3行：标题、表头、数据）');
            }
            
            // 根据实际分析结果，表头在第2行（索引1），数据从第3行开始（索引2）
            const headers = rawData[1]; // 表头行
            console.log('表头:', headers);
            
            // 开始数据库事务
            await this.databaseManager.run('BEGIN TRANSACTION');
            
            try {
                const insertSQL = `
                    INSERT OR REPLACE INTO family_service_records (
                        sequence_number, year_month, family_count, residents_count,
                        residence_days, accommodation_count, care_service_count,
                        volunteer_service_count, total_service_count, notes,
                        cumulative_residence_days, cumulative_service_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                // 处理数据行（从第3行开始，索引2）
                for (let i = 2; i < rawData.length; i++) {
                    const row = rawData[i];
                    result.totalRows++;

                    try {
                        if (!row || row.length === 0) continue;
                        
                        // 按列位置提取数据（基于分析结果的列映射）
                        const record = {
                            sequenceNumber: (row[0] || '').toString().trim() || `${i-1}`,
                            yearMonth: this.processExcelDate(row[1]), // 年月（Excel序列号）
                            familyCount: this.parseNumber(row[2]),     // 家庭数量
                            residentsCount: this.parseNumber(row[3]),  // 入住人数
                            residenceDays: this.parseNumber(row[4]),   // 入住天数
                            accommodationCount: this.parseNumber(row[5]), // 住宿人次
                            careServiceCount: this.parseNumber(row[6]),   // 关怀服务人次
                            volunteerServiceCount: this.parseNumber(row[7]), // 志愿者陪伴服务人次
                            totalServiceCount: this.parseNumber(row[8]),     // 服务总人次
                            notes: (row[9] || '').toString().trim(),         // 备注
                            cumulativeResidenceDays: this.parseNumber(row[10]), // 累计入住天数
                            cumulativeServiceCount: this.parseNumber(row[11])   // 累计服务人次
                        };

                        // 数据验证
                        if (!record.yearMonth) {
                            result.errors.push(`第${i+1}行: 年月字段无效 (值: ${row[1]})`);
                            result.errorCount++;
                            continue;
                        }

                        // 检查是否已存在相同年月的记录
                        const existingRecord = await this.databaseManager.get(
                            `SELECT id FROM ${this.tableName} WHERE date(year_month) = date(?)`,
                            [record.yearMonth.toISOString().split('T')[0]]
                        );

                        if (existingRecord && !options.allowDuplicates) {
                            result.duplicateCount++;
                            result.errorCount++;
                            continue;
                        }

                        // 插入记录
                        await this.databaseManager.run(insertSQL, [
                            record.sequenceNumber,
                            record.yearMonth.toISOString().split('T')[0],
                            record.familyCount,
                            record.residentsCount,
                            record.residenceDays,
                            record.accommodationCount,
                            record.careServiceCount,
                            record.volunteerServiceCount,
                            record.totalServiceCount,
                            record.notes,
                            record.cumulativeResidenceDays,
                            record.cumulativeServiceCount
                        ]);

                        result.successCount++;
                        
                    } catch (error) {
                        result.errors.push(`第${i+1}行处理失败: ${error.message}`);
                        result.errorCount++;
                    }
                }

                await this.databaseManager.run('COMMIT');
                result.success = result.successCount > 0;
                
            } catch (error) {
                await this.databaseManager.run('ROLLBACK');
                throw error;
            }

        } catch (error) {
            console.error('导入失败:', error);
            result.errors.push(`导入失败: ${error.message}`);
        }

        result.executionTime = Date.now() - startTime;
        console.log(`家庭服务数据导入完成: ${JSON.stringify(result)}`);
        return result;
    }

    /**
     * 导出家庭服务数据到Excel
     */
    async exportFamilyServiceData(filePath, filters = {}) {
        try {
            const data = await this.databaseManager.all(`
                SELECT * FROM ${this.tableName} 
                ORDER BY year_month DESC
            `);

            if (data.length === 0) {
                throw new Error('没有数据可导出');
            }

            // 转换数据格式
            const exportData = data.map(record => ({
                '序号': record.sequence_number || '',
                '年月': record.year_month,
                '家庭数量': record.family_count,
                '入住人数': record.residents_count,
                '入住天数': record.residence_days,
                '住宿人次': record.accommodation_count,
                '关怀服务人次': record.care_service_count,
                '志愿者陪伴服务人次': record.volunteer_service_count,
                '服务总人次': record.total_service_count,
                '备注': record.notes || '',
                '累计入住天数': record.cumulative_residence_days,
                '累计服务人次': record.cumulative_service_count,
                '创建时间': record.created_at,
                '更新时间': record.updated_at
            }));

            // 创建工作簿
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            
            XLSX.utils.book_append_sheet(workbook, worksheet, '家庭服务数据');
            XLSX.writeFile(workbook, filePath);

            return {
                success: true,
                recordCount: data.length
            };

        } catch (error) {
            console.error('导出家庭服务数据失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = FamilyServiceImporter;