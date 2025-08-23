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

        sql += ' ORDER BY year DESC, month DESC';

        if (pagination.limit) {
            sql += ' LIMIT ? OFFSET ?';
            params.push(pagination.limit, pagination.offset || 0);
        }

        return await this.db.all(sql, params);
    }
}

module.exports = CareBeneficiaryManager;
