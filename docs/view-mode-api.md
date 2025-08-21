# 视图模式 API 文档

## 概述

视图模式系统为小家管理系统提供了灵活的数据展示方式，支持网格视图和列表视图的动态切换。

## API 接口

### PatientApp.setViewMode(mode)

设置当前视图模式并保存用户偏好。

#### 参数
- `mode` (String): 视图模式类型
  - `'grid'`: 网格视图模式
  - `'list'`: 列表视图模式（默认）

#### 返回值
- `void`

#### 示例
```javascript
// 设置为网格视图
app.setViewMode('grid');

// 设置为列表视图
app.setViewMode('list');
```

### PatientApp.currentViewMode

当前激活的视图模式。

#### 类型
- `String`: `'grid'` | `'list'`

#### 示例
```javascript
console.log(app.currentViewMode); // 'list'
```

### PatientApp.updateViewButtons()

更新视图切换按钮的激活状态。

#### 参数
- 无

#### 返回值
- `void`

#### 内部调用
此方法会在 `setViewMode()` 内部自动调用。

### PatientApp.applyViewMode()

将当前视图模式应用到 DOM 元素。

#### 参数
- 无

#### 返回值
- `void`

#### 功能
- 更新患者网格容器的 CSS 类
- 为所有患者卡片添加相应的模式类
- 应用对应的布局样式

## CSS 类参考

### 容器类

#### `.patient-grid-view`
网格视图容器样式

```css
.patient-grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}
```

#### `.patient-list-view`
列表视图容器样式

```css
.patient-list-view {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

### 卡片类

#### `.patient-card.list-mode`
列表模式下的患者卡片样式

- 紧凑的垂直布局
- 优化的内边距
- 横向医疗信息排列

#### `.patient-card.grid-mode`
网格模式下的患者卡片样式

- 标准的卡片布局
- 垂直信息排列
- 更多的视觉空间

## 事件处理

### 视图切换按钮事件

```javascript
// 网格视图按钮
this.elements.gridViewBtn.addEventListener('click', () => this.setViewMode('grid'));

// 列表视图按钮
this.elements.listViewBtn.addEventListener('click', () => this.setViewMode('list'));
```

### HTML 结构

```html
<div class="flex bg-gray-100 rounded-lg p-1">
  <button id="gridViewBtn" class="px-3 py-1.5 text-sm font-medium" title="网格视图">
    <!-- 网格图标 -->
  </button>
  <button id="listViewBtn" class="px-3 py-1.5 text-sm font-medium" title="列表视图">
    <!-- 列表图标 -->
  </button>
</div>
```

## 本地存储

### 存储键
- `app-view-mode`: 存储用户选择的视图模式

### 默认值
- 首次访问默认为 `'list'` 模式

### 持久化
```javascript
// 保存
localStorage.setItem('app-view-mode', mode);

// 读取
const savedViewMode = localStorage.getItem('app-view-mode') || 'list';
```

## 响应式行为

### 移动设备 (< 768px)
- 网格视图自动变为单列布局
- 列表视图保持紧凑样式
- 触摸友好的交互

### 平板设备 (768px - 1024px)
- 网格视图显示 2 列
- 列表视图保持单列

### 桌面设备 (> 1024px)
- 网格视图显示 3-4 列
- 列表视图充分利用水平空间

## 性能考虑

### DOM 操作优化
- 批量应用 CSS 类更改
- 避免重复的样式计算
- 使用 `requestAnimationFrame` 进行视图切换

### 内存管理
- 视图模式状态存储在内存中
- 仅在必要时更新 DOM
- 事件监听器在组件销毁时清理

## 调试指南

### 常见问题

#### 1. 视图模式不切换
检查按钮事件是否正确绑定：
```javascript
console.log('Grid button:', this.elements.gridViewBtn);
console.log('List button:', this.elements.listViewBtn);
```

#### 2. 样式不应用
验证 CSS 类是否正确添加：
```javascript
const cards = document.querySelectorAll('.patient-card');
cards.forEach(card => console.log(card.className));
```

#### 3. 持久化失败
检查本地存储权限：
```javascript
try {
  localStorage.setItem('test', 'value');
  console.log('LocalStorage available');
} catch (e) {
  console.error('LocalStorage not available:', e);
}
```

### 调试工具

#### 控制台命令
```javascript
// 强制设置视图模式
app.setViewMode('grid');

// 检查当前状态
console.log('Current view mode:', app.currentViewMode);

// 手动重新应用样式
app.applyViewMode();
```

## 扩展建议

### 新增视图模式
1. 扩展 `setViewMode()` 方法支持新模式
2. 添加对应的 CSS 类
3. 更新按钮状态逻辑
4. 添加相应的响应式规则

### 自定义配置
```javascript
// 扩展配置选项
const viewModeConfig = {
  grid: {
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    gap: { sm: '1rem', md: '1.5rem', lg: '2rem' }
  },
  list: {
    spacing: '0.75rem',
    compact: true
  }
};
```

---

*API 文档版本: 1.0.0*
*最后更新: 2025年1月21日*