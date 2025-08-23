const XLSX = require('xlsx');

class CareBeneficiaryImporter {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.tableName = 'care_beneficiary_records';
        this.sheetName = 'Sheet1';
    }

    parseNumber(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    parseDate(value) {
        if (!value) return null;
        if (typeof value === 'number') {
            const date = XLSX.SSF.parse_date_code(value);
            if (!date) return null;
            return new Date(Date.UTC(date.y, date.m - 1, date.d));
        }
        const timestamp = Date.parse(value);
        return isNaN(timestamp) ? null : new Date(timestamp);
    }

    async importFromExcel(filePath) {
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[this.sheetName];
        const raw = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null,
            blankrows: false
        });

        if (raw.length < 4) {
            throw new Error('Excel 文件格式不正确');
        }

        let imported = 0;
        for (let i = 4; i < raw.length; i++) {
            const row = raw[i] || [];
            if (row.every(cell => cell === null || cell === undefined || cell === '')) {
                continue;
            }

            const record = {
                sequenceNumber: (row[0] || '').toString().trim(),
                year: this.parseNumber(row[1]),
                month: this.parseNumber(row[2]),
                serviceCenter: (row[3] || '').toString().trim(),
                projectDomain: (row[4] || row[35] || '').toString().trim(),
                activityType: (row[5] || row[36] || '').toString().trim(),
                activityDate: this.parseDate(row[6]),
                activityName: (row[7] || '').toString().trim(),
                beneficiaryGroup: (row[8] || '').toString().trim(),
                reporter: (row[9] || '').toString().trim(),
                reportDate: this.parseDate(row[10]),
                adultMale: this.parseNumber(row[11]),
                adultFemale: this.parseNumber(row[12]),
                adultTotal: this.parseNumber(row[13]),
                childMale: this.parseNumber(row[14]),
                childFemale: this.parseNumber(row[15]),
                childTotal: this.parseNumber(row[16]),
                totalBeneficiaries: this.parseNumber(row[17]),
                volunteerChildCount: this.parseNumber(row[18]),
                volunteerChildHours: this.parseNumber(row[19]),
                volunteerParentCount: this.parseNumber(row[20]),
                volunteerParentHours: this.parseNumber(row[21]),
                volunteerStudentCount: this.parseNumber(row[22]),
                volunteerStudentHours: this.parseNumber(row[23]),
                volunteerTeacherCount: this.parseNumber(row[24]),
                volunteerTeacherHours: this.parseNumber(row[25]),
                volunteerSocialCount: this.parseNumber(row[26]),
                volunteerSocialHours: this.parseNumber(row[27]),
                volunteerTotalCount: this.parseNumber(row[28]),
                volunteerTotalHours: this.parseNumber(row[29]),
                benefitAdultTimes: this.parseNumber(row[30]),
                benefitChildTimes: this.parseNumber(row[31]),
                benefitTotalTimes: this.parseNumber(row[32]),
                notes: (row[33] || '').toString().trim()
            };

            const cols = [
                'sequence_number','year','month','service_center','project_domain','activity_type','activity_date','activity_name','beneficiary_group','reporter','report_date','adult_male','adult_female','adult_total','child_male','child_female','child_total','total_beneficiaries','volunteer_child_count','volunteer_child_hours','volunteer_parent_count','volunteer_parent_hours','volunteer_student_count','volunteer_student_hours','volunteer_teacher_count','volunteer_teacher_hours','volunteer_social_count','volunteer_social_hours','volunteer_total_count','volunteer_total_hours','benefit_adult_times','benefit_child_times','benefit_total_times','notes'];

            const values = [
                record.sequenceNumber,
                record.year,
                record.month,
                record.serviceCenter,
                record.projectDomain,
                record.activityType,
                record.activityDate ? record.activityDate.toISOString().split('T')[0] : null,
                record.activityName,
                record.beneficiaryGroup,
                record.reporter,
                record.reportDate ? record.reportDate.toISOString().split('T')[0] : null,
                record.adultMale,
                record.adultFemale,
                record.adultTotal,
                record.childMale,
                record.childFemale,
                record.childTotal,
                record.totalBeneficiaries,
                record.volunteerChildCount,
                record.volunteerChildHours,
                record.volunteerParentCount,
                record.volunteerParentHours,
                record.volunteerStudentCount,
                record.volunteerStudentHours,
                record.volunteerTeacherCount,
                record.volunteerTeacherHours,
                record.volunteerSocialCount,
                record.volunteerSocialHours,
                record.volunteerTotalCount,
                record.volunteerTotalHours,
                record.benefitAdultTimes,
                record.benefitChildTimes,
                record.benefitTotalTimes,
                record.notes
            ];

            const placeholders = cols.map(() => '?').join(',');
            const sql = `INSERT INTO ${this.tableName} (${cols.join(',')}) VALUES (${placeholders})`;
            await this.db.run(sql, values);
            imported++;
        }

        return { imported };
    }
}

module.exports = CareBeneficiaryImporter;
