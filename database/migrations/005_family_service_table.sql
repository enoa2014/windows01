-- 家庭服务记录表结构
-- Migration 005: 创建家庭服务统计数据表
-- Created: 2025-08-21
-- Description: 基于Excel家庭服务工作表结构设计的数据表

-- 创建家庭服务记录表
CREATE TABLE IF NOT EXISTS family_service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sequence_number TEXT,                    -- 序号 (对应Excel序号列)
    year_month DATE NOT NULL,               -- 年月 (处理Excel日期序列号)
    family_count INTEGER DEFAULT 0,        -- 家庭数量
    residents_count INTEGER DEFAULT 0,     -- 入住人数
    residence_days INTEGER DEFAULT 0,      -- 入住天数
    accommodation_count INTEGER DEFAULT 0, -- 住宿人次
    care_service_count INTEGER DEFAULT 0,  -- 关怀服务人次
    volunteer_service_count INTEGER DEFAULT 0, -- 志愿者陪伴服务人次
    total_service_count INTEGER DEFAULT 0, -- 服务总人次
    notes TEXT,                            -- 备注
    cumulative_residence_days INTEGER DEFAULT 0, -- 累计入住天数
    cumulative_service_count INTEGER DEFAULT 0,  -- 累计服务人次
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_family_service_year_month 
    ON family_service_records(year_month);

CREATE INDEX IF NOT EXISTS idx_family_service_total_count 
    ON family_service_records(total_service_count);

CREATE INDEX IF NOT EXISTS idx_family_service_family_count 
    ON family_service_records(family_count);

CREATE INDEX IF NOT EXISTS idx_family_service_created_at 
    ON family_service_records(created_at);

-- 创建复合索引用于筛选查询
CREATE INDEX IF NOT EXISTS idx_family_service_year_month_family 
    ON family_service_records(year_month, family_count);

-- 添加数据约束
-- 确保年月字段不能为空
-- 确保数值字段不能为负数
CREATE TRIGGER IF NOT EXISTS validate_family_service_data
    BEFORE INSERT ON family_service_records
    WHEN 
        NEW.year_month IS NULL OR 
        NEW.family_count < 0 OR 
        NEW.residents_count < 0 OR 
        NEW.residence_days < 0 OR 
        NEW.accommodation_count < 0 OR
        NEW.care_service_count < 0 OR
        NEW.volunteer_service_count < 0 OR
        NEW.total_service_count < 0 OR
        NEW.cumulative_residence_days < 0 OR
        NEW.cumulative_service_count < 0
    BEGIN
        SELECT RAISE(ABORT, '数据验证失败：年月不能为空，数值字段不能为负数');
    END;

-- 创建更新时间自动更新触发器
CREATE TRIGGER IF NOT EXISTS update_family_service_timestamp
    AFTER UPDATE ON family_service_records
    BEGIN
        UPDATE family_service_records 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
    END;

-- 创建视图用于常用查询
CREATE VIEW IF NOT EXISTS family_service_monthly_summary AS
SELECT 
    strftime('%Y', year_month) as year,
    strftime('%m', year_month) as month,
    year_month,
    SUM(family_count) as total_families,
    SUM(residents_count) as total_residents,
    SUM(residence_days) as total_residence_days,
    SUM(accommodation_count) as total_accommodations,
    SUM(care_service_count) as total_care_services,
    SUM(volunteer_service_count) as total_volunteer_services,
    SUM(total_service_count) as total_services,
    AVG(CASE WHEN family_count > 0 THEN residence_days * 1.0 / family_count ELSE 0 END) as avg_days_per_family,
    COUNT(*) as record_count
FROM family_service_records
GROUP BY strftime('%Y-%m', year_month)
ORDER BY year_month DESC;

-- 创建年度统计视图
CREATE VIEW IF NOT EXISTS family_service_yearly_summary AS
SELECT 
    strftime('%Y', year_month) as year,
    SUM(family_count) as total_families,
    SUM(residents_count) as total_residents,
    SUM(residence_days) as total_residence_days,
    SUM(accommodation_count) as total_accommodations,
    SUM(care_service_count) as total_care_services,
    SUM(volunteer_service_count) as total_volunteer_services,
    SUM(total_service_count) as total_services,
    AVG(CASE WHEN family_count > 0 THEN residence_days * 1.0 / family_count ELSE 0 END) as avg_days_per_family,
    COUNT(*) as record_count,
    MIN(year_month) as first_record_date,
    MAX(year_month) as last_record_date
FROM family_service_records
GROUP BY strftime('%Y', year_month)
ORDER BY year DESC;

-- 插入测试数据（基于Excel数据结构的示例）
-- 注意：实际数据将通过Excel导入功能添加
INSERT OR IGNORE INTO family_service_records (
    sequence_number, year_month, family_count, residents_count, 
    residence_days, accommodation_count, care_service_count, 
    volunteer_service_count, total_service_count, notes,
    cumulative_residence_days, cumulative_service_count
) VALUES 
    ('1', '2024-01-01', 12, 37, 96, 118, 83, 57, 158, '2024年1月服务记录', 96, 158),
    ('2', '2023-12-01', 15, 42, 118, 143, 96, 76, 219, '2023年12月服务记录', 214, 377),
    ('3', '2023-11-01', 18, 38, 87, 125, 72, 65, 190, '2023年11月服务记录', 301, 567);

-- 验证数据完整性
-- 检查记录数量
SELECT COUNT(*) as total_records FROM family_service_records;

-- 检查索引创建
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='family_service_records';

-- 检查视图创建
SELECT name FROM sqlite_master WHERE type='view' AND name LIKE 'family_service%';

-- 验证统计视图数据
SELECT * FROM family_service_monthly_summary LIMIT 5;
SELECT * FROM family_service_yearly_summary LIMIT 3;

PRAGMA table_info(family_service_records);