-- 患儿入住信息管理系统数据库架构
-- SQLite 数据库设计
--
-- 版本: v1.1.0
-- 更新日期: 2025-08-20
-- 更新内容: 修复字段映射冲突，改进医疗信息存储
--
-- 重要说明:
-- 1. medical_info.hospital 存储医院名称（如：区人民医院、医科大学附属医院）
-- 2. medical_info.diagnosis 存储诊断信息（如：急性淋巴细胞白血病、白血病M4）
-- 3. 字段映射已优化，确保诊断和医院信息正确分离

-- 人员主表 (去重后的唯一人员)
CREATE TABLE persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                    -- 姓名
    id_card TEXT,                         -- 身份证号（可为空）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 患儿档案表
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

-- 入住记录表
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

-- 医疗信息表
CREATE TABLE medical_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,           -- 关联人员ID
    hospital TEXT,                        -- 就诊医院
    diagnosis TEXT,                       -- 医院诊断
    doctor_name TEXT,                     -- 医生姓名
    symptoms TEXT,                        -- 症状详情
    treatment_process TEXT,               -- 医治过程
    follow_up_plan TEXT,                  -- 后续治疗安排
    record_date TEXT,                     -- 记录日期
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

-- 家庭信息表
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

-- 索引优化
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_persons_id_card ON persons(id_card);
CREATE INDEX idx_check_in_person_date ON check_in_records(person_id, check_in_date);
CREATE INDEX idx_medical_person_date ON medical_info(person_id, record_date);

-- 简化的人员去重逻辑（在应用层处理）
-- 创建唯一索引来防止重复
CREATE UNIQUE INDEX idx_persons_unique_id_card ON persons(id_card) WHERE id_card IS NOT NULL AND id_card != '';
CREATE UNIQUE INDEX idx_persons_unique_name_no_id ON persons(name) WHERE id_card IS NULL OR id_card = '';