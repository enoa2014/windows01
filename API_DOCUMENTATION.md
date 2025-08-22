# API 文档 - 患儿入住信息管理系统

## 📋 概览

本文档描述了患儿入住信息管理系统的所有API接口和数据结构。系统基于Electron IPC通信机制，提供前后端数据交互功能。

## 🏗️ 架构说明

### IPC 通信模式
- **主进程**: `src/main.js` - 处理所有IPC请求
- **渲染进程**: `src/renderer/js/app.js` - 发起API调用
- **预加载脚本**: `src/preload.js` - 提供安全的API接口

## 📡 核心API接口

### 1. 患儿管理 API

#### 获取患儿列表
```javascript
// 接口名称: get-patients
// 调用方式: window.electronAPI.getPatients()
// 返回: Promise<Array<Patient>>

// 示例调用
const patients = await window.electronAPI.getPatients();
```

**返回数据结构**:
```javascript
{
  id: number,           // 患儿ID
  name: string,         // 姓名
  gender: string,       // 性别
  age: number,          // 年龄
  idCard: string,       // 身份证号
  diagnosis: string,    // 诊断信息
  hometown: string,     // 籍贯
  checkInCount: number, // 入住次数
  lastCheckIn: string   // 最后入住日期
}
```

#### 获取患儿详情
```javascript
// 接口名称: get-patient-detail
// 调用方式: window.electronAPI.getPatientDetail(personId)
// 参数: personId (number) - 患儿ID
// 返回: Promise<PatientDetail>

// 示例调用
const detail = await window.electronAPI.getPatientDetail(123);
```

**返回数据结构**:
```javascript
{
  profile: {
    id: number,
    name: string,
    gender: string,
    age: number,
    idCard: string,
    diagnosis: string,
    hometown: string
  },
  checkIns: Array<CheckInRecord>,
  medicalInfo: Array<MedicalRecord>
}
```

#### 搜索患儿
```javascript
// 接口名称: search-patients
// 调用方式: window.electronAPI.searchPatients(query)
// 参数: query (string) - 搜索关键词
// 返回: Promise<Array<Patient>>

// 示例调用
const results = await window.electronAPI.searchPatients('张三');
```

### 2. 统计分析 API

#### 获取基础统计
```javascript
// 接口名称: get-statistics
// 调用方式: window.electronAPI.getStatistics()
// 返回: Promise<Statistics>

// 示例调用
const stats = await window.electronAPI.getStatistics();
```

**返回数据结构**:
```javascript
{
  totalPatients: number,        // 总患儿数
  totalRecords: number,         // 总记录数
  ageDistribution: {
    '0-3': number,
    '4-12': number,
    '13-18': number
  },
  genderDistribution: {
    male: number,
    female: number
  },
  diagnosisStats: Array<{
    diagnosis: string,
    count: number
  }>,
  monthlyTrend: Array<{
    month: string,
    count: number
  }>
}
```

#### 获取扩展统计
```javascript
// 接口名称: get-extended-statistics
// 调用方式: window.electronAPI.getExtendedStatistics()
// 返回: Promise<ExtendedStatistics>

// 示例调用
const extendedStats = await window.electronAPI.getExtendedStatistics();
```

#### 获取年龄组患儿
```javascript
// 接口名称: get-age-group-patients
// 调用方式: window.electronAPI.getAgeGroupPatients(ageRange)
// 参数: ageRange (string) - 年龄范围 ('0-3', '4-12', '13-18')
// 返回: Promise<Array<Patient>>

// 示例调用
const youngPatients = await window.electronAPI.getAgeGroupPatients('0-3');
```

### 3. 家庭服务 API

#### 获取家庭服务记录
```javascript
// 接口名称: familyService.getRecords
// 调用方式: window.electronAPI.familyService.getRecords(filters, pagination)
// 参数: 
//   - filters (Object) - 筛选条件
//   - pagination (Object) - 分页参数
// 返回: Promise<Array<FamilyServiceRecord>>

// 示例调用
const records = await window.electronAPI.familyService.getRecords({
  year: '2024',
  search: '关键词'
}, {
  limit: 20,
  offset: 0
});
```

**筛选条件参数**:
```javascript
{
  year?: string,          // 年份筛选
  month?: string,         // 月份筛选
  search?: string,        // 搜索关键词
  startDate?: string,     // 开始日期
  endDate?: string,       // 结束日期
  minServices?: number,   // 最小服务人次
  sort?: string          // 排序方式
}
```

**分页参数**:
```javascript
{
  limit?: number,         // 每页条数
  offset?: number        // 偏移量
}
```

#### 获取家庭服务概览统计
```javascript
// 接口名称: familyService.getOverviewStats
// 调用方式: window.electronAPI.familyService.getOverviewStats()
// 返回: Promise<FamilyServiceStats>

// 示例调用
const stats = await window.electronAPI.familyService.getOverviewStats();
```

**返回数据结构**:
```javascript
{
  overall: {
    totalRecords: number,
    totalFamilies: number,
    totalResidents: number,
    totalServices: number,
    totalResidenceDays: number,
    avgDaysPerFamily: number,
    avgServicesPerResident: number,
    firstRecordDate: string,
    lastRecordDate: string
  },
  currentYear: {
    recordsThisYear: number,
    familiesThisYear: number,
    servicesThisYear: number
  },
  monthlyTrend: Array<{
    month: string,
    families: number,
    services: number,
    records: number
  }>,
  yearlyComparison: Array<{
    year: string,
    families: number,
    services: number,
    avgDays: number,
    records: number
  }>
}
```

#### 获取家庭服务筛选选项
```javascript
// 接口名称: familyService.getFilterOptions
// 调用方式: window.electronAPI.familyService.getFilterOptions()
// 返回: Promise<FilterOptions>

// 示例调用
const options = await window.electronAPI.familyService.getFilterOptions();
```

**返回数据结构**:
```javascript
{
  years: Array<string>,           // 可用年份列表
  months: Array<{
    value: string,
    label: string
  }>,
  serviceRange: {
    minServices: number,
    maxServices: number
  }
}
```

### 4. 数据导入导出 API

#### Excel导入
```javascript
// 接口名称: import-excel
// 调用方式: window.electronAPI.importExcel()
// 返回: Promise<ImportResult>

// 示例调用
const result = await window.electronAPI.importExcel();
```

#### 家庭服务导出
```javascript
// 接口名称: familyService.exportExcel
// 调用方式: window.electronAPI.familyService.exportExcel(filters)
// 参数: filters (Object) - 导出筛选条件
// 返回: Promise<ExportResult>

// 示例调用
const result = await window.electronAPI.familyService.exportExcel({
  year: '2024'
});
```

## 🏛️ 数据库结构

### persons 表
```sql
CREATE TABLE persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gender TEXT,
    age INTEGER,
    id_card TEXT UNIQUE,
    diagnosis TEXT,
    hometown TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### family_service_records 表
```sql
CREATE TABLE family_service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sequence_number TEXT,
    year_month DATE NOT NULL,
    family_count INTEGER DEFAULT 0,
    residents_count INTEGER DEFAULT 0,
    residence_days INTEGER DEFAULT 0,
    accommodation_count INTEGER DEFAULT 0,
    care_service_count INTEGER DEFAULT 0,
    volunteer_service_count INTEGER DEFAULT 0,
    total_service_count INTEGER DEFAULT 0,
    notes TEXT,
    cumulative_residence_days INTEGER DEFAULT 0,
    cumulative_service_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 错误处理

### 错误码规范
```javascript
{
  code: string,           // 错误码
  message: string,        // 错误信息
  details?: any          // 详细错误信息
}
```

### 常见错误码
- `DATABASE_ERROR` - 数据库操作错误
- `VALIDATION_ERROR` - 数据验证错误
- `FILE_ERROR` - 文件操作错误
- `PERMISSION_ERROR` - 权限错误

## 📊 数据验证

### 患儿数据验证
- `name`: 必填，字符串
- `age`: 可选，正整数
- `idCard`: 可选，符合身份证格式
- `gender`: 可选，'男'或'女'

### 家庭服务记录验证
- `year_month`: 必填，有效日期格式
- 数值字段: 非负整数
- `notes`: 可选，字符串

## 🚀 使用示例

### 完整的数据获取流程
```javascript
// 1. 获取患儿列表
const patients = await window.electronAPI.getPatients();

// 2. 获取统计数据
const stats = await window.electronAPI.getStatistics();

// 3. 搜索特定患儿
const searchResults = await window.electronAPI.searchPatients('张');

// 4. 获取患儿详情
if (searchResults.length > 0) {
  const detail = await window.electronAPI.getPatientDetail(searchResults[0].id);
}

// 5. 获取家庭服务数据
const familyServices = await window.electronAPI.familyService.getRecords({
  year: '2024'
});
```

## 📝 注意事项

1. **异步操作**: 所有API都是异步的，需要使用`await`或`.then()`
2. **错误处理**: 建议使用`try-catch`包装API调用
3. **数据量**: 大量数据操作时考虑分页加载
4. **性能**: 频繁调用时注意防抖处理

---

**最后更新**: 2025-08-22  
**版本**: 1.0.0