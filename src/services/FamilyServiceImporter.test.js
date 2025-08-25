const fs = require('fs');
const os = require('os');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const FamilyServiceImporter = require('./FamilyServiceImporter');

function createDatabaseManager() {
  const db = new sqlite3.Database(':memory:');
  return {
    run(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    },
    get(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        db.close(err => (err ? reject(err) : resolve()));
      });
    }
  };
}

describe('FamilyServiceImporter date processing', () => {
  let importer;
  let databaseManager;

  beforeAll(async () => {
    databaseManager = createDatabaseManager();
    await databaseManager.run(`
      CREATE TABLE family_service_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sequence_number TEXT,
        year_month TEXT NOT NULL,
        family_count INTEGER,
        residents_count INTEGER,
        residence_days INTEGER,
        accommodation_count INTEGER,
        care_service_count INTEGER,
        volunteer_service_count INTEGER,
        total_service_count INTEGER,
        notes TEXT,
        cumulative_residence_days INTEGER,
        cumulative_service_count INTEGER
      )
    `);
    importer = new FamilyServiceImporter(databaseManager);
  });

  afterAll(async () => {
    await databaseManager.close();
  });

  test('processExcelDate handles Chinese format', () => {
    const date = importer.processExcelDate('2020年01月');
    expect(date).toEqual(new Date(2020, 0, 1));
  });

  test('importFamilyServiceData imports Chinese month format', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-import-test-'));
    const filePath = path.join(tmpDir, 'test.xlsx');

    const data = [
      ['标题', null, null, null, null, null, null, null, null, null, null, null],
      ['序号', '年月', '家庭数量', '入住人数', '入住天数', '住宿人次', '关怀服务人次', '志愿者陪伴服务人次', '服务总人次', '备注', '累计入住天数', '累计服务人次'],
      ['1', '2020年01月', '2', '3', '4', '5', '6', '7', '8', 'note', '9', '10']
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '家庭服务');
    XLSX.writeFile(workbook, filePath);

    const result = await importer.importFamilyServiceData(filePath);
    expect(result.success).toBe(true);

    const row = await databaseManager.get('SELECT * FROM family_service_records WHERE year_month = ?', ['2020-01-01']);
    expect(row).toBeTruthy();
    expect(row.family_count).toBe(2);
  });
});
