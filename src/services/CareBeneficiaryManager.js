const CareBeneficiaryImporter = require('./CareBeneficiaryImporter');

class CareBeneficiaryManager {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.importer = new CareBeneficiaryImporter(databaseManager);
        this.tableName = 'care_beneficiary_records';
    }

    async importFromExcel(filePath) {
        return await this.importer.importFromExcel(filePath);
    }

    async getRecords(filters = {}, pagination = {}) {
        let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
        const params = [];

        if (filters.year) {
            sql += ' AND year = ?';
            params.push(filters.year);
        }
        if (filters.month) {
            sql += ' AND month = ?';
            params.push(filters.month);
        }
        if (filters.serviceCenter) {
            sql += ' AND service_center LIKE ?';
            params.push(`%${filters.serviceCenter}%`);
        }
        if (filters.projectArea) {
            sql += ' AND project_domain LIKE ?';
            params.push(`%${filters.projectArea}%`);
        }
        if (filters.activityName) {
            sql += ' AND activity_name LIKE ?';
            params.push(`%${filters.activityName}%`);
        }
        if (filters.activityType) {
            sql += ' AND activity_type LIKE ?';
            params.push(`%${filters.activityType}%`);
        }

        sql += ' ORDER BY year DESC, month DESC, id DESC';

        if (pagination.limit) {
            sql += ' LIMIT ? OFFSET ?';
            params.push(pagination.limit, pagination.offset || 0);
        }

        return await this.db.all(sql, params);
    }

    async getStatistics() {
        try {
            const stats = await this.db.get(`
                SELECT 
                    COUNT(*) as totalRecords,
                    SUM(adult_male + adult_female + child_male + child_female) as totalBeneficiaries,
                    SUM(volunteer_total_count) as totalVolunteers,
                    SUM(volunteer_total_hours) as totalHours
                FROM ${this.tableName}
            `);
            
            return {
                totalRecords: stats?.totalRecords || 0,
                totalBeneficiaries: stats?.totalBeneficiaries || 0,
                totalVolunteers: stats?.totalVolunteers || 0,
                totalHours: stats?.totalHours || 0
            };
        } catch (error) {
            console.error('获取关怀服务统计失败:', error);
            return { totalRecords: 0, totalBeneficiaries: 0, totalVolunteers: 0, totalHours: 0 };
        }
    }

    // 分类统计方法 - 按照四大类进行统计
    async getCategorizedStatistics(period = 'all') {
        try {
            // 根据期间构建WHERE条件
            let whereClause = '';
            const params = [];
            
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const currentQuarter = Math.ceil(currentMonth / 3);
            
            switch (period) {
                case 'year':
                    whereClause = 'WHERE year = ?';
                    params.push(currentYear);
                    break;
                case 'quarter':
                    const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
                    const quarterEndMonth = currentQuarter * 3;
                    whereClause = 'WHERE year = ? AND month BETWEEN ? AND ?';
                    params.push(currentYear, quarterStartMonth, quarterEndMonth);
                    break;
                case 'month':
                    whereClause = 'WHERE year = ? AND month = ?';
                    params.push(currentYear, currentMonth);
                    break;
                default:
                    whereClause = '';
                    break;
            }

            // 获取分类统计数据
            const categorizedStats = await Promise.all([
                this.getThemeActivitiesStats(whereClause, params),
                this.getDailyCareStats(whereClause, params),
                this.getMedicalAssistStats(whereClause, params),
                this.getIndividualCareStats(whereClause, params),
                this.getOverallStats(whereClause, params),
                this.getActivityTypeDistribution(whereClause, params),
                this.getMonthlyTrend(period === 'all' ? currentYear : null),
                this.getBeneficiaryDistribution(whereClause, params),
                this.getVolunteerDistribution(whereClause, params)
            ]);

            return {
                themeActivities: categorizedStats[0],
                dailyCare: categorizedStats[1],
                medicalAssist: categorizedStats[2],
                individualCare: categorizedStats[3],
                overall: categorizedStats[4],
                activityTypeDistribution: categorizedStats[5],
                monthlyTrend: categorizedStats[6],
                beneficiaryDistribution: categorizedStats[7],
                volunteerDistribution: categorizedStats[8],
                period: period,
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            console.error('获取分类统计失败:', error);
            throw error;
        }
    }

    // 1. 主题关怀活动统计
    async getThemeActivitiesStats(whereClause, params) {
        try {
            const categoryCondition = `(activity_type LIKE '%主题%' OR activity_type LIKE '%活动%' OR 
                     activity_name LIKE '%主题%' OR project_domain LIKE '%主题%')`;
            
            const fullWhere = whereClause ? 
                `${whereClause} AND ${categoryCondition}` : 
                `WHERE ${categoryCondition}`;
            
            const sql = `
                SELECT 
                    COUNT(*) as activities,
                    SUM(adult_male + adult_female + child_male + child_female) as beneficiaries,
                    SUM(volunteer_total_count) as volunteers,
                    activity_name,
                    activity_type,
                    project_domain
                FROM ${this.tableName} 
                ${fullWhere}
                GROUP BY activity_name, activity_type
                ORDER BY beneficiaries DESC
                LIMIT 10
            `;
            
            const results = await this.db.all(sql, params);
            const totalSql = `
                SELECT 
                    COUNT(*) as totalActivities,
                    SUM(adult_male + adult_female + child_male + child_female) as totalBeneficiaries,
                    SUM(volunteer_total_count) as totalVolunteers
                FROM ${this.tableName} 
                ${fullWhere}
            `;
            
            const totals = await this.db.get(totalSql, params);
            
            return {
                total: {
                    activities: totals?.totalActivities || 0,
                    beneficiaries: totals?.totalBeneficiaries || 0,
                    volunteers: totals?.totalVolunteers || 0
                },
                activities: results || []
            };
        } catch (error) {
            console.error('获取主题活动统计失败:', error);
            return { total: { activities: 0, beneficiaries: 0, volunteers: 0 }, activities: [] };
        }
    }

    // 2. 日常关怀陪伴统计
    async getDailyCareStats(whereClause, params) {
        try {
            const categoryCondition = `(activity_type LIKE '%陪伴%' OR activity_type LIKE '%日常%' OR 
                     activity_name LIKE '%陪伴%' OR activity_name LIKE '%日常%') AND 
                     activity_type NOT LIKE '%接送%' AND activity_name NOT LIKE '%接送%' AND
                     activity_type NOT LIKE '%入院%' AND activity_name NOT LIKE '%入院%' AND
                     activity_type NOT LIKE '%出院%' AND activity_name NOT LIKE '%出院%' AND
                     activity_type NOT LIKE '%就医%' AND activity_name NOT LIKE '%就医%' AND
                     activity_type NOT LIKE '%医疗%' AND activity_name NOT LIKE '%医疗%'`;
            
            const fullWhere = whereClause ? 
                `${whereClause} AND ${categoryCondition}` : 
                `WHERE ${categoryCondition}`;
            
            const sql = `
                SELECT 
                    COUNT(*) as activities,
                    SUM(adult_male + adult_female + child_male + child_female) as beneficiaries,
                    SUM(volunteer_total_hours) as hours,
                    activity_name,
                    service_center
                FROM ${this.tableName} 
                ${fullWhere}
                GROUP BY activity_name, service_center
                ORDER BY beneficiaries DESC
                LIMIT 10
            `;
            
            const results = await this.db.all(sql, params);
            const totalSql = `
                SELECT 
                    COUNT(*) as totalActivities,
                    SUM(adult_male + adult_female + child_male + child_female) as totalBeneficiaries,
                    SUM(volunteer_total_hours) as totalHours
                FROM ${this.tableName} 
                ${fullWhere}
            `;
            
            const totals = await this.db.get(totalSql, params);
            
            return {
                total: {
                    activities: totals?.totalActivities || 0,
                    beneficiaries: totals?.totalBeneficiaries || 0,
                    hours: totals?.totalHours || 0
                },
                activities: results || []
            };
        } catch (error) {
            console.error('获取日常关怀统计失败:', error);
            return { total: { activities: 0, beneficiaries: 0, hours: 0 }, activities: [] };
        }
    }

    // 3. 协助就医统计
    async getMedicalAssistStats(whereClause, params) {
        try {
            const categoryCondition = `(activity_type LIKE '%就医%' OR activity_type LIKE '%医疗%' OR 
                     activity_name LIKE '%就医%' OR activity_name LIKE '%医疗%' OR
                     activity_name LIKE '%医院%' OR activity_name LIKE '%治疗%' OR
                     activity_type LIKE '%接送%' OR activity_name LIKE '%接送%' OR
                     activity_type LIKE '%入院%' OR activity_name LIKE '%入院%' OR
                     activity_type LIKE '%出院%' OR activity_name LIKE '%出院%')`;
            
            const fullWhere = whereClause ? 
                `${whereClause} AND ${categoryCondition}` : 
                `WHERE ${categoryCondition}`;
            
            const sql = `
                SELECT 
                    COUNT(*) as activities,
                    SUM(adult_male + adult_female + child_male + child_female) as beneficiaries,
                    SUM(volunteer_total_count) as volunteers,
                    activity_name,
                    service_center
                FROM ${this.tableName} 
                ${fullWhere}
                GROUP BY activity_name, service_center
                ORDER BY beneficiaries DESC
                LIMIT 10
            `;
            
            const results = await this.db.all(sql, params);
            const totalSql = `
                SELECT 
                    COUNT(*) as totalActivities,
                    SUM(adult_male + adult_female + child_male + child_female) as totalBeneficiaries,
                    SUM(volunteer_total_count) as totalVolunteers
                FROM ${this.tableName} 
                ${fullWhere}
            `;
            
            const totals = await this.db.get(totalSql, params);
            
            return {
                total: {
                    activities: totals?.totalActivities || 0,
                    beneficiaries: totals?.totalBeneficiaries || 0,
                    volunteers: totals?.totalVolunteers || 0
                },
                activities: results || []
            };
        } catch (error) {
            console.error('获取协助就医统计失败:', error);
            return { total: { activities: 0, beneficiaries: 0, volunteers: 0 }, activities: [] };
        }
    }

    // 4. 个案关怀统计
    async getIndividualCareStats(whereClause, params) {
        try {
            const categoryCondition = `(activity_type LIKE '%个案%' OR activity_type LIKE '%个人%' OR 
                     activity_name LIKE '%个案%' OR activity_name LIKE '%个人%' OR
                     beneficiary_group LIKE '%个案%')`;
            
            const fullWhere = whereClause ? 
                `${whereClause} AND ${categoryCondition}` : 
                `WHERE ${categoryCondition}`;
            
            const sql = `
                SELECT 
                    COUNT(*) as activities,
                    SUM(adult_male + adult_female + child_male + child_female) as beneficiaries,
                    SUM(volunteer_total_hours) as hours,
                    activity_name,
                    beneficiary_group
                FROM ${this.tableName} 
                ${fullWhere}
                GROUP BY activity_name, beneficiary_group
                ORDER BY beneficiaries DESC
                LIMIT 10
            `;
            
            const results = await this.db.all(sql, params);
            const totalSql = `
                SELECT 
                    COUNT(*) as totalActivities,
                    SUM(adult_male + adult_female + child_male + child_female) as totalBeneficiaries,
                    SUM(volunteer_total_hours) as totalHours
                FROM ${this.tableName} 
                ${fullWhere}
            `;
            
            const totals = await this.db.get(totalSql, params);
            
            return {
                total: {
                    activities: totals?.totalActivities || 0,
                    beneficiaries: totals?.totalBeneficiaries || 0,
                    hours: totals?.totalHours || 0
                },
                activities: results || []
            };
        } catch (error) {
            console.error('获取个案关怀统计失败:', error);
            return { total: { activities: 0, beneficiaries: 0, hours: 0 }, activities: [] };
        }
    }

    // 总体统计
    async getOverallStats(whereClause, params) {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as totalActivities,
                    SUM(adult_male + adult_female + child_male + child_female) as totalBeneficiaries,
                    SUM(volunteer_total_count) as totalVolunteers,
                    SUM(volunteer_total_hours) as totalHours
                FROM ${this.tableName} 
                ${whereClause}
            `;
            
            const result = await this.db.get(sql, params);
            return {
                totalActivities: result?.totalActivities || 0,
                totalBeneficiaries: result?.totalBeneficiaries || 0,
                totalVolunteers: result?.totalVolunteers || 0,
                totalHours: result?.totalHours || 0
            };
        } catch (error) {
            console.error('获取总体统计失败:', error);
            return { totalActivities: 0, totalBeneficiaries: 0, totalVolunteers: 0, totalHours: 0 };
        }
    }

    // 活动类型分布
    async getActivityTypeDistribution(whereClause, params) {
        try {
            const typeCondition = `activity_type IS NOT NULL AND activity_type != ''`;
            
            const fullWhere = whereClause ? 
                `${whereClause} AND ${typeCondition}` : 
                `WHERE ${typeCondition}`;
            
            const sql = `
                SELECT 
                    activity_type,
                    COUNT(*) as count,
                    SUM(adult_male + adult_female + child_male + child_female) as beneficiaries
                FROM ${this.tableName} 
                ${fullWhere}
                GROUP BY activity_type
                ORDER BY count DESC
                LIMIT 10
            `;
            
            const results = await this.db.all(sql, params);
            return results || [];
        } catch (error) {
            console.error('获取活动类型分布失败:', error);
            return [];
        }
    }

    // 月度趋势
    async getMonthlyTrend(year = null) {
        try {
            const currentYear = year || new Date().getFullYear();
            const sql = `
                SELECT 
                    month,
                    COUNT(*) as activities,
                    SUM(adult_male + adult_female + child_male + child_female) as beneficiaries,
                    SUM(volunteer_total_count) as volunteers
                FROM ${this.tableName} 
                WHERE year = ?
                GROUP BY month
                ORDER BY month ASC
            `;
            
            const results = await this.db.all(sql, [currentYear]);
            
            // 补充缺失的月份数据
            const monthlyData = [];
            for (let month = 1; month <= 12; month++) {
                const found = results.find(r => r.month === month);
                monthlyData.push({
                    month,
                    activities: found ? found.activities : 0,
                    beneficiaries: found ? found.beneficiaries : 0,
                    volunteers: found ? found.volunteers : 0
                });
            }
            
            return monthlyData;
        } catch (error) {
            console.error('获取月度趋势失败:', error);
            return [];
        }
    }

    // 受益人群分布
    async getBeneficiaryDistribution(whereClause, params) {
        try {
            const sql = `
                SELECT 
                    SUM(adult_male) as adultMale,
                    SUM(adult_female) as adultFemale,
                    SUM(child_male) as childMale,
                    SUM(child_female) as childFemale
                FROM ${this.tableName} 
                ${whereClause}
            `;
            
            const result = await this.db.get(sql, params);
            return {
                adultMale: result?.adultMale || 0,
                adultFemale: result?.adultFemale || 0,
                childMale: result?.childMale || 0,
                childFemale: result?.childFemale || 0
            };
        } catch (error) {
            console.error('获取受益人群分布失败:', error);
            return { adultMale: 0, adultFemale: 0, childMale: 0, childFemale: 0 };
        }
    }

    // 志愿者服务分布
    async getVolunteerDistribution(whereClause, params) {
        try {
            const sql = `
                SELECT 
                    SUM(volunteer_child_count) as childCount,
                    SUM(volunteer_parent_count) as parentCount,
                    SUM(volunteer_student_count) as studentCount,
                    SUM(volunteer_teacher_count) as teacherCount,
                    SUM(volunteer_social_count) as socialCount,
                    SUM(volunteer_child_hours) as childHours,
                    SUM(volunteer_parent_hours) as parentHours,
                    SUM(volunteer_student_hours) as studentHours,
                    SUM(volunteer_teacher_hours) as teacherHours,
                    SUM(volunteer_social_hours) as socialHours
                FROM ${this.tableName} 
                ${whereClause}
            `;
            
            const result = await this.db.get(sql, params);
            return {
                counts: {
                    child: result?.childCount || 0,
                    parent: result?.parentCount || 0,
                    student: result?.studentCount || 0,
                    teacher: result?.teacherCount || 0,
                    social: result?.socialCount || 0
                },
                hours: {
                    child: result?.childHours || 0,
                    parent: result?.parentHours || 0,
                    student: result?.studentHours || 0,
                    teacher: result?.teacherHours || 0,
                    social: result?.socialHours || 0
                }
            };
        } catch (error) {
            console.error('获取志愿者分布失败:', error);
            return { 
                counts: { child: 0, parent: 0, student: 0, teacher: 0, social: 0 },
                hours: { child: 0, parent: 0, student: 0, teacher: 0, social: 0 }
            };
        }
    }
}

module.exports = CareBeneficiaryManager;
