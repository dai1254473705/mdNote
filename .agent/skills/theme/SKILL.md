---
name: 主题管理
description: 添加新 Markdown 预览主题或调整现有主题的指南。
---

# 主题管理技能 (Theme Management Skill)

本技能将指导您完成添加新的 Markdown 预览主题或修改现有主题的流程。

## 1. CSS 定义

所有 Markdown 主题样式都定义在 `src/styles/markdown-themes.css` 文件中。

### 命名规范
主题使用特定的类名约定：`.md-style-{themeName}`。
示例：如果主题名为 "ocean"，则类名应为 `.md-style-ocean`。

### 结构模板
请在文件末尾添加您的新主题 CSS。确保覆盖标准的 Markdown 元素。

```css
/* ==========================================================================
   主题: {主题名称} ({描述})
   ========================================================================== */
.md-style-{themeId} {
  font-family: ...; /* 定义基础字体 */
  color: var(--text-app); /* 使用 CSS 变量以自适应亮/暗模式 */
  line-height: 1.6;
}

/* 标题 */
.md-style-{themeId} h1,
.md-style-{themeId} h2,
.md-style-{themeId} h3 {
  /* ... */
}

/* 引用块 */
.md-style-{themeId} blockquote {
  /* ... */
}

/* 代码块 */
.md-style-{themeId} pre {
  /* ... */
}

.md-style-{themeId} code {
  /* ... */
}

/* 链接 */
.md-style-{themeId} a {
  /* ... */
}

/* 暗色模式支持 (可选但推荐) */
@media (prefers-color-scheme: dark) {
  .md-style-{themeId} {
    /* 如果默认颜色在暗色模式下效果不佳，请在此处调整 */
  }
}
```

## 2. 注册主题

为了让用户能在界面上选择该主题，您需要将其添加到 `Toolbar` 组件中。

目标文件：`src/components/Toolbar.tsx`

找到 `Markdown Theme Selection` (Markdown 主题选择) 区域（可以搜索 "Markdown Theme Selection" 或现有的主题列表）。

将您的新主题对象添加到数组中：

```typescript
{ value: '{themeId}', label: '{显示名称}' },
```

*   `value`: 必须与您 CSS 类中使用的 `{themeId}` 匹配（不带 `.md-style-` 前缀）。
*   `label`: 下拉菜单中显示给用户的名称。

## 3. 验证

1.  打开应用程序。
2.  点击工具栏中的调色板图标 (🎨)。
3.  从下拉菜单中选择您的新主题。
4.  验证预览面板中的样式是否已正确应用。
5.  切换 暗色/亮色 模式以确保在两种状态下都清晰可读。

## 技巧
*   **CSS 变量**：尽可能使用现有的应用 CSS 变量，如 `var(--text-app)`、`var(--bg-sidebar)`、`var(--border-color)`，以确保一致性并自动支持暗色模式。
*   **作用域样式**：始终在选择器前加上 `.md-style-{themeId}` 前缀，以防止样式泄漏到应用的其他部分或其他主题中。
