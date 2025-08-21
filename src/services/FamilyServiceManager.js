/**
 * 家庭服务数据管理器
 * 提供家庭服务数据的CRUD操作、统计分析和导出功能
 */

const FamilyServiceImporter = require('./FamilyServiceImporter');

class FamilyServiceManager {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.importer = new FamilyServiceImporter(databaseManager);
        this.tableName = 'family_service_records';
    }

    /**
     * 获取家庭服务记录列表
     * @param {Object} filters 筛选条件
     * @param {Object} pagination 分页参数
     * @returns {Array} 记录列表
     */
    async getRecords(filters = {}, pagination = {}) {
        try {
            let sql = `
                SELECT 
                    id,
                    sequence_number,
                    year_month,
                    family_count,
                    residents_count,
                    residence_days,
                    accommodation_count,
                    care_service_count,
                    volunteer_service_count,
                    total_service_count,
                    notes,
                    cumulative_residence_days,
                    cumulative_service_count,
                    created_at,
                    updated_at
                FROM ${this.tableName}
            `;

            const params = [];
            const conditions = [];

            // 搜索条件 - 修复空白字符问题
            if (filters.search && filters.search.trim()) {
                conditions.push(`(
                    notes LIKE ? OR 
                    strftime('%Y', year_month) LIKE ? OR 
                    strftime('%m', year_month) LIKE ?
                )`);
                const searchPattern = `%${filters.search.trim()}%`;
                params.push(searchPattern, searchPattern, searchPattern);
            }

            // 年份筛选 - 修复各种无效年份值问题
            if (filters.year && filters.year.trim()) {
                const year = filters.year.toString().trim();
                // 只处理4位数字的有效年份
                if (/^\d{4}$/.test(year)) {
                    conditions.push("strftime('%Y', year_month) = ?");
                    params.push(year);
                }
                // 忽略所有非数字年份值：'all', '全部', '全部年份', 'undefined' 等
            }

            // 月份筛选
            if (filters.month) {
                conditions.push("strftime('%m', year_month) = ?");
                params.push(filters.month.toString().padStart(2, '0'));
            }

            // 日期范围筛选
            if (filters.startDate) {
                conditions.push('year_month >= ?');
                params.push(filters.startDate);
            }

            if (filters.endDate) {
                conditions.push('year_month <= ?');
                params.push(filters.endDate);
            }

            // 最小服务人次筛选
            if (filters.minServices) {
                conditions.push('total_service_count >= ?');
                params.push(filters.minServices);
            }

            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }

            // 排序
            const sortBy = filters.sort || 'date-desc';
            switch (sortBy) {
                case 'date-asc':
                    sql += ' ORDER BY year_month ASC';
                    break;
                case 'date-desc':
                    sql += ' ORDER BY year_month DESC';
                    break;
                case 'families-desc':
                    sql += ' ORDER BY family_count DESC, year_month DESC';
                    break;
                case 'families-asc':
                    sql += ' ORDER BY family_count ASC, year_month DESC';
                    break;
                case 'services-desc':
                    sql += ' ORDER BY total_service_count DESC, year_month DESC';
                    break;
                case 'services-asc':
                    sql += ' ORDER BY total_service_count ASC, year_month DESC';
                    break;
                default:
                    sql += ' ORDER BY year_month DESC';
            }

            // 分页
            if (pagination.limit) {
                sql += ' LIMIT ?';
                params.push(pagination.limit);

                if (pagination.offset) {
                    sql += ' OFFSET ?';
                    params.push(pagination.offset);
                }
            }

            const records = await this.db.all(sql, params);

            // 计算额外的统计字段
            const processedRecords = records.map(record => ({
                ...record,
                yearMonth: new Date(record.year_month),
                avgDaysPerFamily: record.family_count > 0 ? 
                    (record.residence_days / record.family_count).toFixed(1) : '0',
                serviceEfficiency: record.residents_count > 0 ? 
                    (record.total_service_count / record.residents_count).toFixed(1) : '0'
            }));
            
            return processedRecords;

        } catch (error) {
            console.error('获取家庭服务记录失败:', error);
            throw new Error(`获取记录失败: ${error.message}`);
        }
    }

    /**
     * 获取单条记录详情
     * @param {number} id 记录ID
     * @returns {Object} 记录详情
     */
    async getRecordById(id) {
        try {
            const record = await this.db.get(`
                SELECT * FROM ${this.tableName} WHERE id = ?
            `, [id]);

            if (!record) {
                throw new Error('记录不存在');
            }

            return {
                ...record,
                yearMonth: new Date(record.year_month),
                avgDaysPerFamily: record.family_count > 0 ? 
                    (record.residence_days / record.family_count).toFixed(1) : '0'
            };
        } catch (error) {
            console.error('获取记录详情失败:', error);
            throw new Error(`获取记录详情失败: ${error.message}`);
        }
    }

    /**
     * 获取统计概览数据
     * @returns {Object} 统计概览
     */
    async getOverviewStats() {
        try {
            // 总体统计
            const overallStats = await this.db.get(`
                SELECT 
                    COUNT(*) as totalRecords,
                    SUM(family_count) as totalFamilies,
                    SUM(residents_count) as totalResidents,
                    SUM(total_service_count) as totalServices,
                    SUM(residence_days) as totalResidenceDays,
                    AVG(CASE WHEN family_count > 0 THEN residence_days * 1.0 / family_count ELSE 0 END) as avgDaysPerFamily,
                    AVG(CASE WHEN residents_count > 0 THEN total_service_count * 1.0 / residents_count ELSE 0 END) as avgServicesPerResident,
                    MIN(year_month) as firstRecordDate,
                    MAX(year_month) as lastRecordDate
                FROM ${this.tableName}
            `);

            // 当前年度统计
            const currentYear = new Date().getFullYear();
            const currentYearStats = await this.db.get(`
                SELECT 
                    COUNT(*) as recordsThisYear,
                    SUM(family_count) as familiesThisYear,
                    SUM(total_service_count) as servicesThisYear
                FROM ${this.tableName}
                WHERE strftime('%Y', year_month) = ?
            `, [currentYear.toString()]);

            // 月度趋势（最近12个月）
            const monthlyTrend = await this.db.all(`
                SELECT 
                    strftime('%Y-%m', year_month) as month,
                    SUM(family_count) as families,
                    SUM(total_service_count) as services,
                    COUNT(*) as records
                FROM ${this.tableName}
                WHERE year_month >= date('now', '-12 months')
                GROUP BY strftime('%Y-%m', year_month)
                ORDER BY month DESC
                LIMIT 12
            `);

            // 年度对比
            const yearlyComparison = await this.db.all(`
                SELECT 
                    strftime('%Y', year_month) as year,
                    SUM(family_count) as families,
                    SUM(total_service_count) as services,
                    AVG(CASE WHEN family_count > 0 THEN residence_days * 1.0 / family_count ELSE 0 END) as avgDays,
                    COUNT(*) as records
                FROM ${this.tableName}
                GROUP BY strftime('%Y', year_month)
                ORDER BY year DESC
                LIMIT 5
            `);

            return {
                overall: {
                    ...overallStats,
                    avgDaysPerFamily: parseFloat(overallStats.avgDaysPerFamily?.toFixed(1) || '0'),
                    avgServicesPerResident: parseFloat(overallStats.avgServicesPerResident?.toFixed(1) || '0')
                },
                currentYear: currentYearStats,
                monthlyTrend: monthlyTrend.reverse(), // 按时间正序排列
                yearlyComparison
            };

        } catch (error) {
            console.error('获取统计概览失败:', error);
            throw new Error(`获取统计概览失败: ${error.message}`);
        }
    }

    /**
     * 创建新的家庭服务记录
     * @param {Object} recordData 记录数据
     * @returns {Object} 创建结果
     */
    async createRecord(recordData) {
        try {
            // 数据验证
            const errors = this.validateRecordData(recordData);
            if (errors.length > 0) {
                throw new Error(`数据验证失败: ${errors.join(', ')}`);
            }

            // 检查是否已存在相同年月的记录
            const existingRecord = await this.db.get(`
                SELECT id FROM ${this.tableName} 
                WHERE date(year_month) = date(?)
            `, [recordData.yearMonth]);

            if (existingRecord) {
                throw new Error('该年月的记录已存在');
            }

            const sql = `
                INSERT INTO ${this.tableName} (
                    sequence_number, year_month, family_count, residents_count,
                    residence_days, accommodation_count, care_service_count,
                    volunteer_service_count, total_service_count, notes,
                    cumulative_residence_days, cumulative_service_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await this.db.run(sql, [
                recordData.sequenceNumber || '',
                recordData.yearMonth,
                recordData.familyCount || 0,
                recordData.residentsCount || 0,
                recordData.residenceDays || 0,
                recordData.accommodationCount || 0,
                recordData.careServiceCount || 0,
                recordData.volunteerServiceCount || 0,
                recordData.totalServiceCount || 0,
                recordData.notes || '',
                recordData.cumulativeResidenceDays || 0,
                recordData.cumulativeServiceCount || 0
            ]);

            return {
                success: true,
                id: result.lastID,
                message: '记录创建成功'
            };

        } catch (error) {
            console.error('创建记录失败:', error);
            throw new Error(`创建记录失败: ${error.message}`);
        }
    }

    /**
     * 更新家庭服务记录
     * @param {number} id 记录ID
     * @param {Object} updateData 更新数据
     * @returns {Object} 更新结果
     */
    async updateRecord(id, updateData) {
        try {
            // 检查记录是否存在
            const existingRecord = await this.getRecordById(id);

            // 数据验证
            const errors = this.validateRecordData({ ...existingRecord, ...updateData });
            if (errors.length > 0) {
                throw new Error(`数据验证失败: ${errors.join(', ')}`);
            }

            const updateFields = [];
            const params = [];

            // 动态构建更新SQL
            const updatableFields = [
                'sequence_number', 'year_month', 'family_count', 'residents_count',
                'residence_days', 'accommodation_count', 'care_service_count',
                'volunteer_service_count', 'total_service_count', 'notes',
                'cumulative_residence_days', 'cumulative_service_count'
            ];

            updatableFields.forEach(field => {
                const jsField = this.snakeToCamel(field);
                if (updateData.hasOwnProperty(jsField)) {
                    updateFields.push(`${field} = ?`);
                    params.push(updateData[jsField]);
                }
            });

            if (updateFields.length === 0) {
                throw new Error('没有需要更新的字段');
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            const sql = `
                UPDATE ${this.tableName} 
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `;

            await this.db.run(sql, params);

            return {
                success: true,
                message: '记录更新成功'
            };

        } catch (error) {
            console.error('更新记录失败:', error);
            throw new Error(`更新记录失败: ${error.message}`);
        }
    }

    /**
     * 删除家庭服务记录
     * @param {number} id 记录ID
     * @returns {Object} 删除结果
     */
    async deleteRecord(id) {
        try {
            const result = await this.db.run(`
                DELETE FROM ${this.tableName} WHERE id = ?
            `, [id]);

            if (result.changes === 0) {
                throw new Error('记录不存在或已被删除');
            }

            return {
                success: true,
                message: '记录删除成功'
            };

        } catch (error) {
            console.error('删除记录失败:', error);
            throw new Error(`删除记录失败: ${error.message}`);
        }
    }

    /**
     * 批量删除记录
     * @param {Array} ids 记录ID数组
     * @returns {Object} 删除结果
     */
    async batchDeleteRecords(ids) {
        try {
            const placeholders = ids.map(() => '?').join(',');
            const result = await this.db.run(`
                DELETE FROM ${this.tableName} WHERE id IN (${placeholders})
            `, ids);

            return {
                success: true,
                deletedCount: result.changes,
                message: `成功删除 ${result.changes} 条记录`
            };

        } catch (error) {
            console.error('批量删除记录失败:', error);
            throw new Error(`批量删除记录失败: ${error.message}`);
        }
    }

    /**
     * 导入Excel数据
     * @param {string} filePath Excel文件路径
     * @param {Object} options 导入选项
     * @returns {Object} 导入结果
     */
    async importFromExcel(filePath, options = {}) {
        return await this.importer.importFamilyServiceData(filePath, options);
    }

    /**
     * 导出数据到Excel
     * @param {string} outputPath 输出文件路径
     * @param {Object} filters 筛选条件
     * @returns {Object} 导出结果
     */
    async exportToExcel(outputPath, filters = {}) {
        return await this.importer.exportFamilyServiceData(outputPath, filters);
    }

    /**
     * 获取筛选选项
     * @returns {Object} 筛选选项
     */
    async getFilterOptions() {
        try {
            // 获取可用年份
            const years = await this.db.all(`
                SELECT DISTINCT strftime('%Y', year_month) as year
                FROM ${this.tableName}
                ORDER BY year DESC
            `);

            // 获取服务人次范围
            const serviceRange = await this.db.get(`
                SELECT 
                    MIN(total_service_count) as minServices,
                    MAX(total_service_count) as maxServices
                FROM ${this.tableName}
            `);

            return {
                years: years.map(row => row.year),
                months: [
                    { value: '1', label: '1月' },
                    { value: '2', label: '2月' },
                    { value: '3', label: '3月' },
                    { value: '4', label: '4月' },
                    { value: '5', label: '5月' },
                    { value: '6', label: '6月' },
                    { value: '7', label: '7月' },
                    { value: '8', label: '8月' },
                    { value: '9', label: '9月' },
                    { value: '10', label: '10月' },
                    { value: '11', label: '11月' },
                    { value: '12', label: '12月' }
                ],
                serviceRange: serviceRange || { minServices: 0, maxServices: 1000 }
            };

        } catch (error) {
            console.error('获取筛选选项失败:', error);
            throw new Error(`获取筛选选项失败: ${error.message}`);
        }
    }

    /**
     * 验证记录数据
     * @param {Object} recordData 记录数据
     * @returns {Array} 验证错误列表
     */
    validateRecordData(recordData) {
        const errors = [];

        if (!recordData.yearMonth) {
            errors.push('年月字段必填');
        } else if (!(recordData.yearMonth instanceof Date) && isNaN(Date.parse(recordData.yearMonth))) {
            errors.push('年月字段必须是有效日期');
        }

        const numericFields = [
            'familyCount', 'residentsCount', 'residenceDays', 
            'accommodationCount', 'careServiceCount', 'volunteerServiceCount',
            'totalServiceCount', 'cumulativeResidenceDays', 'cumulativeServiceCount'
        ];

        numericFields.forEach(field => {
            if (recordData[field] !== undefined && recordData[field] !== null) {
                const value = Number(recordData[field]);
                if (isNaN(value) || value < 0) {
                    errors.push(`${field} 必须是非负数`);
                }
            }
        });

        // 逻辑验证
        if (recordData.residentsCount > 0 && recordData.familyCount === 0) {
            errors.push('有入住人数但家庭数量为0，数据可能有误');
        }

        if (recordData.totalServiceCount > 0 && 
            recordData.accommodationCount === 0 && 
            recordData.careServiceCount === 0 && 
            recordData.volunteerServiceCount === 0) {
            errors.push('总服务人次大于0但各项服务人次均为0，数据可能有误');
        }

        return errors;
    }

    /**
     * 驼峰命名转下划线命名
     * @param {string} str 驼峰命名字符串
     * @returns {string} 下划线命名字符串
     */
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    /**
     * 下划线命名转驼峰命名
     * @param {string} str 下划线命名字符串
     * @returns {string} 驼峰命名字符串
     */
    snakeToCamel(str) {
        return str.replace(/(_\w)/g, matches => matches[1].toUpperCase());
    }
}

module.exports = FamilyServiceManager;