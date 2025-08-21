# 统计分析功能技术文档

## 概述

统计分析功能是患儿入住信息管理系统v1.3.0的重要新增功能，提供全面的数据可视化和分析能力。

## 功能架构

### 数据层 (DatabaseManager.js)

#### 核心方法
- `getExtendedStatistics()` - 获取完整统计数据
- `getAgeGroupPatients(ageRange)` - 获取特定年龄段患者

#### 统计数据结构
```javascript
{
  totalPatients: Number,       // 患者总数
  totalRecords: Number,        // 入住记录总数
  averageAge: Number,          // 平均年龄
  multipleAdmissions: Number,  // 多次入住人数
  genderStats: Object,         // 性别分布
  ageDistribution: Array,      // 年龄分布详情
  locationStats: Array,        // 地区分布
  diseaseStats: Array,         // 疾病分布
  doctorStats: Array,          // 医生统计
  monthlyTrend: Array,         // 月度趋势
  ageSummary: Object          // 年龄分析摘要
}
```

### 前端层 (app.js)

#### 主要方法
- `loadStatisticsPage()` - 加载统计页面
- `createCharts(stats)` - 创建所有图表
- `createGenderChart()` - 性别分布饼图
- `createLocationChart()` - 地区分布柱状图
- `createDiseaseChart()` - 疾病分布柱状图
- `createDoctorChart()` - 医生统计饼图
- `createTrendChart()` - 趋势分析线图
- `updateStatCards()` - 更新统计卡片
- `updateAgeDistribution()` - 年龄分布横向图表

#### 交互功能
- `showAgeGroupModal(ageRange)` - 年龄组患者详情
- `navigateToPatientDetail(personId)` - 患者详情导航

### 样式层 (statistics.css)

#### 核心样式模块
- `.stats-grid` - 统计卡片网格布局
- `.stat-card` - 统计卡片样式（4种渐变色变体）
- `.charts-grid` - 图表容器网格
- `.chart-card` - 图表卡片样式
- `.age-group-card` - 可点击年龄组卡片
- `.age-detail-modal` - 年龄组详情模态框

## 图表配置

### Chart.js 图表类型

1. **性别分布** - Pie Chart
   - 颜色：蓝色系渐变
   - 显示百分比和人数

2. **地区分布** - Bar Chart
   - 颜色：绿色系渐变
   - 水平排列，按人数排序

3. **疾病分布** - Bar Chart
   - 颜色：紫色系渐变
   - 垂直排列，按频率排序

4. **医生统计** - Pie Chart
   - 颜色：多色彩虹系
   - 显示患者数量

5. **入住趋势** - Line Chart
   - 颜色：蓝色填充区域
   - 时间序列，最近12个月
   - 平滑曲线，交互式悬浮

### 年龄分布可视化

采用自定义水平条形图设计：
- 响应式宽度计算
- 渐变色区分年龄段
- 点击交互查看详情
- 患者示例显示（最多4个名字）

## 关键技术问题及解决方案

### 1. SQL查询歧义问题

**问题**：在`getAgeGroupPatients`中，子查询`WHERE cir.person_id = person_id`产生歧义，导致所有患者显示相同入住次数。

**解决方案**：
```sql
-- 修复前（有歧义）
WHERE cir.person_id = person_id

-- 修复后（明确引用）
WHERE cir.person_id = ac.person_id
```

### 2. 图表重复创建问题

**问题**：页面重复加载时Chart.js实例重复创建，造成内存泄漏。

**解决方案**：
```javascript
// 销毁现有实例
if (this.charts.chartName) {
    this.charts.chartName.destroy();
    this.charts.chartName = null;
}
```

### 3. 导航历史管理

**问题**：从年龄组模态框进入患者详情后，返回按钮无法回到正确位置。

**解决方案**：
```javascript
// 模态框上下文保存
this.setModalContext({
    type: 'ageGroup',
    ageRange: ageRange
});

// 智能返回逻辑
this.restoreModalContext();
```

### 4. Electron缓存权限问题

**问题**：Windows系统下Electron缓存权限错误。

**解决方案**：
```javascript
// 禁用缓存和沙盒
app.commandLine.appendSwitch('--disable-http-cache');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--no-sandbox');
```

## 性能优化

### 1. 数据加载优化
- 分批获取统计数据，减少并发查询压力
- 实现统计页面加载状态防重复调用
- 添加图表实例缓存机制

### 2. 图表渲染优化
- Chart.js 响应式配置
- 动画性能优化（duration: 1000-1500ms）
- 内存泄漏防护

### 3. 用户体验优化
- 加载状态显示
- 错误状态处理
- 空数据友好提示
- 深色主题适配

## 数据校验

### 统计数据一致性
- 年龄计算与年龄分布保持一致
- 患者总数在各模块间统一
- 百分比计算精度控制

### 异常处理
- 数据库连接异常
- Chart.js 创建失败
- DOM 元素缺失
- 数据格式错误

## 扩展性考虑

### 新增图表类型
1. 在`DatabaseManager.js`中添加数据查询方法
2. 在`app.js`中创建对应的`create*Chart()`方法
3. 在`statistics.css`中添加样式支持
4. 在`createCharts()`中调用新方法

### 新增统计维度
1. 扩展`getExtendedStatistics()`返回结构
2. 更新前端数据处理逻辑
3. 添加相应的UI组件

## 测试要点

### 功能测试
- [ ] 统计数据准确性验证
- [ ] 图表交互功能测试
- [ ] 年龄组患者列表功能
- [ ] 导航历史正确性

### 性能测试
- [ ] 大数据量加载性能
- [ ] 图表渲染性能
- [ ] 内存使用监控

### 兼容性测试
- [ ] 不同屏幕分辨率适配
- [ ] 深色主题显示效果
- [ ] Windows不同版本兼容性

## 已知限制

1. **趋势分析**：需要近期（12个月内）数据才能显示有意义的趋势
2. **图表性能**：数据量超过1000条时可能影响渲染性能
3. **交互限制**：年龄组点击仅支持预定义年龄段

## 维护建议

1. **定期监控**：图表渲染性能和内存使用
2. **数据验证**：定期检查统计数据准确性
3. **用户反馈**：收集统计功能使用体验反馈
4. **扩展规划**：根据需求规划新的统计维度

---

*文档更新时间：2025-08-21*
*版本：v1.3.0*