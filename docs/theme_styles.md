# 🎨 主题样式说明文档

本文档列出了知夏笔记支持的所有 Markdown 预览主题，并说明了其技术实现方式和与导出功能的集成机制。

## 1. 主题列表

应用内置了多样化的主题，涵盖实用、可爱、深色等多种风格。所有主题均定义在 `src/styles/markdown-themes.css` 文件中。
主题切换通过 `UIStore` 的 `markdownTheme` 状态管理。

### 1.1 实用派 (Utility)
*   **默认/经典 (Default)**: 原生 Markdown 风格，简洁大方。
*   **优雅 (Elegant)**: `md-style-elegant`，衬线字体标题，大留白，适合长文阅读。
*   **简约 (Minimal)**: `md-style-minimal`，去除了多余装饰，极致的黑白灰。
*   **GitHub**: `md-style-github`，复刻 GitHub README 渲染风格，程序员首选。
*   **酷黑 (Obsidian)**: `md-style-obsidian`，**强制深色模式**，紫色高亮，适合夜间编码。
*   **小熊 (Bear)**: `md-style-bear`，复刻 Bear 笔记风格，优雅的红色 H1 和精致排版。

### 1.2 可爱/活泼 (Cute/Vibrant)
*   **气泡 (Bubble)**: `md-style-bubble`，多彩圆角背景，活泼跳跃。
*   **糖果 (Candy)**: `md-style-candy`，粉色系，甜蜜风格。
*   **马卡龙 (Macaron)**: `md-style-macaron`，清新的 Pastel 色系。
*   **布丁 (Pudding)**: `md-style-pudding`，明亮的黄色主调。
*   **云朵 (Cloud)**: `md-style-cloud`，蓝白配色，轻盈通透。

### 1.3 精选设计 (Premium)
*   **红宝石 (Ruby)**: `md-style-ruby`，类似公众号专栏风格，红色强调色。
*   **草原绿 (Meadow)**: `md-style-meadow`，绿色系，自然舒适。
*   **锤子便签 (Kraft)**: `md-style-kraft`，米黄色背景，拟物化纸张质感。
*   **极客黑 (Geek Black)**: `md-style-geek-black`，黑白高对比，胶囊式标题。
*   **萌绿 (Cute Green)**: `md-style-cute-green`，带有考拉图案元素。
*   **全栈蓝 (Full Stack Blue)**: `md-style-fullstack-blue`，科技感蓝色网格背景。
*   **蔷薇紫 (Rose Purple)**: `md-style-rose-purple`，紫色调，优雅神秘。
*   **极简黑 (Minimal Black)**: `md-style-minimal-black`，高端极简黑白。
*   **凝夜紫 (Purple Night)**: `md-style-purple-night`，深沉的紫色夜间模式。

---

## 2. 技术实现

### 2.1 CSS 架构
所有主题样式都封装在 `.markdown-theme-container` 类下，以确保样式隔离，不污染全局 UI。
特定主题的样式通过附加类名 `.md-style-[theme-name]` 激活。

**示例结构：**
```css
/* 基础容器 */
.markdown-theme-container {
    padding: 2em;
    font-family: system-ui, sans-serif;
    /* ... 基础重置 ... */
}

/* 特定主题覆盖 */
.markdown-theme-container.md-style-ruby h1 {
    border-bottom: 2px solid #e74c3c;
    /* ... */
}
```

### 2.2 动态 CSS 提取 (Exports Integration)

为了实现导出时的样式一致性，我们实现了一套动态 CSS 提取机制，位于 `getThemeInfo` 辅助函数中。

**工作原理：**
1.  **遍历样式表**：在浏览器端遍历 `document.styleSheets`。
2.  **筛选规则**：查找包含 `.markdown-theme-container` 或 `.md-style-` 的 CSS 规则。
3.  **注入**：将提取到的 CSS 文本拼接后，传递给导出模块，注入到 HTML 文件的 `<head><style>` 标签中。

这一机制确保了无论未来新增什么主题，导出功能都无需修改代码即可自动支持新主题样式。
