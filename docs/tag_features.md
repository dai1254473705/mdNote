<!--
 * @Author: daiyunzhou daiyunz@chanjet.com
 * @Date: 2026-02-04 16:42:48
 * @LastEditors: daiyunzhou daiyunz@chanjet.com
 * @LastEditTime: 2026-02-04 17:01:13
 * @FilePath: /zhixia-note/docs/tag_features.md
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
# 标签系统 (Tag System) 设计文档

**创建时间**: 2026-02-04
**状态**: 已实现 (Stable)
**适用版本**: v1.0+

本文档详细说明了项目中标签功能的设计、实现逻辑及维护指南，旨在帮助 AI 助手快速理解当前架构以便进行后续开发。

---

## 1. 核心功能概述

标签系统允许用户通过为 Markdown 文件添加标签来进行分类和筛选。

*   **标签定义**: 仅支持在 Markdown **Frontmatter** 中定义。
*   **标签管理**: 提供全局标签侧边栏 (Drawer) 进行查看和筛选。
*   **交互入口**: 顶部工具栏 (Toolbar) 提供标签管理入口和手动刷新按钮。
*   **持久化**: 标签索引存储在 `localStorage` 中，并在应用加载时恢复。

## 2. 架构设计

### 2.1 State Management (MobX)

核心逻辑位于 `src/store/TagStore.ts`。

*   **`TagStore`**: 单例 Store，负责管理所有标签数据。
    *   `tagsMap`: `Map<string, Tag>` - 存储标签元数据（名称、计数、颜色）。
    *   `fileTagsMap`: `Map<string, string[]>` - 存储文件路径到标签列表的映射。
    *   `selectedTag`: 当前筛选选中的标签。
*   **`FileStore`**: 将 `TagStore` 注入其中，用于在文件树生成时进行筛选 (`filteredFiles` getter)。

### 2.2 数据流向

1.  **启动/构建索引**: 应用启动或点击刷新时，遍历文件树。
2.  **文件读取**: 调用 `window.electronAPI.readFile` 读取文件内容。
3.  **解析**: `parseTagsFromContent` 解析内容提取标签。
4.  **存储**: 更新内存中的 Map，并同步至 `localStorage` (`zhixia-tags`)。
5.  **筛选**: 用户点击标签 -> 更新 `selectedTag` -> `FileStore` 重新计算 `filteredFiles` -> 文件列表 UI 更新。

## 3. 关键实现细节

### 3.1 严格解析逻辑 (Strict Parsing)

为了极致的性能和避免误识别（如 CSS 颜色代码、代码块内容），当前的解析逻辑采用了**严格模式**。

**对应代码**: `TagStore.ts` -> `parseTagsFromContent(content: string)`

**规则**:
1.  **文件头检查**: 文件必须以 `---` 开头。
2.  **Frontmatter 提取**: 仅解析包裹在首部两个 `---` 之间的 YAML 内容。
3.  **格式匹配**: 使用正则 `/tags:\s*\[(.*?)\]/` 精确匹配。
    *   **支持**: `tags: [tag1, tag2, "tag 3"]`
    *   **不支持**: 内联标签 (`#tag`)、多行列表格式（`- tag`）。
4.  **正文忽略**: `---` 之后的所有内容（代码块、CSS、正文文本）完全被忽略。

**为什么这样做？**
*   **防误触**: 避免将 CSS 变量（如 `#ffffff`）或代码中的哈希值误认为标签。
*   **性能**: 无需扫描整个文件内容，只需截取头部片段。

### 3.2 手动刷新机制

由于全量监听文件变化并实时解析会带来巨大的性能开销（尤其是在文件数量较多时），我们采用了**手动刷新**策略。

*   **UI**: 工具栏标签图标旁有一个刷新按钮 (RefreshCw)。
*   **实现**: `Toolbar.tsx`
*   **API 适配**:
    *   `TagStore.buildIndex` 需要接收一个返回 `string` 的读取函数。
    *   `window.electronAPI.readFile` 返回 `{ success: boolean, data: string }`。
    *   **解决方案**: 在 `Toolbar` 中创建了一个包装函数：
        ```typescript
        const readFileWrapper = async (path: string) => {
          const res = await window.electronAPI.readFile(path);
          return res.success ? (res.data || '') : '';
        };
        ```

## 4. UI 组件

*   **Toolbar Entry**: `src/components/Toolbar.tsx`
    *   包含“打开标签页”按钮和“刷新索引”按钮。
*   **Tag Drawer**: `src/components/TagDrawer.tsx` (假设或已集成在 UIStore 控制中)
    *   展示所有标签及其计数。
    *   点击标签进行全局筛选。

### 3.3 自动更新 (Auto-Update on Save)

为了减少全量刷新的频率，我们实现了在文件保存时的**增量更新**策略。

*   **触发时机**: `FileStore.saveCurrentFile`
*   **逻辑**:
    1.  文件保存成功后。
    2.  调用 `TagStore.parseTagsFromContent` 解析当前保存的内容。
    3.  调用 `TagStore.updateFileTags` 更新该文件的标签索引。
*   **优势**: 用户编辑文档时标签实时生效，无需手动刷新。

## 5. 开发注意事项 (To AI)

1.  **修改解析逻辑**: 如果将来需要支持内联标签，**务必**小心 CSS 十六进制颜色（`#FFF`）和 Markdown 代码块の干扰。目前的严格模式是最安全的。
2.  **全量刷新**: 仅在首次加载或用户点击刷新按钮时执行。平时编辑依赖增量更新。
3.  **性能**: `buildIndex` 会并发读取所选目录下的所有 `.md` 文件。在几千个文件规模下可能需要优化（如队列限制并发数）。
