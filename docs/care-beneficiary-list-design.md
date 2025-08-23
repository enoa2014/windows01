# 关怀服务受益列表页设计规范

## 📋 设计概览

**页面名称**: 关怀服务受益列表页  
**设计版本**: v1.0  
**设计日期**: 2025-08-23  
**参考页面**: 入住信息列表页、家庭信息列表页  
**数据来源**: 2024.xls - Sheet1（各个活动受益人数及人次统计表）

---

## 🎯 设计目标

### 核心用户需求
- **受益统计可视化**: 将 Excel 中的关怀服务受益数据以直观的列表形式展示。
- **活动维度管理**: 按年份、月份和服务中心维度查看关怀服务活动。
- **受益群体分析**: 展示成人、儿童、志愿者等不同群体的受益人数与人次。
- **交互一致性**: 与现有入住信息列表页、家庭信息列表页在交互模式上保持一致。

### 设计原则
- **数据驱动**: 基于 Excel 实际数据结构设计界面与模型。
- **一致性**: 复用现有列表页的主题、布局与组件。
- **可用性**: 支持筛选、搜索、排序与导出。
- **响应式**: 适配不同分辨率的桌面环境。

---

## 📊 数据结构分析

### Excel 数据映射
依据 `2024.xls` 中 `Sheet1` 的表头，主要字段包括：

- 序号、年份、月份、服务中心、项目领域、活动类型、活动日期、活动名称、受益对象、统计人、统计日期  
- 成人受益人数统计（男性、女性、合计）  
- 儿童受益人数统计（男童、女童、合计）  
- 总合计  
- 志愿者服务人数及时长统计（儿童、家长、大学生、老师、社会人士，各含人数和小时，以及合计）  
- 活动受益人次统计（成人、儿童、总合计）  
- 备注

### 数据实体设计
```javascript
const CareBeneficiaryRecord = {
  id: Number,                 // 自增ID
  sequenceNumber: String,     // 序号
  year: Number,               // 年份
  month: Number,              // 月份
  serviceCenter: String,      // 服务中心
  projectDomain: String,      // 项目领域
  activityType: String,       // 活动类型
  activityDate: Date,         // 活动日期
  activityName: String,       // 活动名称
  beneficiaryGroup: String,   // 受益对象
  reporter: String,           // 统计人
  reportDate: Date,           // 统计日期
  adultMale: Number,          // 成人男性受益人数
  adultFemale: Number,        // 成人女性受益人数
  adultTotal: Number,         // 成人合计
  childMale: Number,          // 男童受益人数
  childFemale: Number,        // 女童受益人数
  childTotal: Number,         // 儿童合计
  totalBeneficiaries: Number, // 总合计
  volunteerChild: { count: Number, hours: Number },
  volunteerParent: { count: Number, hours: Number },
  volunteerStudent: { count: Number, hours: Number },
  volunteerTeacher: { count: Number, hours: Number },
  volunteerSocial: { count: Number, hours: Number },
  volunteerTotal: { count: Number, hours: Number },
  benefitAdultTimes: Number,   // 成人受益人次
  benefitChildTimes: Number,   // 儿童受益人次
  benefitTotalTimes: Number,   // 总受益人次
  notes: String,               // 备注
  createdAt: Date,
  updatedAt: Date
};
```

---

## 🎨 界面设计规范

### 页面布局结构
```
┌─────────────────────────────────────────────────────────┐
│                      顶部导航栏                         │
├─────────────────────────────────────────────────────────┤
│                    数据总览卡片区                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │总记录数 │  │服务中心 │  │总受益人 │  │志愿者   │   │
│  │   82    │  │   5     │  │  356    │  │  124    │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
├─────────────────────────────────────────────────────────┤
│                    筛选工具栏                           │
│  [搜索框] [年份筛选] [月份筛选] [服务中心] [导出]        │
├─────────────────────────────────────────────────────────┤
│                     受益记录列表                        │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 2024-06 | 心理支持 | 绿洲中心 | 成人34 | 儿童12 ... │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 2024-05 | 陪伴活动 | 星光站点 | 成人28 | 儿童20 ... │ │
│  └───────────────────────────────────────────────────┘ │
│  ...                                                   │
└─────────────────────────────────────────────────────────┘
```

### 设计系统继承

#### 主题系统
- 继承现有主题：薄荷翡翠、星云薄暮、活力阳光、蔷薇甜莓。
- 使用一致的 CSS 变量体系。
- 颜色规范与入住信息列表页保持一致。

#### 字体系统
- 主字体：Inter 系列。
- 层级：标题(text-2xl)、副标题(text-lg)、正文(text-sm)、辅助(text-xs)。

#### 组件规范
- 卡片：圆角(rounded-2xl)、边框(border)、阴影(shadow-sm)。
- 按钮：圆角(rounded-xl)、悬停与焦点状态。
- 输入框：统一边框和焦点样式。

---

## 🧩 组件设计详述

### 1. 页面头部 (Header)
```html
<header class="sticky top-0 z-30 backdrop-blur bg-[var(--bg-secondary)]/75 border-b border-[var(--border-primary)]/70">
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center gap-3">
    <button id="backBtn" class="..." aria-label="返回主页">←</button>
    <h1 class="text-lg font-bold text-[var(--brand-secondary)]">关怀服务受益统计</h1>
    <div class="ml-auto flex items-center gap-2">
      <div class="hidden md:flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span class="kbd">/</span><span>搜索</span>
        <span class="kbd">F</span><span>筛选</span>
        <span class="kbd">E</span><span>导出</span>
      </div>
    </div>
  </div>
</header>
```

### 2. API 接口设计
```javascript
class CareBeneficiaryAPI {
  async getRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/api/care-beneficiaries?${queryString}`);
    return response.json();
  }

  async createRecord(record) {
    const response = await fetch('/api/care-beneficiaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return response.json();
  }

  async updateRecord(id, updates) {
    const response = await fetch(`/api/care-beneficiaries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  async deleteRecord(id) {
    const response = await fetch(`/api/care-beneficiaries/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  }
}
```

---

## 📋 开发检查清单

### 设计完成度检查
- [ ] 页面布局设计完成
- [ ] 组件设计规范完成
- [ ] 响应式设计规范完成
- [ ] 可访问性设计完成
- [ ] 交互设计规范完成
- [ ] 数据处理逻辑设计完成

### 技术规范检查
- [ ] CSS 样式规范定义完成
- [ ] JavaScript 功能规范完成
- [ ] API 接口设计完成
- [ ] 数据模型设计完成
- [ ] 性能优化策略完成
- [ ] 错误处理策略完成

### 用户体验检查
- [ ] 加载状态设计完成
- [ ] 空状态设计完成
- [ ] 错误状态设计完成
- [ ] 成功反馈设计完成
- [ ] 快捷键支持完成
- [ ] 移动端体验优化完成

---

## 📈 后续迭代计划

### V1.1 计划功能
- 受益数据图表化展示
- 高级筛选条件（项目领域、志愿者类别）
- 批量编辑与导出模板
- 自定义受益指标

### V1.2 计划功能
- 离线数据同步
- 受益分析报告自动生成
- 数据备份与恢复
- 多语言支持

### V2.0 计划功能
- 实时数据更新
- 协作编辑
- 移动端适配
- API 开放平台

---

*设计文档版本：v1.0*  
*最后更新时间：2025-08-23*  
*设计师：Claude AI*  
*审核状态：待审核*
