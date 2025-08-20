# 数据库架构说明

## 概述

本系统使用SQLite数据库存储患儿入住信息，采用规范化设计确保数据一致性和查询性能。

## 数据库位置

- **开发环境**: `./data/patients.db`
- **生产环境**: `%USERPROFILE%\AppData\Roaming\patient-checkin-manager\patients.db`

## 表结构设计

### 核心表关系

```
persons (人员主表)
├── patient_profiles (患儿档案)
├── check_in_records (入住记录)
├── medical_info (医疗信息)
└── family_info (家庭信息)
```

### 1. persons (人员主表)

去重后的唯一人员记录，系统核心表。

```sql
CREATE TABLE persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 主键
    name TEXT NOT NULL,                     -- 姓名（必填）
    id_card TEXT,                          -- 身份证号（可空）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**去重规则**:
- 有身份证号：按身份证号唯一
- 无身份证号：按姓名唯一
- 智能更新：同名人员后续提供身份证时自动更新

### 2. patient_profiles (患儿档案)

存储患儿基本信息，与人员主表一对一关系。

```sql
CREATE TABLE patient_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,           -- 关联人员ID
    gender TEXT CHECK(gender IN ('男', '女')),
    birth_date TEXT,                      -- 出生日期 YYYY.M.D 格式
    hometown TEXT,                        -- 籍贯
    ethnicity TEXT,                       -- 民族
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

### 3. check_in_records (入住记录)

存储每次入住的具体信息，一个人员可以有多次入住记录。

```sql
CREATE TABLE check_in_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,           -- 关联人员ID
    check_in_date TEXT NOT NULL,          -- 入住日期
    attendees TEXT,                       -- 入住人员
    details TEXT,                         -- 症状详情
    treatment_plan TEXT,                  -- 后续治疗安排
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

### 4. medical_info (医疗信息) ⭐ 重点优化

存储医疗相关信息，支持详细的医疗记录追踪。

```sql
CREATE TABLE medical_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,           -- 关联人员ID
    hospital TEXT,                        -- 就诊医院（医院名称）
    diagnosis TEXT,                       -- 医院诊断（疾病信息）
    doctor_name TEXT,                     -- 医生姓名
    symptoms TEXT,                        -- 症状详情
    treatment_process TEXT,               -- 医治过程
    follow_up_plan TEXT,                  -- 后续治疗安排
    record_date TEXT,                     -- 记录日期
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

**重要更新 (v1.1.0)**:
- 修复了字段映射冲突问题
- `hospital` 字段现在正确存储医院名称
- `diagnosis` 字段正确存储诊断信息
- 优化了字段映射优先级

### 5. family_info (家庭信息)

存储家庭成员和经济状况信息。

```sql
CREATE TABLE family_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,           -- 关联人员ID
    home_address TEXT,                    -- 家庭地址
    father_name TEXT,                     -- 父亲姓名
    father_phone TEXT,                    -- 父亲电话
    father_id_card TEXT,                  -- 父亲身份证
    mother_name TEXT,                     -- 母亲姓名
    mother_phone TEXT,                    -- 母亲电话
    mother_id_card TEXT,                  -- 母亲身份证
    other_guardian TEXT,                  -- 其他监护人
    economic_status TEXT,                 -- 家庭经济情况
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

## 索引优化

### 查询性能索引
```sql
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_persons_id_card ON persons(id_card);
CREATE INDEX idx_check_in_person_date ON check_in_records(person_id, check_in_date);
CREATE INDEX idx_medical_person_date ON medical_info(person_id, record_date);
```

### 唯一性约束
```sql
-- 身份证号唯一（非空时）
CREATE UNIQUE INDEX idx_persons_unique_id_card ON persons(id_card) 
WHERE id_card IS NOT NULL AND id_card != '';

-- 姓名唯一（无身份证号时）
CREATE UNIQUE INDEX idx_persons_unique_name_no_id ON persons(name) 
WHERE id_card IS NULL OR id_card = '';
```

## 数据管理

### 清理和重置

```bash
# 清理数据库（会自动备份）
node clean-database.js

# 备份文件位置
%USERPROFILE%\AppData\Roaming\patient-checkin-manager\patients_backup_*.db
```

### 数据验证

```bash
# 检查数据库状态
node -e "const db = require('./src/database/DatabaseManager'); (async()=>{const dbm = new db(); await dbm.initialize(); console.log(await dbm.getStatistics()); await dbm.close()})()"
```

## 版本历史

### v1.1.0 (2025-08-20)
- **修复**: 字段映射优先级冲突
- **改进**: 数据库初始化流程
- **优化**: 医疗信息字段分离

### v1.0.0 (初始版本)
- 基础数据库架构设计
- 人员去重逻辑实现
- Excel导入功能

## 开发注意事项

### 数据库操作
- 始终使用 `DatabaseManager` 类进行数据库操作
- 所有外键关系使用 `CASCADE DELETE`
- 插入操作自动处理人员去重

### 字段映射修改
如需修改字段映射规则，编辑 `src/services/ExcelImporter.js` 中的 `fieldPatterns` 对象：

```javascript
const fieldPatterns = {
    'diagnosis': /医院诊断|诊断/,      // 诊断字段优先
    'hospital': /就诊医院|^医院$/,     // 医院字段精确匹配
    // ... 其他字段
};
```

**注意**: 修改字段映射后，建议清理数据库重新导入数据以确保一致性。