# 📤 导出功能说明文档

本文档详细介绍了知夏笔记的导出功能，包括单文件导出、批量导出、主题样式的支持以及底层的技术实现。

## 1. 功能概览

知夏笔记支持将 Markdown 笔记导出为以下格式：
*   **HTML**: 生成包含完整样式的 HTML 文件，支持自适应布局。
*   **PDF**: 生成 A4 纸张大小的 PDF 文档，支持样式和图片。

导出功能有两个主要入口：
1.  **编辑器浮动工具栏**：用于导出当前正在编辑的单个文件。
2.  **侧边栏上下文菜单**：用于批量导出整个文件夹下的 Markdown 文件。

---

## 2. 关键特性

### 🎨 2.1 主题样式支持 (Themed Export)
导出功能实现了“所见即所得” (WYSIWYG)。
*   **机制**：在导出时，系统会自动提取当前编辑器中选中的 **Markdown 主题 CSS**。
*   **效果**：导出的 HTML 和 PDF 文件将完全保留用户在预览模式下看到的主题风格（如字体、颜色、背景、代码块样式等）。
*   **实现**：通过遍历 `document.styleSheets` 提取 `.markdown-theme-container` 和 `.md-style-*` 相关的 CSS 规则，并动态注入到导出模板的 `<style>` 标签中。

### 📱 2.2 自适应布局 (Responsive Layout)
*   **HTML**: 导出的 HTML 文件采用了 `max-width: 100%` 的布局容器，确保在不同尺寸的屏幕和设备上都能全宽自适应显示，不再受限于固定的 900px 宽度。
*   **PDF**: 针对 A4 纸张进行了专门的 CSS 优化（`padding: 20mm`），确保打印效果整洁。

---

## 3. 技术实现细节

### 3.1 前端架构

#### 单文件导出 (`src/components/Editor/PreviewFloatingTools.tsx`)
*   **触发**：用户点击编辑器右下角的浮动工具栏。
*   **逻辑**：
    1.  使用 `marked` 将当前 Markdown 内容转换为 HTML。
    2.  调用内部帮助函数提取当前生效的主题 CSS。
    3.  构建完整的 HTML 字符串（包含 `<!DOCTYPE html>`）。
    4.  通过 `window.electronAPI.exportHtml` 或 `exportPdf` 发送给主进程。

#### 批量导出 (`src/store/FileStore.ts` & `src/components/Sidebar/index.tsx`)
*   **触发**：用户右键点击侧边栏文件夹 -> “批量导出”。
*   **逻辑**：
    1.  `Sidebar/index.tsx`: 负责提取当前的主题 CSS (`getThemeInfo` helper)。
    2.  `FileStore.batchExportNotes`: 接收 CSS 参数，遍历文件夹下的所有 `.md` 文件。
    3.  使用 `createHtmlDocument` / `createPdfHtmlDocument` 辅助方法生成带有样式的 HTML 包装器。
    4.  调用 `window.electronAPI.exportHtmlDirect` 或 `exportPdfDirect` 进行保存。

### 3.2 后端架构 (`electron/main.ts`)

后端提供了两组 API 处理导出请求：

#### 交互式导出 (带保存对话框)
*   `file:exportHtml`: 弹出保存对话框。会自动检测传入的内容是否已经是完整 HTML。如果是，则直接保存；如果不是，会添加默认包装器（旧逻辑兼容）。
*   `file:exportPdf`: 弹出保存对话框。生成 PDF 的核心逻辑见下文。

#### 直接导出 (无对话框，用于批量)
*   `file:exportHtmlDirect`: 直接接收路径和内容进行写入。
*   `file:exportPdfDirect`: 直接接收路径和 HTML 内容生成 PDF。

### 3.3 核心优化与修复

#### ✅ 修复 PDF 导出大文件报错 (`ERR_INVALID_URL`)
*   **问题**：旧版本使用 `win.loadURL('data:text/html,...')` 加载 HTML 内容以生成 PDF。当内容（特别是包含 Base64 图片时）过长，会超过浏览器 URL 长度限制，导致 `ERR_INVALID_URL (-300)` 错误。
*   **解决方案**：
    1.  将组装好的 HTML 内容先写入系统的 **临时文件** (`os.tmpdir()`)。
    2.  使用 `win.loadURL('file://...')` 加载该临时文件。
    3.  调用 `win.webContents.printToPDF` 生成 PDF。
    4.  生成完成后自动清理临时文件。
*   **涉及 API**: `exportPdf` 和 `exportPdfDirect` 均已应用此修复。

#### ✅ 防止双重 HTML 包装
*   后端 API 现在会检查传入的 `content` 是否以 `<!DOCTYPE html` 开头。
*   如果是，则认为前端已经完成了包装（包含了自定义主题样式），后端直接保存，不再添加默认的 HTML 骨架。这确保了前端注入的主题样式不会被覆盖或嵌套错误。
