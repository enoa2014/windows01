# 患儿入住信息管理系统 - 设计规范

## 📋 目录
- [概述](#概述)
- [配色系统](#配色系统)
- [字体系统](#字体系统)
- [间距系统](#间距系统)
- [组件库](#组件库)
- [交互设计](#交互设计)
- [响应式设计](#响应式设计)
- [可访问性](#可访问性)

---

## 概述

患儿入住信息管理系统采用现代化、医疗友好的设计语言，致力于为医护人员提供简洁高效的数据管理体验。

### 设计原则
- **简洁性**: 去除不必要的视觉干扰，专注核心功能
- **可读性**: 确保在各种光照条件下都能清晰阅读
- **专业性**: 体现医疗系统的严谨性和可信度
- **效率性**: 减少操作步骤，提高工作效率

---

## 配色系统

### 主题色彩

#### 翡翠主题 (默认)
```css
:root {
  /* 背景色阶 */
  --bg-primary: #f8fafc;    /* 主背景 - 轻柔灰白 */
  --bg-secondary: #ffffff;   /* 卡片背景 - 纯白 */
  --bg-tertiary: #f1f5f9;   /* 悬停背景 - 浅灰 */
  
  /* 文字色阶 */
  --text-primary: #334155;   /* 主要文字 - 深灰蓝 */
  --text-secondary: #64748b; /* 次要文字 - 中灰蓝 */
  --text-muted: #94a3b8;     /* 辅助文字 - 浅灰蓝 */
  
  /* 边框色阶 */
  --border-primary: #e2e8f0; /* 主要边框 - 浅灰 */
  --border-secondary: #f1f5f9; /* 次要边框 - 极浅灰 */
  
  /* 品牌色阶 */
  --brand-primary: #0d9488;   /* 主品牌色 - 翡翠绿 */
  --brand-secondary: #0f766e; /* 次品牌色 - 深翡翠 */
  --brand-text: #ffffff;      /* 品牌文字 - 白色 */
  
  /* 标签系统 */
  --brand-tag-bg: #f0fdfa;    /* 标签背景 - 极浅翡翠 */
  --brand-tag-text: #14532d;  /* 标签文字 - 深绿 */
  
  /* 交互色彩 */
  --ring-color: #34d399;      /* 聚焦环 - 亮翡翠 */
  --selection-bg: #a7f3d0;    /* 选中背景 - 浅翡翠 */
}
```

#### 极光主题
```css
[data-theme="aurora"] {
  --brand-primary: #BCB6FF;   /* 柔和紫色 */
  --brand-secondary: #B8E1FF; /* 天空蓝 */
  --brand-text: #1e293b;      /* 深色文字 */
  --brand-tag-bg: #eef2ff;    /* 浅紫背景 */
  --brand-tag-text: #3730a3;  /* 深紫文字 */
  --ring-color: #a5b4fc;      /* 紫色聚焦环 */
}
```

#### 日出主题
```css
[data-theme="sunrise"] {
  --brand-primary: #E8AA14;   /* 金黄色 */
  --brand-secondary: #FF5714; /* 橙红色 */
  --brand-text: #ffffff;      /* 白色文字 */
  --brand-tag-bg: #fffbeb;    /* 浅黄背景 */
  --brand-tag-text: #b45309;  /* 深橙文字 */
  --ring-color: #f59e0b;      /* 橙色聚焦环 */
}
```

#### 莓果主题
```css
[data-theme="berry"] {
  --brand-primary: #C52184;   /* 深粉色 */
  --brand-secondary: #334139; /* 深灰绿 */
  --brand-text: #ffffff;      /* 白色文字 */
  --brand-tag-bg: #fce7f3;    /* 浅粉背景 */
  --brand-tag-text: #9d174d;  /* 深粉文字 */
  --ring-color: #f472b6;      /* 粉色聚焦环 */
}
```

### 语义化色彩

```css
/* 状态颜色 */
--success: #10b981;    /* 成功 - 绿色 */
--warning: #f59e0b;    /* 警告 - 橙色 */
--error: #ef4444;      /* 错误 - 红色 */
--info: #3b82f6;       /* 信息 - 蓝色 */

/* 状态背景 */
--success-bg: #ecfdf5; /* 成功背景 */
--warning-bg: #fffbeb; /* 警告背景 */
--error-bg: #fef2f2;   /* 错误背景 */
--info-bg: #eff6ff;    /* 信息背景 */
```

---

## 字体系统

### 字体族
```css
font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
```

### 字重规范
- **Regular (400)**: 常规文本
- **Medium (500)**: 次要标题、标签
- **SemiBold (600)**: 重要信息、按钮
- **Bold (700)**: 主要标题
- **ExtraBold (800)**: 数据展示、强调

### 字号系统
- **12px (xs)**: 页脚、辅助信息
- **14px (sm)**: 正文、表单
- **16px (base)**: 标准文本
- **18px (lg)**: 次级标题
- **20px (xl)**: 卡片标题
- **24px (2xl)**: 页面标题
- **30px (3xl)**: 数据显示

### 行高规范
- **紧密 (1.25)**: 标题、数据
- **标准 (1.5)**: 正文阅读
- **宽松 (1.625)**: 长文本

---

## 间距系统

基于 4px 网格系统，提供一致的空间节奏。

```css
/* 间距标准 */
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
--spacing-20: 5rem;    /* 80px */
```

### 内边距规范
- **卡片内边距**: 16px (mobile) / 20px (desktop)
- **按钮内边距**: 8px 12px (small) / 10px 16px (medium) / 12px 20px (large)
- **表单内边距**: 10px 12px

### 外边距规范
- **组件间距**: 16px (mobile) / 24px (desktop)
- **区块间距**: 24px (mobile) / 32px (desktop)
- **页面边距**: 16px (mobile) / 24px (desktop)

---

## 组件库

### 按钮组件

#### 主要按钮
```css
.btn-primary {
  background: linear-gradient(to right, var(--brand-primary), var(--brand-secondary));
  color: var(--brand-text);
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
}
```

#### 次要按钮
```css
.btn-secondary {
  background: transparent;
  color: var(--brand-primary);
  border: 1px solid var(--border-primary);
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--brand-primary);
}
```

### 卡片组件

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  background: linear-gradient(to right, var(--brand-primary), var(--brand-secondary));
  color: var(--brand-text);
  padding: 16px 20px;
  border-radius: 16px 16px 0 0;
  font-weight: 600;
}
```

### 表单组件

```css
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px var(--ring-color);
}

.form-input::placeholder {
  color: var(--text-muted);
}
```

### 状态指示器

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-success {
  background: var(--success-bg);
  color: var(--success);
}

.status-warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.status-error {
  background: var(--error-bg);
  color: var(--error);
}
```

---

## 交互设计

### 动画规范

```css
/* 基础过渡 */
.transition-base {
  transition: all 0.2s ease;
}

.transition-slow {
  transition: all 0.3s ease;
}

/* 关键帧动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 悬停效果 */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.hover-scale:hover {
  transform: scale(1.02);
}
```

### 聚焦状态

```css
.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring-color);
}

.focus-ring:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
```

### 加载状态

```css
.loading {
  opacity: 0.6;
  pointer-events: none;
  position: relative;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

## 响应式设计

### 断点系统

```css
/* 移动设备优先 */
.container {
  width: 100%;
  padding: 0 16px;
}

/* 平板设备 (768px+) */
@media (min-width: 768px) {
  .container {
    padding: 0 24px;
  }
}

/* 桌面设备 (1024px+) */
@media (min-width: 1024px) {
  .container {
    max-width: 1280px;
    margin: 0 auto;
  }
}

/* 大屏设备 (1536px+) */
@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}
```

### 网格系统

```css
.grid {
  display: grid;
  gap: 16px;
}

/* 移动端: 单列 */
.grid-cols-1 {
  grid-template-columns: 1fr;
}

/* 平板: 双列 */
@media (min-width: 768px) {
  .grid-cols-md-2 {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}

/* 桌面: 三列 */
@media (min-width: 1024px) {
  .grid-cols-lg-3 {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
}
```

---

## 可访问性

### 颜色对比度
所有文字与背景的对比度符合 WCAG 2.1 AA 标准：
- 正文文字对比度 ≥ 4.5:1
- 大字体对比度 ≥ 3:1
- 非文字元素对比度 ≥ 3:1

### 键盘导航
```css
/* 跳转链接 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 6px;
}

/* 聚焦指示器 */
*:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
```

### 屏幕阅读器支持
- 使用语义化 HTML 标签
- 提供 `aria-label` 和 `aria-describedby`
- 实现 `role` 属性
- 使用 `sr-only` 类提供额外上下文

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 减少动效支持
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 深色模式支持

为未来扩展预留深色模式支持：

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --border-primary: #334155;
    --border-secondary: #475569;
  }
}
```

---

## 设计令牌总结

| 类别 | 用途 | 变量 | 值 |
|------|------|------|-----|
| 间距 | 基础单位 | --spacing-base | 4px |
| 圆角 | 小组件 | --radius-sm | 6px |
| 圆角 | 标准 | --radius-base | 12px |
| 圆角 | 大组件 | --radius-lg | 16px |
| 阴影 | 轻微 | --shadow-sm | 0 1px 3px rgba(0,0,0,0.05) |
| 阴影 | 标准 | --shadow-base | 0 4px 12px rgba(0,0,0,0.1) |
| 阴影 | 强调 | --shadow-lg | 0 8px 24px rgba(0,0,0,0.15) |

---

此设计规范为患儿入住信息管理系统提供了统一的视觉语言和交互标准，确保在不同设备和使用场景下都能提供一致、专业的用户体验。