# 开发指南 - 患儿入住信息管理系统

## 开发环境搭建

### 系统要求

**必需环境**:
- Node.js 16.0 或更高版本
- npm 6.0 或更高版本
- Git 2.0 或更高版本
- Windows 7 或更高版本

**推荐环境**:
- Node.js 18.x LTS
- npm 9.x
- VS Code 1.80+
- Windows 10/11

### 环境安装

```bash
# 1. 验证 Node.js 安装
node --version  # 应显示 v16.0.0 或更高

# 2. 验证 npm 安装
npm --version   # 应显示 6.0.0 或更高

# 3. 克隆项目
git clone <repository-url>
cd app02

# 4. 安装项目依赖
npm install

# 5. 验证安装
npm run dev    # 启动开发模式
```

### IDE 配置

**VS Code 推荐插件**:
```json
{
  "recommendations": [
    "ms-vscode.vscode-javascript",
    "bradlc.vscode-tailwindcss",
    "alexcvzz.vscode-sqlite",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "ms-ceintl.vscode-language-pack-zh-hans"
  ]
}
```

**VS Code 配置文件** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "javascript.preferences.quoteStyle": "single",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.sql": "sql"
  }
}
```

## 项目结构详解

```
app02/
├── src/                          # 源代码目录
│   ├── main.js                   # Electron 主进程入口
│   │   ├── App 类                # 应用主类
│   │   ├── IPC 处理器注册        # IPC 通信处理
│   │   └── 应用生命周期管理      # 窗口创建和关闭
│   │
│   ├── preload.js                # 预加载脚本
│   │   ├── contextBridge 设置    # 安全 API 暴露
│   │   └── IPC 通信封装          # 渲染进程通信接口
│   │
│   ├── database/                 # 数据库层
│   │   └── DatabaseManager.js    # 数据库管理器
│   │       ├── 连接管理          # SQLite 连接处理
│   │       ├── 表结构初始化      # 数据表创建
│   │       ├── CRUD 操作         # 增删改查方法
│   │       └── 去重逻辑          # 人员去重算法
│   │
│   ├── services/                 # 业务服务层
│   │   └── ExcelImporter.js      # Excel 导入服务
│   │       ├── 文件解析          # XLSX 文件处理
│   │       ├── 数据映射          # Excel 到数据库映射
│   │       ├── 数据验证          # 导入数据校验
│   │       └── 批量处理          # 大文件处理优化
│   │
│   └── renderer/                 # 渲染进程（前端）
│       ├── index.html            # 主页面模板
│       │   ├── 页面结构          # HTML 骨架
│       │   ├── 样式引入          # TailwindCSS 集成
│       │   └── 脚本引入          # JavaScript 模块
│       │
│       └── js/
│           └── app.js            # 前端应用逻辑
│               ├── PatientApp 类 # 主应用类
│               ├── 事件处理      # 用户交互处理
│               ├── 数据渲染      # UI 数据绑定
│               ├── 主题管理      # 主题切换逻辑
│               └── 工具函数      # 辅助功能函数
│
├── docs/                         # 项目文档
│   ├── PROJECT_OVERVIEW.md       # 项目概览
│   ├── API_DOCUMENTATION.md      # API 文档
│   └── DEVELOPMENT_GUIDE.md      # 开发指南（本文档）
│
├── database-schema.sql           # 数据库架构定义
├── package.json                  # 项目配置和依赖
├── README.md                     # 项目说明
└── .gitignore                    # Git 忽略规则
```

## 核心模块开发

### 1. 数据库层开发 (DatabaseManager)

**职责**: 
- SQLite 数据库连接管理
- 数据表结构维护
- 数据 CRUD 操作
- 人员去重逻辑实现

**关键方法**:

```javascript
class DatabaseManager {
  // 数据库初始化
  async initialize() {
    // 创建数据库连接
    // 执行表结构脚本
    // 建立索引优化
  }

  // 患者列表查询
  async getPatients() {
    // 多表联查获取患者信息
    // 统计入住次数
    // 获取最新诊断信息
  }

  // 人员去重逻辑
  async findOrCreatePerson(name, idCard) {
    // 实现去重规则:
    // 1. 同身份证号 → 同一人
    // 2. 同名无身份证 → 同一人
    // 3. 其他情况 → 不同人
  }

  // 数据搜索
  async searchPatients(query) {
    // 模糊搜索姓名、籍贯、诊断
    // SQL LIKE 查询优化
  }
}
```

**开发注意事项**:
- 使用参数化查询防止 SQL 注入
- 合理使用索引提升查询性能
- 实现连接池管理避免资源泄漏
- 加入详细的错误日志记录

### 2. Excel 导入服务 (ExcelImporter)

**职责**:
- Excel 文件解析
- 数据格式验证
- 批量数据导入
- 错误处理和回滚

**关键实现**:

```javascript
class ExcelImporter {
  // 文件导入主流程
  async importFile(filePath) {
    try {
      // 1. 读取 Excel 文件
      const rawData = this.readExcelFile(filePath);
      
      // 2. 解析表头映射
      const parsedData = this.parseExcelData(rawData);
      
      // 3. 数据验证
      const validatedData = this.validateData(parsedData);
      
      // 4. 批量导入
      const result = await this.batchImport(validatedData);
      
      return result;
    } catch (error) {
      // 错误处理和日志记录
      await this.handleImportError(error);
      throw error;
    }
  }

  // 表头映射配置
  getColumnMapping() {
    return {
      '姓名': 'name',
      '性别': 'gender',
      '出生日期': 'birth_date',
      '籍贯': 'hometown',
      '身份证号': 'id_card',
      // ... 其他字段映射
    };
  }

  // 数据验证规则
  validateRecord(record) {
    const errors = [];
    
    if (!record.name) errors.push('姓名不能为空');
    if (record.gender && !['男', '女'].includes(record.gender)) {
      errors.push('性别只能是"男"或"女"');
    }
    if (record.birth_date && !this.isValidDate(record.birth_date)) {
      errors.push('出生日期格式错误');
    }
    
    return errors;
  }
}
```

### 3. 前端应用开发 (PatientApp)

**职责**:
- 用户界面管理
- 事件处理和数据绑定
- 主题切换
- 搜索和筛选逻辑

**核心架构**:

```javascript
class PatientApp {
  constructor() {
    this.patients = [];           // 患者数据
    this.filteredPatients = [];   // 筛选后数据
    this.currentView = 'list';    // 当前视图状态
    this.elements = {};           // DOM 元素缓存
    
    this.init();
  }

  // 应用初始化
  async init() {
    this.cacheElements();         // 缓存 DOM 元素
    this.bindEvents();            // 绑定事件处理器
    this.initTheme();             // 初始化主题
    await this.loadData();        // 加载初始数据
  }

  // 事件绑定
  bindEvents() {
    // 搜索防抖处理
    this.elements.searchInput.addEventListener('input', 
      this.debounce(this.handleSearch.bind(this), 300)
    );
    
    // 键盘快捷键
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
    
    // 主题切换
    this.elements.themeToggleBtn.addEventListener('click', 
      this.toggleTheme.bind(this)
    );
  }

  // 数据渲染
  renderPatients(patients = this.filteredPatients) {
    // 虚拟滚动优化（大数据量）
    if (patients.length > 100) {
      this.renderWithVirtualScroll(patients);
    } else {
      this.renderDirectly(patients);
    }
  }

  // 搜索处理
  handleSearch(query) {
    if (!query.trim()) {
      this.filteredPatients = this.patients;
    } else {
      this.filteredPatients = this.patients.filter(patient => 
        patient.name.includes(query) ||
        patient.hometown?.includes(query) ||
        patient.latest_diagnosis?.includes(query)
      );
    }
    this.renderPatients();
    this.updateResultCount();
  }
}
```

## 开发工作流

### 1. 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature-name

# 2. 开发功能
# - 编写代码
# - 添加注释
# - 单元测试

# 3. 本地测试
npm run dev           # 开发模式测试
npm run test          # 运行测试套件

# 4. 代码检查
npm run lint          # 代码规范检查
npm run build-win     # 构建测试

# 5. 提交代码
git add .
git commit -m "feat: 添加新功能描述"

# 6. 合并主分支
git checkout main
git merge feature/new-feature-name
```

### 2. 调试技巧

**主进程调试**:
```bash
# 启动调试模式
npm run dev

# 查看主进程日志
# 日志输出在控制台
console.log('主进程日志:', data);
```

**渲染进程调试**:
```javascript
// 在开发模式下自动打开 DevTools
if (process.argv.includes('--dev')) {
  this.mainWindow.webContents.openDevTools();
}

// 前端调试
console.log('渲染进程日志:', data);
debugger; // 设置断点
```

**数据库调试**:
```bash
# 使用 SQLite 浏览器查看数据
# 数据库文件位置: %APPDATA%/patient-checkin-manager/patients.db

# 或在代码中启用 SQL 日志
this.db.on('trace', (sql) => {
  console.log('SQL:', sql);
});
```

### 3. 性能优化

**前端优化**:
```javascript
// 虚拟滚动实现
class VirtualScrollManager {
  constructor(container, itemHeight) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.renderBuffer = 5;
  }

  updateVisibleRange(scrollTop, containerHeight) {
    this.visibleStart = Math.floor(scrollTop / this.itemHeight);
    this.visibleEnd = Math.min(
      this.visibleStart + Math.ceil(containerHeight / this.itemHeight) + this.renderBuffer,
      this.data.length
    );
  }

  render() {
    const fragment = document.createDocumentFragment();
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const item = this.renderItem(this.data[i], i);
      fragment.appendChild(item);
    }
    this.container.innerHTML = '';
    this.container.appendChild(fragment);
  }
}

// 防抖函数优化搜索
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
```

**数据库优化**:
```sql
-- 索引优化
CREATE INDEX idx_patients_search ON persons(name, hometown);
CREATE INDEX idx_medical_diagnosis ON medical_info(diagnosis);
CREATE INDEX idx_check_in_date ON check_in_records(check_in_date DESC);

-- 查询优化
EXPLAIN QUERY PLAN 
SELECT * FROM persons 
WHERE name LIKE '%张%' 
ORDER BY created_at DESC;
```

## 测试指南

### 1. 单元测试

**测试框架**: Jest

**测试配置** (`jest.config.js`):
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html']
};
```

**数据库测试示例**:
```javascript
// __tests__/DatabaseManager.test.js
const DatabaseManager = require('../src/database/DatabaseManager');

describe('DatabaseManager', () => {
  let dbManager;

  beforeEach(async () => {
    dbManager = new DatabaseManager();
    await dbManager.initialize();
  });

  afterEach(async () => {
    await dbManager.close();
  });

  test('应能正确创建和查询患者', async () => {
    const testPatient = {
      name: '测试患者',
      gender: '男',
      birth_date: '2000.1.1',
      id_card: '123456789012345678'
    };

    const personId = await dbManager.createPerson(testPatient);
    expect(personId).toBeDefined();

    const patients = await dbManager.getPatients();
    expect(patients.length).toBeGreaterThan(0);
  });

  test('应能正确实现去重逻辑', async () => {
    // 测试同名同身份证的去重
    const patient1 = { name: '张三', id_card: '123' };
    const patient2 = { name: '张三', id_card: '123' };

    const person1 = await dbManager.findOrCreatePerson(patient1.name, patient1.id_card);
    const person2 = await dbManager.findOrCreatePerson(patient2.name, patient2.id_card);

    expect(person1.id).toBe(person2.id);
  });
});
```

### 2. 集成测试

**Excel 导入测试**:
```javascript
// __tests__/integration/ExcelImport.test.js
const ExcelImporter = require('../src/services/ExcelImporter');
const DatabaseManager = require('../src/database/DatabaseManager');
const path = require('path');

describe('Excel 导入集成测试', () => {
  let dbManager, excelImporter;

  beforeEach(async () => {
    dbManager = new DatabaseManager();
    await dbManager.initialize();
    excelImporter = new ExcelImporter(dbManager);
  });

  test('应能正确导入测试 Excel 文件', async () => {
    const testFile = path.join(__dirname, 'fixtures/test-data.xlsx');
    const result = await excelImporter.importFile(testFile);

    expect(result.success).toBe(true);
    expect(result.imported).toBeGreaterThan(0);
    
    const patients = await dbManager.getPatients();
    expect(patients.length).toBe(result.imported);
  });
});
```

### 3. 端到端测试

**使用 Spectron 进行 E2E 测试**:
```javascript
// __tests__/e2e/app.e2e.test.js
const Application = require('spectron').Application;
const electronPath = require('electron');
const path = require('path');

describe('应用端到端测试', () => {
  let app;

  beforeEach(async () => {
    app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '../../src/main.js')]
    });
    await app.start();
  });

  afterEach(async () => {
    if (app && app.isRunning()) {
      await app.stop();
    }
  });

  test('应能正确启动应用', async () => {
    const count = await app.client.getWindowCount();
    expect(count).toBe(1);
    
    const title = await app.client.getTitle();
    expect(title).toBe('患儿入住信息管理系统');
  });

  test('应能正确显示患者列表', async () => {
    await app.client.waitUntilWindowLoaded();
    
    const patientGrid = await app.client.$('#patientGrid');
    expect(await patientGrid.isDisplayed()).toBe(true);
  });
});
```

## 构建和部署

### 1. 开发构建

```bash
# 开发模式（热重载）
npm run dev

# 生产模式测试
npm start
```

### 2. 打包构建

```bash
# 构建 Windows 版本
npm run build-win

# 构建所有平台（如果配置了）
npm run build

# 清理构建缓存
rm -rf dist/ node_modules/.cache
```

### 3. 构建配置优化

**electron-builder 配置** (`package.json`):
```json
{
  "build": {
    "appId": "com.yourcompany.patient-manager",
    "productName": "患儿入住信息管理系统",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "assets/**/*",
      "node_modules/**/*",
      "!node_modules/electron/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico",
      "requestedExecutionLevel": "asInvoker"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "compression": "maximum",
    "asar": true
  }
}
```

## 代码规范

### 1. JavaScript 编码规范

**变量命名**:
```javascript
// 使用 camelCase
const patientList = [];
const checkInDate = new Date();

// 常量使用 UPPER_CASE
const MAX_IMPORT_SIZE = 10000;
const API_ENDPOINTS = {
  GET_PATIENTS: 'get-patients'
};

// 类名使用 PascalCase
class DatabaseManager {}
class PatientApp {}
```

**函数编写**:
```javascript
// 使用 async/await 而不是 Promise.then()
async function getPatients() {
  try {
    const patients = await dbManager.getPatients();
    return patients;
  } catch (error) {
    console.error('获取患者列表失败:', error);
    throw error;
  }
}

// 函数应该单一职责
function validatePatientData(data) {
  // 只负责数据验证
}

function savePatientData(data) {
  // 只负责数据保存
}
```

### 2. 错误处理规范

```javascript
// 统一错误处理
class AppError extends Error {
  constructor(message, code, cause) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

// 使用示例
try {
  await dbManager.getPatients();
} catch (error) {
  throw new AppError(
    '获取患者列表失败', 
    'DB_QUERY_ERROR', 
    error
  );
}
```

### 3. 注释规范

```javascript
/**
 * 数据库管理器类
 * 负责 SQLite 数据库的连接管理和数据操作
 */
class DatabaseManager {
  /**
   * 初始化数据库连接和表结构
   * @async
   * @throws {Error} 数据库连接或表创建失败时抛出错误
   */
  async initialize() {
    // 实现代码
  }

  /**
   * 根据去重规则查找或创建人员记录
   * @param {string} name - 患者姓名
   * @param {string|null} idCard - 身份证号码
   * @returns {Promise<Object>} 人员记录对象
   */
  async findOrCreatePerson(name, idCard) {
    // 实现代码
  }
}
```

## 安全指南

### 1. Electron 安全配置

```javascript
// 主进程安全配置
const secureWindowOptions = {
  webPreferences: {
    nodeIntegration: false,        // 禁用 Node.js 集成
    contextIsolation: true,        // 启用上下文隔离
    enableRemoteModule: false,     // 禁用远程模块
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
    webSecurity: true,
    preload: path.join(__dirname, 'preload.js') // 安全的预加载脚本
  }
};
```

### 2. 数据库安全

```javascript
// 参数化查询防止 SQL 注入
async searchPatients(query) {
  const sql = `
    SELECT * FROM persons 
    WHERE name LIKE ? OR hometown LIKE ?
  `;
  return this.all(sql, [`%${query}%`, `%${query}%`]);
}

// 输入验证
function validateInput(data) {
  if (typeof data !== 'string') {
    throw new Error('输入必须是字符串');
  }
  
  if (data.length > 1000) {
    throw new Error('输入长度超出限制');
  }
  
  // 过滤特殊字符
  return data.replace(/[<>'"&]/g, '');
}
```

### 3. 文件操作安全

```javascript
// 安全的文件路径验证
function validateFilePath(filePath) {
  const path = require('path');
  
  // 检查文件扩展名
  const allowedExtensions = ['.xlsx', '.xls'];
  const ext = path.extname(filePath).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('不支持的文件类型');
  }
  
  // 防止路径遍历攻击
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..')) {
    throw new Error('非法的文件路径');
  }
  
  return normalizedPath;
}
```

## 故障排除

### 1. 常见问题和解决方案

**问题**: 数据库连接失败
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**解决方案**:
```javascript
// 确保数据目录存在
const fs = require('fs').promises;
const userDataPath = app.getPath('userData');
await fs.mkdir(userDataPath, { recursive: true });

// 检查文件权限
const stats = await fs.stat(this.dbPath);
console.log('数据库文件权限:', stats.mode);
```

**问题**: Excel 导入失败
```
Error: Cannot read property 'Sheets' of undefined
```

**解决方案**:
```javascript
// 验证文件存在性和格式
const fs = require('fs');
if (!fs.existsSync(filePath)) {
  throw new Error('文件不存在');
}

// 添加文件格式检查
const XLSX = require('xlsx');
try {
  const workbook = XLSX.readFile(filePath, { type: 'file' });
  if (!workbook.SheetNames.length) {
    throw new Error('Excel 文件没有工作表');
  }
} catch (error) {
  throw new Error('无效的 Excel 文件格式');
}
```

### 2. 性能问题诊断

**内存使用监控**:
```javascript
// 监控内存使用
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('内存使用:', {
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB'
  });
}, 30000);
```

**数据库查询性能**:
```javascript
// 查询性能分析
async function analyzeQuery(sql, params) {
  console.time('查询耗时');
  
  const result = await this.all(`EXPLAIN QUERY PLAN ${sql}`, params);
  console.log('查询计划:', result);
  
  const data = await this.all(sql, params);
  console.timeEnd('查询耗时');
  
  return data;
}
```

## 版本控制

### 1. Git 工作流

```bash
# 主分支保护
git checkout main
git pull origin main

# 功能开发
git checkout -b feature/patient-search-optimization
git add .
git commit -m "feat: 优化患者搜索性能"

# 代码审查
git push origin feature/patient-search-optimization
# 创建 Pull Request

# 发布版本
git checkout main
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
```

### 2. 提交消息规范

```bash
# 格式: type(scope): description

# 新功能
git commit -m "feat(search): 添加模糊搜索功能"

# 错误修复
git commit -m "fix(database): 修复数据库连接泄漏问题"

# 文档更新
git commit -m "docs(api): 更新 API 文档"

# 性能优化
git commit -m "perf(query): 优化患者列表查询性能"

# 重构
git commit -m "refactor(ui): 重构主题切换逻辑"
```

---

*开发指南最后更新时间：2025年8月20日*  
*文档版本：v1.0*