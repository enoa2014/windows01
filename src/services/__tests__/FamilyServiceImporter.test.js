const fs = require('fs');
const path = require('path');
const os = require('os');
const XLSX = require('xlsx');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-importer-test-'));
const mockElectron = { app: { getPath: () => tmpDir } };
jest.mock('electron', () => mockElectron);

const DatabaseManager = require('../../database/DatabaseManager');
const FamilyServiceImporter = require('../FamilyServiceImporter');

describe('FamilyServiceImporter import counts', () => {
  let dbManager;
  let importer;
  let filePath;

  beforeAll(async () => {
    dbManager = new DatabaseManager();
    await dbManager.initialize();
    importer = new FamilyServiceImporter(dbManager);

    const data = [
      ['标题'],
      ['序号','年月','家庭数量','入住人数','入住天数','住宿人次','关怀服务人次','志愿者陪伴服务人次','服务总人次','备注','累计入住天数','累计服务人次'],
      ['1', 45292, 1,1,1,1,1,1,2,'',1,2],
      ['2', 'invalid', 0,0,0,0,0,0,0,'',0,0],
      ['3', 45292, 3,3,3,3,3,3,6,'',3,6]
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, '家庭服务');
    filePath = path.join(tmpDir, 'test.xlsx');
    XLSX.writeFile(wb, filePath);
  });

  afterAll(async () => {
    if (dbManager && dbManager.db) {
      await new Promise(resolve => dbManager.db.close(resolve));
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('counts reflect processing outcomes', async () => {
    const result = await importer.importFamilyServiceData(filePath);
    expect(result.totalRows).toBe(3);
    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(2);
    expect(result.duplicateCount).toBe(1);
  });
});
