# 患儿入住信息管理系统 - 项目文档索引

> **版本**: 1.0.0  
> **最后更新**: 2025-08-22  
> **类型**: Electron桌面应用程序

## 📋 项目概览

**患儿入住信息管理系统**是一个基于Electron开发的桌面应用程序，专为医疗机构设计，用于管理患儿入住信息、家庭服务记录和统计分析。

### 🎯 核心功能
- 📊 **入住信息管理** - 患儿档案、入住记录、医疗信息
- 👨‍👩‍👧‍👦 **家庭服务管理** - 服务记录、月度统计、分析报表
- 📈 **数据统计分析** - 年龄分布、性别比例、趋势分析
- 📁 **Excel数据导入** - 批量数据导入和处理

### 🛠 技术栈
- **框架**: Electron 28.0.0
- **数据库**: SQLite3
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **UI框架**: Tailwind CSS
- **图表**: Chart.js
- **构建工具**: Electron Builder

---

## 📚 文档导航

### 📖 用户文档
| 文档 | 描述 | 状态 |
|------|------|------|
| [README.md](./README.md) | 项目介绍和快速开始 | ✅ 完整 |
| [用户指南](#用户指南) | 功能使用说明 | 🚧 待完善 |
| [常见问题](#常见问题) | FAQ和故障排除 | 📝 待创建 |

### 🔧 技术文档
| 文档 | 描述 | 状态 |
|------|------|------|
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | API接口文档 | ✅ 完整 |
| [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | 开发指南 | ✅ 完整 |
| [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) | 数据库设计 | ✅ 完整 |
| [UI_OPTIMIZATION_WORKFLOW.md](./UI_OPTIMIZATION_WORKFLOW.md) | UI优化流程 | ✅ 完整 |

### 📝 项目记录
| 文档 | 描述 | 状态 |
|------|------|------|
| [CHANGELOG.md](./CHANGELOG.md) | 版本更新日志 | ✅ 完整 |
| [AGENTS.md](./AGENTS.md) | 智能代理配置 | ✅ 完整 |
| [项目演进记录](#项目演进记录) | 重要功能开发历程 | ✅ 完整 |

---

## 🏗 项目架构

### 📁 目录结构
```
患儿入住信息管理系统/
├── 📄 package.json              # 项目配置和依赖
├── 📄 main.js                   # Electron主进程
├── 📁 src/                      # 源代码目录
│   ├── 📁 database/            # 数据库相关
│   │   └── DatabaseManager.js  # 数据库管理器
│   ├── 📁 services/            # 业务服务层
│   │   ├── ExcelImporter.js    # Excel导入服务
│   │   └── FamilyServiceManager.js # 家庭服务管理
│   ├── 📁 renderer/            # 渲染进程（前端）
│   │   ├── index.html          # 主页面
│   │   ├── 📁 js/              # JavaScript文件
│   │   └── 📁 styles/          # 样式文件
│   └── 📁 utils/               # 工具类
├── 📁 docs/                    # 详细文档
└── 📁 database/                # 数据库相关文件
```

### 🔄 应用架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   主进程 (Main)   │    │  渲染进程 (Renderer) │    │   数据库 (SQLite) │
│                │    │                │    │                │
│ • 窗口管理       │    │ • 用户界面       │    │ • 患儿信息       │
│ • IPC处理       │◄──►│ • 事件处理       │    │ • 入住记录       │
│ • 数据库操作     │    │ • 数据展示       │    │ • 家庭服务       │
│ • 文件系统       │    │ • 用户交互       │    │ • 统计数据       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚀 快速开始

### 📋 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Windows 10/11 (推荐)

### ⚡ 安装运行
```bash
# 1. 克隆项目
git clone <repository-url>

# 2. 安装依赖
npm install

# 3. 启动开发环境
npm run dev

# 4. 构建生产版本
npm run build-win
```

---

## 📊 功能模块详解

### 🏥 入住信息管理
| 功能 | 描述 | 文件位置 |
|------|------|----------|
| 患儿列表 | 显示所有患儿信息 | `src/renderer/js/patients-table.js` |
| 患儿详情 | 查看详细医疗信息 | `src/renderer/js/app.js:452` |
| 数据导入 | Excel批量导入 | `src/services/ExcelImporter.js` |
| 统计分析 | 年龄、性别统计 | `src/renderer/js/app.js:1800+` |

### 👨‍👩‍👧‍👦 家庭服务管理
| 功能 | 描述 | 文件位置 |
|------|------|----------|
| 服务记录 | 家庭服务数据管理 | `src/services/FamilyServiceManager.js` |
| 月度统计 | 按月统计分析 | `src/viewmodels/FamilyServiceViewModel.js` |
| 数据导出 | Excel格式导出 | `src/services/FamilyServiceManager.js:200+` |

### 📈 数据分析
| 功能 | 描述 | 支持的图表类型 |
|------|------|----------------|
| 年龄分布 | 患儿年龄统计 | 柱状图、饼图 |
| 性别比例 | 男女患儿比例 | 环形图 |
| 入住趋势 | 时间序列分析 | 折线图 |
| 地区分布 | 患儿来源统计 | 条形图 |

---

## 🗄 数据库设计

### 📋 核心数据表
| 表名 | 用途 | 重要字段 |
|------|------|----------|
| `persons` | 患儿基本信息 | id, name, id_card |
| `patient_profiles` | 患儿档案 | person_id, gender, birth_date, hometown |
| `medical_info` | 医疗信息 | person_id, diagnosis, doctor_name |
| `check_in_records` | 入住记录 | person_id, check_in_date, attendees |
| `family_service_records` | 家庭服务记录 | year_month, family_count, total_service_count |

### 🔗 关系图
```
persons (1) ──┬── (N) patient_profiles
              ├── (N) medical_info  
              └── (N) check_in_records

family_service_records (独立表)
```

---

## 🛠 开发指南

### 🔧 开发环境设置
1. **IDE推荐**: Visual Studio Code
2. **必备插件**: 
   - JavaScript (ES6)
   - HTML CSS Support
   - SQLite Viewer
3. **调试工具**: Electron DevTools

### 📝 代码规范
- **JavaScript**: ES6+ 语法
- **CSS**: 使用 Tailwind CSS 类名
- **命名**: 驼峰命名法 (camelCase)
- **文件**: 小写字母 + 连字符 (kebab-case)

### 🧪 测试策略
```bash
# 运行所有测试
npm test

# 数据库测试
node test-database-operations.js

# 前端功能测试
node test-frontend-integration.js
```

---

## 📈 性能优化

### ⚡ 已实现优化
- ✅ **数据库索引**: 关键字段添加索引
- ✅ **分页加载**: 大数据集分页显示
- ✅ **懒加载**: 按需加载组件
- ✅ **缓存策略**: 统计数据缓存

### 🔄 持续优化
- 🚧 **虚拟滚动**: 大列表性能优化
- 🚧 **增量更新**: 数据变更检测
- 📝 **内存管理**: 大文件处理优化

---

## 🔒 安全考虑

### 🛡 数据安全
- ✅ SQL注入防护
- ✅ 文件路径验证
- ✅ 输入数据清理
- ✅ 本地数据加密

### 🔐 访问控制
- 📝 用户权限系统 (计划中)
- 📝 操作日志记录 (计划中)
- 📝 数据备份策略 (计划中)

---

## 📞 支持与贡献

### 🐛 问题报告
如遇到问题，请提供以下信息：
1. 操作系统版本
2. 应用程序版本
3. 错误复现步骤
4. 错误截图或日志

### 🤝 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

### 📧 联系方式
- **项目维护者**: [您的姓名]
- **邮箱**: [your-email@example.com]
- **技术支持**: [support@example.com]

---

## 📅 项目演进记录

### 🎯 重要里程碑

#### v1.0.0 - 基础版本 (2025-08-22)
- ✅ **核心功能**: 入住信息管理和家庭服务管理
- ✅ **数据统计**: 基础统计图表
- ✅ **Excel导入**: 批量数据导入功能
- ✅ **用户界面**: 现代化医疗主题UI

#### 近期重要更新
- 🔧 **患者卡片跳转修复** (2025-08-22): 解决了ID字段映射兼容性问题
- 🎨 **主页UI优化** (2025-08-22): 核心功能并排显示，改善用户体验
- ⚡ **初始化优化** (2025-08-22): 解决应用启动竞态条件

### 📋 功能开发历程

#### 🏥 患儿管理模块
- ✅ 基础CRUD操作
- ✅ 高级搜索和筛选
- ✅ Excel数据导入
- ✅ 响应式卡片布局
- ✅ 详情页面优化

#### 👨‍👩‍👧‍👦 家庭服务模块  
- ✅ 服务记录管理
- ✅ 月度统计分析
- ✅ 数据导出功能
- ✅ 可视化图表

#### 📊 统计分析模块
- ✅ 实时数据统计
- ✅ 多维度分析
- ✅ 交互式图表
- ✅ 数据导出功能

---

## 🗂 附录

### 📚 相关文档链接
- [Electron官方文档](https://www.electronjs.org/docs)
- [SQLite文档](https://www.sqlite.org/docs.html)
- [Chart.js文档](https://www.chartjs.org/docs/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)

### 🛠 开发工具推荐
- [DB Browser for SQLite](https://sqlitebrowser.org/) - 数据库可视化工具
- [Postman](https://www.postman.com/) - API测试工具
- [Git Extensions](https://gitextensions.github.io/) - Git图形界面

---

*本文档会根据项目发展持续更新。如有疑问或建议，欢迎提交Issue或PR。*