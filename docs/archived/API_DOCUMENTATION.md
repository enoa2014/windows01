# API 文档 - 患儿入住信息管理系统

## 概述

本文档描述了患儿入住信息管理系统的 IPC (Inter-Process Communication) API。该系统基于 Electron 框架，使用主进程和渲染进程之间的 IPC 通信来处理数据操作。

## IPC 通信架构

```
渲染进程 (Frontend)  ←→  预加载脚本 (Preload)  ←→  主进程 (Backend)
     app.js          ←→      preload.js       ←→     main.js
```

## API 接口列表

### 1. 获取患者列表

**方法名**: `get-patients`

**描述**: 获取所有去重后的患者列表信息

**参数**: 无

**返回值**:
```javascript
[
  {
    id: number,           // 人员ID
    name: string,         // 姓名
    gender: string,       // 性别 ('男' | '女')
    birth_date: string,   // 出生日期
    hometown: string,     // 籍贯
    ethnicity: string,    // 民族
    id_card: string,      // 身份证号
    check_in_count: number, // 入住次数
    latest_check_in: string, // 最近入住时间
    latest_diagnosis: string // 最近诊断
  }
]
```

**使用示例**:
```javascript
// 前端调用
const patients = await window.electronAPI.getPatients();

// 错误处理
try {
  const patients = await window.electronAPI.getPatients();
  console.log('患者列表:', patients);
} catch (error) {
  console.error('获取患者列表失败:', error);
}
```

### 2. 获取患者详细信息

**方法名**: `get-patient-detail`

**描述**: 根据人员ID获取患者的详细档案信息

**参数**:
- `personId` (number): 人员ID

**返回值**:
```javascript
{
  basic: {
    id: number,
    name: string,
    gender: string,
    birth_date: string,
    hometown: string,
    ethnicity: string,
    id_card: string
  },
  checkInRecords: [
    {
      id: number,
      check_in_date: string,
      attendees: string,
      details: string,
      treatment_plan: string
    }
  ],
  medicalInfo: [
    {
      id: number,
      hospital: string,
      diagnosis: string,
      doctor_name: string,
      symptoms: string,
      treatment_process: string,
      follow_up_plan: string,
      record_date: string
    }
  ],
  familyInfo: {
    home_address: string,
    father_name: string,
    father_phone: string,
    father_id_card: string,
    mother_name: string,
    mother_phone: string,
    mother_id_card: string,
    other_guardian: string,
    economic_status: string
  }
}
```

**使用示例**:
```javascript
// 获取特定患者详情
const patientDetail = await window.electronAPI.getPatientDetail(123);

// 错误处理
try {
  const detail = await window.electronAPI.getPatientDetail(personId);
  console.log('患者详情:', detail);
} catch (error) {
  console.error('获取患者详情失败:', error);
}
```

### 3. 导入 Excel 文件

**方法名**: `import-excel`

**描述**: 打开文件选择对话框，导入 Excel 文件中的患者数据

**参数**: 无

**返回值**:
```javascript
{
  success: boolean,     // 导入是否成功
  message: string,      // 结果消息
  data?: {             // 导入详情（成功时）
    imported: number,   // 成功导入的记录数
    skipped: number,   // 跳过的重复记录数
    errors: string[]   // 错误信息列表
  }
}
```

**使用示例**:
```javascript
// 导入Excel文件
const importResult = await window.electronAPI.importExcel();

if (importResult.success) {
  console.log('导入成功:', importResult.message);
  console.log('导入详情:', importResult.data);
} else {
  console.error('导入失败:', importResult.message);
}
```

### 4. 搜索患者

**方法名**: `search-patients`

**描述**: 根据关键词搜索患者信息

**参数**:
- `query` (string): 搜索关键词

**返回值**: 与 `get-patients` 相同的数据结构

**搜索范围**:
- 患者姓名
- 籍贯信息
- 最近诊断
- 医院名称

**使用示例**:
```javascript
// 搜索患者
const searchResults = await window.electronAPI.searchPatients('张三');

// 实时搜索示例
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', async (e) => {
  const keyword = e.target.value.trim();
  if (keyword) {
    try {
      const results = await window.electronAPI.searchPatients(keyword);
      displayPatients(results);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  }
});
```

### 5. 获取统计信息

**方法名**: `get-statistics`

**描述**: 获取系统的统计数据

**参数**: 无

**返回值**:
```javascript
{
  totalPatients: number,    // 总患者数（去重后）
  totalRecords: number,     // 总入住记录数
  genderStats: {           // 性别统计
    男: number,
    女: number
  },
  recentImports: number    // 近期导入记录数
}
```

**使用示例**:
```javascript
// 获取统计信息
const stats = await window.electronAPI.getStatistics();

// 更新页面统计显示
document.getElementById('totalPatients').textContent = stats.totalPatients;
document.getElementById('totalRecords').textContent = stats.totalRecords;
```

## 预加载脚本 API

预加载脚本通过 `contextBridge` 安全地暴露 API 给渲染进程。

**暴露的 API 对象**: `window.electronAPI`

```javascript
// preload.js 中的 API 定义
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 获取患者列表
  getPatients: () => ipcRenderer.invoke('get-patients'),
  
  // 获取患者详情
  getPatientDetail: (personId) => ipcRenderer.invoke('get-patient-detail', personId),
  
  // 导入Excel文件
  importExcel: () => ipcRenderer.invoke('import-excel'),
  
  // 搜索患者
  searchPatients: (query) => ipcRenderer.invoke('search-patients', query),
  
  // 获取统计信息
  getStatistics: () => ipcRenderer.invoke('get-statistics')
});
```

## 错误处理

### 常见错误类型

1. **数据库未初始化错误**
   ```javascript
   Error: 应用未完全初始化
   ```

2. **文件导入错误**
   ```javascript
   Error: 导入失败: Excel文件格式不正确
   Error: 导入失败: 文件读取失败
   ```

3. **数据查询错误**
   ```javascript
   Error: 获取患者列表失败: 数据库连接错误
   Error: 获取患者详情失败: 患者不存在
   ```

### 错误处理最佳实践

```javascript
// 统一错误处理函数
async function safeApiCall(apiCall, errorMessage = '操作失败') {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    // 显示用户友好的错误消息
    showErrorMessage(`${errorMessage}: ${error.message || '未知错误'}`);
    
    // 返回默认值或抛出错误
    throw error;
  }
}

// 使用示例
const patients = await safeApiCall(
  () => window.electronAPI.getPatients(),
  '获取患者列表失败'
);
```

## 数据格式规范

### Excel 导入格式要求

**必需列（支持中文表头）**:
- 序号、姓名、性别、出生日期、籍贯、民族、身份证号
- 入住时间、入住人、就诊医院、医院诊断、医生姓名
- 症状详情、医治过程、后续治疗安排
- 家庭地址、父亲信息、母亲信息、其他监护人、家庭经济

**日期格式**: 
- 出生日期: `YYYY.M.D` 格式（如：2010.3.15）
- 入住时间: `YYYY.M.D` 格式

**性别格式**: 
- 只接受 "男" 或 "女"

### 人员去重规则

系统采用以下规则进行人员去重：

1. **不同身份证号**: 视为不同人员
2. **同名有身份证 vs 同名无身份证**: 视为不同人员
3. **同名都无身份证**: 视为同一人员
4. **同名同身份证**: 视为同一人员

## 性能优化建议

### 大数据量处理

```javascript
// 分批加载患者列表
async function loadPatientsInBatches(batchSize = 50) {
  let offset = 0;
  let allPatients = [];
  
  while (true) {
    const batch = await window.electronAPI.getPatients(offset, batchSize);
    if (batch.length === 0) break;
    
    allPatients = allPatients.concat(batch);
    offset += batchSize;
    
    // 更新进度
    updateLoadingProgress(offset);
  }
  
  return allPatients;
}
```

### 搜索防抖

```javascript
// 防抖搜索
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedSearch = debounce(async (keyword) => {
  if (keyword.trim()) {
    const results = await window.electronAPI.searchPatients(keyword);
    displaySearchResults(results);
  }
}, 300);
```

## 安全注意事项

1. **输入验证**: 所有用户输入都在主进程中进行验证
2. **SQL 注入防护**: 使用参数化查询防止 SQL 注入
3. **文件路径安全**: 严格验证文件路径，防止路径遍历攻击
4. **上下文隔离**: 渲染进程与主进程通过安全的 IPC 通信

## 测试示例

### 单元测试示例

```javascript
// 测试 API 调用
describe('Patient API', () => {
  test('获取患者列表', async () => {
    const patients = await window.electronAPI.getPatients();
    expect(Array.isArray(patients)).toBe(true);
    expect(patients.length).toBeGreaterThanOrEqual(0);
  });

  test('搜索功能', async () => {
    const results = await window.electronAPI.searchPatients('测试');
    expect(Array.isArray(results)).toBe(true);
  });

  test('错误处理', async () => {
    try {
      await window.electronAPI.getPatientDetail(-1);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
```

## 版本更新说明

### v1.0.0
- 初始 API 版本
- 基础的 CRUD 操作
- Excel 导入功能
- 搜索和统计功能

---

*API 文档最后更新时间：2025年8月20日*  
*系统版本：v1.0.0*  
*API 版本：v1.0*