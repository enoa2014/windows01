# 数据库架构文档 - 患儿入住信息管理系统

## 概述

患儿入住信息管理系统使用 SQLite3 数据库存储和管理患儿入住信息。数据库设计遵循关系型数据库范式，通过外键约束保证数据完整性，并实现了智能的人员去重逻辑。

## 数据库配置

**数据库引擎**: SQLite3 5.1.6  
**存储位置**: `%APPDATA%/patient-checkin-manager/patients.db`  
**字符编码**: UTF-8  
**外键约束**: 启用 (`PRAGMA foreign_keys = ON`)

## 核心数据表

### 1. persons (人员主表)

**描述**: 存储去重后的唯一人员信息，是系统的核心实体表。

**表结构**:
```sql
CREATE TABLE persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 人员唯一标识
    name TEXT NOT NULL,                      -- 姓名
    id_card TEXT,                           -- 身份证号（可为空）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);
```

**字段说明**:
- `id`: 自增主键，系统内部唯一标识
- `name`: 患者姓名，必填字段
- `id_card`: 身份证号码，可为空（某些患者可能没有身份证）
- `created_at`: 记录创建时间，用于数据追踪
- `updated_at`: 记录更新时间，用于数据同步

**约束条件**:
- 主键约束: `id` 字段自增主键
- 非空约束: `name` 字段不能为空
- 唯一约束: 通过应用层逻辑实现去重

**索引**:
```sql
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_persons_id_card ON persons(id_card);
CREATE UNIQUE INDEX idx_persons_unique_id_card ON persons(id_card) 
    WHERE id_card IS NOT NULL AND id_card != '';
CREATE UNIQUE INDEX idx_persons_unique_name_no_id ON persons(name) 
    WHERE id_card IS NULL OR id_card = '';
```

### 2. patient_profiles (患儿档案表)

**描述**: 存储患儿的基本个人信息，与人员表一对一关联。

**表结构**:
```sql
CREATE TABLE patient_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,              -- 关联人员ID
    gender TEXT CHECK(gender IN ('男', '女')), -- 性别
    birth_date TEXT,                         -- 出生日期
    hometown TEXT,                           -- 籍贯
    ethnicity TEXT,                          -- 民族
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

**字段说明**:
- `person_id`: 外键，关联 persons 表的 id
- `gender`: 性别，限制为"男"或"女"
- `birth_date`: 出生日期，存储格式为 "YYYY.M.D"
- `hometown`: 籍贯信息
- `ethnicity`: 民族信息

**数据约束**:
- 外键约束: `person_id` → `persons(id)`
- 检查约束: `gender` 只能是 '男' 或 '女'
- 级联删除: 删除人员记录时自动删除对应档案

### 3. check_in_records (入住记录表)

**描述**: 存储患儿的历次入住记录，一个患者可以有多次入住记录。

**表结构**:
```sql
CREATE TABLE check_in_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,              -- 关联人员ID
    check_in_date TEXT NOT NULL,             -- 入住日期
    attendees TEXT,                          -- 入住人员（陪同人员）
    details TEXT,                            -- 症状详情
    treatment_plan TEXT,                     -- 后续治疗安排
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

**字段说明**:
- `person_id`: 外键，关联具体患者
- `check_in_date`: 入住日期，必填字段
- `attendees`: 陪同入住的人员信息
- `details`: 入住时的症状详细描述
- `treatment_plan`: 制定的治疗计划

**索引优化**:
```sql
CREATE INDEX idx_check_in_person_date ON check_in_records(person_id, check_in_date);
```

### 4. medical_info (医疗信息表)

**描述**: 存储患儿的诊断和治疗相关信息。

**表结构**:
```sql
CREATE TABLE medical_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,              -- 关联人员ID
    hospital TEXT,                           -- 就诊医院
    diagnosis TEXT,                          -- 医院诊断
    doctor_name TEXT,                        -- 医生姓名
    symptoms TEXT,                           -- 症状详情
    treatment_process TEXT,                  -- 医治过程
    follow_up_plan TEXT,                     -- 后续治疗安排
    record_date TEXT,                        -- 记录日期
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

**字段详解**:
- `hospital`: 就诊的医院名称
- `diagnosis`: 医院给出的正式诊断结果
- `doctor_name`: 主治医生或诊断医生姓名
- `symptoms`: 患者表现出的症状描述
- `treatment_process`: 已进行的治疗过程记录
- `follow_up_plan`: 后续的治疗安排和建议
- `record_date`: 该条记录对应的诊断日期

**索引优化**:
```sql
CREATE INDEX idx_medical_person_date ON medical_info(person_id, record_date);
```

### 5. family_info (家庭信息表)

**描述**: 存储患儿的家庭背景信息和监护人联系方式。

**表结构**:
```sql
CREATE TABLE family_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,              -- 关联人员ID
    home_address TEXT,                       -- 家庭地址
    father_name TEXT,                        -- 父亲姓名
    father_phone TEXT,                       -- 父亲电话
    father_id_card TEXT,                     -- 父亲身份证
    mother_name TEXT,                        -- 母亲姓名
    mother_phone TEXT,                       -- 母亲电话
    mother_id_card TEXT,                     -- 母亲身份证
    other_guardian TEXT,                     -- 其他监护人
    economic_status TEXT,                    -- 家庭经济情况
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

**字段分类**:

**地址信息**:
- `home_address`: 家庭详细地址

**父亲信息**:
- `father_name`: 父亲姓名
- `father_phone`: 父亲联系电话
- `father_id_card`: 父亲身份证号码

**母亲信息**:
- `mother_name`: 母亲姓名
- `mother_phone`: 母亲联系电话
- `mother_id_card`: 母亲身份证号码

**其他信息**:
- `other_guardian`: 其他监护人信息（如爷爷奶奶等）
- `economic_status`: 家庭经济状况描述

## 数据关系图

```
persons (人员主表)
├── patient_profiles (1:1)     # 患儿档案
├── check_in_records (1:N)     # 入住记录
├── medical_info (1:N)         # 医疗信息
└── family_info (1:1)          # 家庭信息
```

**关系说明**:
- **一对一关系**: persons ↔ patient_profiles, persons ↔ family_info
- **一对多关系**: persons → check_in_records, persons → medical_info
- **级联删除**: 删除人员记录时，所有关联数据自动删除

## 人员去重逻辑

### 去重规则

系统通过以下规则确定是否为同一人员：

1. **不同身份证号**: 视为不同人员
   ```sql
   -- 示例：张三(123456) ≠ 张三(789012)
   ```

2. **同名（无论是否有身份证）**: 视为同一人员
   ```sql
   -- 示例：李四(有身份证) = 李四(无身份证)
   -- 示例：王五(无身份证) = 王五(无身份证)  
   -- 示例：赵六(123456) = 赵六(123456)
   ```

**核心原则**: 
- 如果身份证号不同，则为不同人员
- 如果姓名相同，无论身份证情况如何，都视为同一人员

### 实现机制

**唯一索引约束**:
```sql
-- 按姓名去重：相同姓名视为同一人员
CREATE UNIQUE INDEX idx_persons_unique_name ON persons(name);

-- 身份证号索引（用于查询优化，不强制唯一）
CREATE INDEX idx_persons_id_card ON persons(id_card);
```

**应用层查找逻辑**:
```javascript
async findOrCreatePerson(name, idCard) {
  const normalizedName = name ? name.trim() : '';
  const normalizedIdCard = (idCard && idCard.trim()) ? idCard.trim() : null;
  
  if (!normalizedName) {
    throw new Error('姓名不能为空');
  }
  
  // 首先按姓名查找是否已存在
  let person = await this.get(
    'SELECT * FROM persons WHERE name = ?', 
    [normalizedName]
  );
  
  if (person) {
    // 如果找到同名人员，检查是否需要更新身份证信息
    if (normalizedIdCard && !person.id_card) {
      // 如果新数据有身份证而现有记录没有，则更新身份证信息
      await this.run(
        'UPDATE persons SET id_card = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [normalizedIdCard, person.id]
      );
    }
    return person.id;
  }
  
  // 如果不存在同名人员，创建新记录
  const result = await this.run(
    'INSERT INTO persons (name, id_card, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [normalizedName, normalizedIdCard]
  );
  
  return result.id;
}
```

## 查询优化

### 索引设计

**主要索引**:
```sql
-- 基础索引
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_persons_id_card ON persons(id_card);

-- 复合索引（提升查询性能）
CREATE INDEX idx_check_in_person_date ON check_in_records(person_id, check_in_date);
CREATE INDEX idx_medical_person_date ON medical_info(person_id, record_date);

-- 搜索优化索引
CREATE INDEX idx_patient_profiles_hometown ON patient_profiles(hometown);
CREATE INDEX idx_medical_diagnosis ON medical_info(diagnosis);
```

**索引使用场景**:
- `idx_persons_name`: 按姓名搜索患者
- `idx_persons_id_card`: 按身份证查找患者
- `idx_check_in_person_date`: 获取患者入住历史
- `idx_medical_person_date`: 获取患者医疗记录
- `idx_patient_profiles_hometown`: 按籍贯筛选
- `idx_medical_diagnosis`: 按诊断内容搜索

### 常用查询模式

**1. 获取患者列表（带统计信息）**:
```sql
SELECT 
    p.id,
    p.name,
    pp.gender,
    pp.birth_date,
    pp.hometown,
    pp.ethnicity,
    p.id_card,
    COUNT(cir.id) as check_in_count,
    MAX(cir.check_in_date) as latest_check_in,
    (SELECT mi.diagnosis 
     FROM medical_info mi 
     WHERE mi.person_id = p.id 
     ORDER BY mi.record_date DESC 
     LIMIT 1) as latest_diagnosis
FROM persons p
LEFT JOIN patient_profiles pp ON p.id = pp.person_id
LEFT JOIN check_in_records cir ON p.id = cir.person_id
GROUP BY p.id, p.name, pp.gender, pp.birth_date, pp.hometown, pp.ethnicity, p.id_card
ORDER BY p.created_at DESC;
```

**2. 模糊搜索查询**:
```sql
SELECT DISTINCT p.*
FROM persons p
LEFT JOIN patient_profiles pp ON p.id = pp.person_id
LEFT JOIN medical_info mi ON p.id = mi.person_id
WHERE p.name LIKE '%' || ? || '%'
   OR pp.hometown LIKE '%' || ? || '%'
   OR mi.diagnosis LIKE '%' || ? || '%'
   OR mi.hospital LIKE '%' || ? || '%'
ORDER BY p.name;
```

**3. 患者详细信息查询**:
```sql
-- 基本信息
SELECT p.*, pp.* 
FROM persons p
LEFT JOIN patient_profiles pp ON p.id = pp.person_id
WHERE p.id = ?;

-- 入住记录
SELECT * FROM check_in_records 
WHERE person_id = ? 
ORDER BY check_in_date DESC;

-- 医疗信息
SELECT * FROM medical_info 
WHERE person_id = ? 
ORDER BY record_date DESC;

-- 家庭信息
SELECT * FROM family_info 
WHERE person_id = ?;
```

## 数据完整性

### 外键约束

```sql
-- 患儿档案表
ALTER TABLE patient_profiles 
ADD CONSTRAINT fk_patient_person 
FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE;

-- 入住记录表
ALTER TABLE check_in_records 
ADD CONSTRAINT fk_checkin_person 
FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE;

-- 医疗信息表
ALTER TABLE medical_info 
ADD CONSTRAINT fk_medical_person 
FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE;

-- 家庭信息表
ALTER TABLE family_info 
ADD CONSTRAINT fk_family_person 
FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE;
```

### 数据验证

**应用层验证规则**:
```javascript
// 数据验证函数
function validatePatientData(data) {
  const errors = [];
  
  // 姓名验证
  if (!data.name || data.name.trim().length === 0) {
    errors.push('姓名不能为空');
  }
  
  // 性别验证
  if (data.gender && !['男', '女'].includes(data.gender)) {
    errors.push('性别只能是"男"或"女"');
  }
  
  // 日期格式验证
  if (data.birth_date && !isValidDateFormat(data.birth_date)) {
    errors.push('出生日期格式错误，应为YYYY.M.D格式');
  }
  
  // 身份证号验证
  if (data.id_card && !isValidIdCard(data.id_card)) {
    errors.push('身份证号格式错误');
  }
  
  return errors;
}
```

## 数据备份与恢复

### 备份策略

**自动备份**:
```javascript
// 定期备份数据库
const fs = require('fs').promises;
const path = require('path');

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(
    app.getPath('userData'), 
    'backups', 
    `patients_${timestamp}.db`
  );
  
  await fs.mkdir(path.dirname(backupPath), { recursive: true });
  await fs.copyFile(this.dbPath, backupPath);
  
  console.log('数据库备份完成:', backupPath);
}

// 每日备份
setInterval(backupDatabase, 24 * 60 * 60 * 1000);
```

**数据导出**:
```sql
-- 导出患者基本信息
.mode csv
.output patients_export.csv
SELECT 
    p.name as '姓名',
    pp.gender as '性别',
    pp.birth_date as '出生日期',
    pp.hometown as '籍贯',
    p.id_card as '身份证号',
    COUNT(cir.id) as '入住次数'
FROM persons p
LEFT JOIN patient_profiles pp ON p.id = pp.person_id
LEFT JOIN check_in_records cir ON p.id = cir.person_id
GROUP BY p.id;
```

### 数据迁移

**版本升级脚本**:
```sql
-- v1.0 to v1.1 升级脚本
BEGIN TRANSACTION;

-- 添加新字段
ALTER TABLE patient_profiles ADD COLUMN blood_type TEXT;
ALTER TABLE medical_info ADD COLUMN severity_level INTEGER DEFAULT 1;

-- 创建新索引
CREATE INDEX idx_medical_severity ON medical_info(severity_level);

-- 更新版本信息
INSERT OR REPLACE INTO system_info (key, value) VALUES ('db_version', '1.1');

COMMIT;
```

## 性能监控

### 查询性能分析

```sql
-- 启用查询计划分析
EXPLAIN QUERY PLAN 
SELECT p.name, COUNT(cir.id) as check_in_count
FROM persons p
LEFT JOIN check_in_records cir ON p.id = cir.person_id
GROUP BY p.id, p.name;

-- 分析索引使用情况
PRAGMA index_list('persons');
PRAGMA index_info('idx_persons_name');
```

### 数据库统计

```javascript
// 获取数据库统计信息
async function getDatabaseStats() {
  const stats = {
    totalPatients: await this.get('SELECT COUNT(*) as count FROM persons'),
    totalRecords: await this.get('SELECT COUNT(*) as count FROM check_in_records'),
    totalMedicalRecords: await this.get('SELECT COUNT(*) as count FROM medical_info'),
    dbSize: await this.getDbFileSize(),
    indexCount: await this.get('SELECT COUNT(*) as count FROM sqlite_master WHERE type = "index"')
  };
  
  return stats;
}
```

## 故障排除

### 常见问题

**1. 外键约束错误**:
```
Error: FOREIGN KEY constraint failed
```
解决方案：确保 `PRAGMA foreign_keys = ON` 已启用

**2. 唯一约束冲突**:
```
Error: UNIQUE constraint failed
```
解决方案：检查去重逻辑，确保数据符合唯一性要求

**3. 数据库锁定**:
```
Error: database is locked
```
解决方案：确保正确关闭数据库连接，使用连接池管理

### 维护命令

```sql
-- 数据库完整性检查
PRAGMA integrity_check;

-- 重建索引
REINDEX;

-- 分析统计信息
ANALYZE;

-- 清理空间
VACUUM;
```

---

*数据库架构文档最后更新时间：2025年8月20日*  
*文档版本：v1.0*  
*数据库版本：v1.0*