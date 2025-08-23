# 开发指南 - 患儿入住信息管理系统

## 🚀 快速开始

### 环境要求
- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### 安装和启动
```bash
# 1. 克隆项目
git clone <repository-url>
cd patient-checkin-manager

# 2. 安装依赖
npm install

# 3. 启动开发模式
npm start

# 4. 启动开发调试模式
npm run dev
```

## 🏗️ 项目结构详解

### 核心目录说明
```
src/
├── main.js                    # Electron 主进程 - 应用启动入口
├── preload.js                 # 预加载脚本 - 安全的IPC桥接
├── database/                  # 数据访问层
│   └── DatabaseManager.js     # SQLite 数据库管理
├── services/                  # 业务逻辑层
│   ├── FamilyServiceManager.js    # 家庭服务业务逻辑
│   ├── FamilyServiceImporter.js   # Excel 导入导出
│   └── ExcelImporter.js           # 通用 Excel 处理
├── config/                    # 配置管理
│   ├── resources.js           # 资源适配器配置
│   ├── columns.js             # 表格列定义
│   └── filters.js             # 筛选器配置
├── utils/                     # 工具函数
│   ├── ExcelDiagnostics.js    # Excel 文件诊断
│   └── DataFixer.js           # 数据修复工具
├── viewmodels/               # 视图模型层
│   └── FamilyServiceViewModel.js  # 家庭服务视图模型
└── renderer/                 # 前端渲染层
    ├── index.html            # 主页面
    ├── family-service.html   # 家庭服务页面
    ├── js/
    │   ├── app.js            # 主应用逻辑
    │   └── family-service-app.js  # 家庭服务应用
    ├── styles/               # 样式文件
    └── css/                  # 主题样式
```

## 🛠️ 开发规范

### 代码风格
- **JavaScript**: ES6+ 语法，async/await 优先
- **注释**: JSDoc 格式的函数注释
- **命名**: camelCase 变量名，PascalCase 类名
- **文件**: kebab-case 文件名

### 提交规范
```
feat: 新功能
fix: 错误修复
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建工具或辅助工具的变动
```

### 分支管理
- `master`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 热修复分支

## 🔧 核心组件开发

### 1. 数据库操作

#### 添加新表
```javascript
// 在 DatabaseManager.js 的 createTables 方法中添加
async createTables() {
    const createNewTable = `
        CREATE TABLE IF NOT EXISTS new_table (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await this.run(createNewTable);
}
```

#### 新增数据操作方法
```javascript
// 在 DatabaseManager.js 中添加新方法
async getNewTableData(filters = {}) {
    let sql = 'SELECT * FROM new_table';
    const params = [];
    
    if (filters.name) {
        sql += ' WHERE name LIKE ?';
        params.push(`%${filters.name}%`);
    }
    
    return await this.all(sql, params);
}
```

### 2. 业务服务层

#### 创建新的服务管理器
```javascript
// src/services/NewServiceManager.js
class NewServiceManager {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.tableName = 'new_table';
    }
    
    /**
     * 获取记录列表
     * @param {Object} filters 筛选条件
     * @returns {Array} 记录列表
     */
    async getRecords(filters = {}) {
        // 实现业务逻辑
    }
}

module.exports = NewServiceManager;
```

### 3. 前端组件

#### 添加新页面
```html
<!-- src/renderer/new-page.html -->
<!DOCTYPE html>
<html>
<head>
    <title>新页面</title>
    <link rel="stylesheet" href="./css/statistics.css">
</head>
<body>
    <main id="newPageContent">
        <!-- 页面内容 -->
    </main>
    <script src="./js/new-page-app.js"></script>
</body>
</html>
```

#### 对应的 JavaScript 文件
```javascript
// src/renderer/js/new-page-app.js
class NewPageApp {
    constructor() {
        this.initialize();
    }
    
    async initialize() {
        await this.loadData();
        this.bindEvents();
    }
    
    async loadData() {
        try {
            const data = await window.electronAPI.newService.getData();
            this.renderData(data);
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new NewPageApp();
});
```

### 4. IPC 通信

#### 在主进程中注册新的 IPC 处理器
```javascript
// src/main.js 中添加
ipcMain.handle('newService:getData', async (event, filters) => {
    try {
        const manager = new NewServiceManager(this.databaseManager);
        return await manager.getRecords(filters);
    } catch (error) {
        console.error('新服务数据获取失败:', error);
        throw error;
    }
});
```

#### 在预加载脚本中暴露 API
```javascript
// src/preload.js 中添加
contextBridge.exposeInMainWorld('electronAPI', {
    // 现有 API...
    newService: {
        getData: (filters) => ipcRenderer.invoke('newService:getData', filters)
    }
});
```

## 🎨 UI/UX 开发

### 主题系统
系统支持多主题切换，主题定义在 CSS 变量中：

```css
:root {
    /* 品牌色 */
    --brand-primary: #0d9488;
    --brand-secondary: #0f766e;
    
    /* 背景色 */
    --bg-primary: #f8fafc;
    --bg-secondary: #ffffff;
    
    /* 文字色 */
    --text-primary: #334155;
    --text-secondary: #64748b;
}
```

### 响应式设计
使用 Tailwind CSS 实现响应式布局：

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- 内容 -->
</div>
```

### 组件样式规范
```css
/* 卡片组件 */
.card {
    @apply rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-sm;
}

/* 按钮组件 */
.btn {
    @apply px-4 py-2 rounded-lg font-medium transition-all;
}

.btn-primary {
    @apply bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-secondary)];
}
```

## 📊 数据处理

### Excel 导入流程
1. **文件选择**: 用户选择 Excel 文件
2. **格式检测**: 自动检测文件结构
3. **数据验证**: 验证数据格式和完整性
4. **错误处理**: 显示验证错误和建议
5. **数据导入**: 将验证通过的数据写入数据库

### 数据验证规则
```javascript
const validationRules = {
    name: {
        required: true,
        type: 'string',
        maxLength: 50
    },
    age: {
        required: false,
        type: 'number',
        min: 0,
        max: 120
    },
    idCard: {
        required: false,
        pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
    }
};
```

## 🧪 测试

### 单元测试
```javascript
// tests/services/FamilyServiceManager.test.js
const FamilyServiceManager = require('../../src/services/FamilyServiceManager');

describe('FamilyServiceManager', () => {
    test('should get records with filters', async () => {
        const manager = new FamilyServiceManager(mockDb);
        const records = await manager.getRecords({ year: '2024' });
        expect(records).toBeDefined();
        expect(Array.isArray(records)).toBe(true);
    });
});
```

### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- FamilyServiceManager.test.js

# 生成覆盖率报告
npm test -- --coverage
```

### 维护脚本与诊断

项目根目录下提供一些辅助脚本，用于检查业务逻辑或修复数据：

```bash
# 校验年龄逻辑
node test-age-logic-fix.js

# 批量修复姓名格式
node fix-names.js
```

上述脚本默认使用 `data/` 目录中的 SQLite 数据库，可根据需要调整路径。

## 🔍 调试技巧

### Electron 调试
```bash
# 启动开发者工具
npm run dev
# 然后按 Ctrl+Shift+I (Windows/Linux) 或 Cmd+Option+I (macOS)
```

### 数据库调试
```javascript
// 在 DatabaseManager.js 中添加调试日志
console.log('执行SQL:', sql);
console.log('参数:', params);
```

### 日志记录
```javascript
// 统一的日志格式
console.log('🔍 [模块名] 操作描述:', data);
console.error('❌ [模块名] 错误信息:', error);
console.warn('⚠️ [模块名] 警告信息:', warning);
```

## 🚀 性能优化

### 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_family_service_year_month ON family_service_records(year_month);
```

### 前端优化
```javascript
// 防抖搜索
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// 使用
const debouncedSearch = debounce(searchFunction, 300);
```

### 内存管理
```javascript
// 及时清理事件监听器
window.addEventListener('beforeunload', () => {
    // 清理资源
    cleanup();
});
```

## 📦 构建和打包

### 开发构建
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### Windows 安装包
```bash
npm run build-win
```

### 构建配置
构建配置位于 `package.json` 的 `build` 字段中，可以自定义：
- 应用图标
- 安装程序选项
- 文件包含/排除规则

## 🔒 安全注意事项

### 数据安全
- SQL 注入防护：使用参数化查询
- 文件路径验证：防止路径遍历攻击
- 数据验证：严格验证用户输入

### IPC 安全
- 使用 `contextBridge` 安全地暴露 API
- 避免直接暴露 Node.js 模块
- 验证渲染进程传入的参数

## 📚 参考资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [SQLite 文档](https://www.sqlite.org/docs.html)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Chart.js 文档](https://www.chartjs.org/docs/)

---

**最后更新**: 2025-08-23
**维护者**: 开发团队

---

## 🧭 架构与数据流（精要）

- 主进程（`src/main.js`）
  - 初始化数据库（读取 `database-schema.sql` 创建表/索引，启用外键）
  - 注册 IPC：患者、统计、年龄段、家庭服务（列表/统计/导入导出）
- 预加载（`src/preload.js`）
  - 通过 `contextBridge` 暴露安全 API 到 `window.electronAPI`
- 渲染层（`src/renderer/*`）
  - 纯前端 HTML/CSS/JS，调用 `window.electronAPI` 获取数据，Tailwind + Chart.js 绘图
- 服务层（`src/services/*`）
  - Excel 导入导出、家庭服务统计、数据校验
- 数据层（`src/database/DatabaseManager.js`）
  - 统一 `run/get/all` 封装、聚合统计、去重插入

数据流：Renderer → Preload(window.electronAPI) → Main(IPC handler) → DatabaseManager(SQLite)

## 🗃️ 核心表（节选）

- `persons`：人员去重主表（name、id_card）
- `patient_profiles`：患者档案（gender、birth_date、hometown、ethnicity）
- `check_in_records`：入住记录（check_in_date、attendees、details、treatment_plan）
- `medical_info`：医疗信息（hospital、diagnosis、doctor_name、record_date）
- `family_info`：家庭信息（父母与经济情况）
- `family_service_records`：家庭/关怀服务月度聚合（families、services、days 等指标）

表定义详见 `database-schema.sql` 与 `docs/DATABASE_SCHEMA.md`。

## 🔌 IPC 通道速查

- 患者/统计：
  - `get-patients`，`get-patient-detail`，`get-statistics`，`get-extended-statistics`，`get-age-group-patients`
  - `import-excel`
- 家庭服务：
  - `family-service:get-records`，`family-service:get-overview-stats`
  - `family-service:get-statistics`，`family-service:get-stats-by-date-range`
  - `family-service:get-record-by-id`，`family-service:create/update/delete/batch-delete`

## 📥 Excel 导入（要点）

- `ExcelImporter.js`：表头诊断（`utils/ExcelDiagnostics`）→ 列映射 → 记录解析 → 调用 `DatabaseManager.insertPatientRecord`
- 优先级避免误匹配（如“母亲姓名”不会映射为患者姓名）
- 日期格式兼容：`YYYY.M.D`、`YYYY-M-D`、`YYYY年M月D日`
