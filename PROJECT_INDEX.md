# 患儿入住信息管理系统 - 项目文档索引

## 📋 项目概览

**项目名称**: 患儿入住信息管理系统 (Patient Check-in Manager)  
**版本**: 1.0.0  
**技术栈**: Electron + SQLite3 + JavaScript + HTML/CSS  
**描述**: 基于 Electron 的桌面应用程序，用于管理患儿入住信息和家庭服务数据

## 🏗️ 项目架构

### 核心层次结构
```
src/
├── main.js                    # Electron 主进程入口
├── preload.js                 # 预加载脚本
├── database/                  # 数据库层
│   └── DatabaseManager.js     # 数据库管理器
├── services/                  # 业务服务层
│   ├── FamilyServiceManager.js    # 家庭服务管理
│   ├── FamilyServiceImporter.js   # 数据导入服务
│   └── ExcelImporter.js           # Excel导入工具
├── config/                    # 配置文件
│   ├── resources.js           # 资源适配器
│   ├── columns.js             # 表格列配置
│   └── filters.js             # 筛选器配置
├── utils/                     # 工具类
│   ├── ExcelDiagnostics.js    # Excel诊断工具
│   └── DataFixer.js           # 数据修复工具
├── viewmodels/               # 视图模型
│   └── FamilyServiceViewModel.js  # 家庭服务视图模型
└── renderer/                 # 渲染进程
    ├── index.html            # 主界面
    ├── family-service.html   # 家庭服务页面
    └── js/
        ├── app.js            # 主应用逻辑
        └── family-service-app.js  # 家庭服务应用
```

## 🔧 核心模块

### 1. 数据库层 (`src/database/`)

#### DatabaseManager.js
- **功能**: SQLite 数据库操作的核心管理类
- **主要方法**:
  - `initialize()` - 数据库初始化
  - `createTables()` - 创建表结构
  - `getPatients()` - 获取患儿列表
  - `getStatistics()` - 获取统计数据
  - `getFamilyServiceStatistics()` - 家庭服务统计

### 2. 业务服务层 (`src/services/`)

#### FamilyServiceManager.js
- **功能**: 家庭服务数据的CRUD操作、统计分析和导出功能
- **主要方法**:
  - `getRecords(filters, pagination)` - 获取记录列表
  - `getOverviewStats()` - 获取概览统计
  - `createRecord(recordData)` - 创建新记录
  - `updateRecord(id, updateData)` - 更新记录
  - `deleteRecord(id)` - 删除记录
  - `importFromExcel(filePath)` - 从Excel导入
  - `exportToExcel(outputPath)` - 导出到Excel

#### FamilyServiceImporter.js
- **功能**: Excel数据导入和导出处理
- **特性**: 支持多种Excel格式，数据验证和错误处理

#### ExcelImporter.js
- **功能**: 通用Excel导入工具
- **特性**: 自动检测Excel结构，字段映射

### 3. 前端层 (`src/renderer/`)

#### app.js
- **功能**: 主应用程序逻辑和界面控制
- **主要功能**:
  - 页面导航管理
  - 数据展示和交互
  - 统计图表生成
  - 主题切换功能

#### index.html
- **功能**: 主界面布局
- **特性**: 响应式设计，多页面应用，统计分析中心

## 📊 功能模块

### 1. 患儿信息管理
- 患儿档案查看和搜索
- 入住记录管理
- 详细信息展示
- 数据导入导出

### 2. 家庭服务管理
- 服务记录列表
- 筛选和搜索
- 统计分析
- Excel导入导出

### 3. 统计分析
- **入住信息统计**: 年龄分布、性别比例、地区分布
- **家庭服务统计**: 月度统计、年度统计、时间范围分析
- **数据可视化**: Chart.js图表展示

### 4. 数据管理
- Excel数据导入
- 数据验证和清理
- 错误诊断和修复
- 数据导出功能

## 🛠️ 技术规范

### 数据库结构
- **persons表**: 患儿基本信息
- **family_service_records表**: 家庭服务记录

### API接口
- IPC通信机制 (Electron)
- 异步数据操作
- 错误处理和日志记录

### 前端技术
- **CSS框架**: Tailwind CSS
- **图表库**: Chart.js
- **响应式设计**: 移动端适配
- **主题系统**: 多主题支持

## 📝 配置文件

### package.json
- 项目依赖管理
- 构建脚本配置
- Electron应用配置

### 构建配置
- **开发模式**: `npm run dev`
- **生产构建**: `npm run build`
- **Windows打包**: `npm run build-win`

## 🔒 安全特性

- SQL注入防护
- 数据验证和清理
- 文件路径安全检查
- 错误信息保护

## 📈 性能优化

- 数据库索引优化
- 分页加载机制
- 图表性能优化
- 内存管理

## 🧪 测试

- **测试框架**: Jest
- **运行命令**: `npm test`
- **覆盖范围**: 核心业务逻辑测试

## 📚 文档结构

- `PROJECT_INDEX.md` - 项目总览索引 (本文档)
- `API_DOCUMENTATION.md` - API接口文档
- `DEVELOPMENT_GUIDE.md` - 开发指南
- `DEPLOYMENT_GUIDE.md` - 部署指南

## 🚀 快速开始

1. **安装依赖**: `npm install`
2. **启动开发**: `npm start`
3. **构建应用**: `npm run build`

## 📞 支持

- **技术栈**: Electron 28.0.0, SQLite3 5.1.6, XLSX 0.18.5
- **平台支持**: Windows, macOS, Linux
- **浏览器兼容**: Chromium 内核

---

**最后更新**: 2025-08-22  
**维护者**: 开发团队