// 快速验证：家庭服务表是否存在及其字段
const path = require('path');
const DatabaseManager = require('./src/database/DatabaseManager');

(async () => {
  const db = new DatabaseManager();
  await db.initialize();

  const table = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='family_service_records'");
  if (!table) {
    console.error('❌ family_service_records 表不存在');
    process.exit(1);
  }

  const cols = await db.all("PRAGMA table_info('family_service_records')");
  const colNames = cols.map(c => `${c.name}:${c.type}`);
  console.log('✅ family_service_records 存在，字段：');
  console.log(' - ' + colNames.join('\n - '));

  // 简单插入/查询验证（不提交真实数据，仅检查写入能力）
  await db.run('BEGIN');
  try {
    await db.run(
      `INSERT INTO family_service_records (
        sequence_number, year_month, family_count, residents_count,
        residence_days, accommodation_count, care_service_count,
        volunteer_service_count, total_service_count, notes,
        cumulative_residence_days, cumulative_service_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['TEST', '2024-01-01', 1, 1, 1, 1, 0, 0, 1, 'schema test', 1, 1]
    );
  } finally {
    await db.run('ROLLBACK'); // 不落库
  }

  console.log('✅ 基本写入校验通过（已回滚）');
  process.exit(0);
})().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});

