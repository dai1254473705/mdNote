# 项目开发任务清单 (Todo List)

> 本清单基于 `docs/最新需求文档.md` 制定，旨在指导 AI 逐步完成开发。

## 1. 项目清理与初始化 (Project Cleanup & Init)
- [ ] **清理旧文档与配置**
    - [ ] 分析并删除/重写 `README.md`：当前 `README.md` 内容（如 `config/` 目录说明）已过时，需删除或更新为指向最新需求文档的简介。
    - [ ] 清理不符合规范的现有代码：
        - 删除项目根目录下的 `config/` 文件夹（新需求要求配置在 `.github-notebook/`）。
        - 检查 `src/` 和 `electron/` 下的现有代码，标记需要重构的部分。

## 2. 基础环境搭建 (Setup)
- [ ] **安装依赖 (Dependencies)**
    - 样式与UI: `tailwindcss`, `postcss`, `autoprefixer`, `@tailwindcss/typography` (Markdown美化), `clsx`, `tailwind-merge`
    - 图标库: `lucide-react` (现代化图标)
    - 交互组件: `@radix-ui/react-dropdown-menu` (右键菜单), `@radix-ui/react-dialog` (弹窗), `@radix-ui/react-tooltip`
    - 拖拽库: `@dnd-kit/core`, `@dnd-kit/sortable`
    - 状态管理: `mobx`, `mobx-react-lite`
    - 工具库: `gray-matter`, `uuid`, `classnames`, `date-fns`, `fs-extra`
    - 渲染: `mermaid`
    - (已有的 `react`, `electron`, `vite`, `typescript` 保持不变)

- [ ] **类型定义 (Type Definitions)**
    - `src/types/index.ts`: 定义 `FileNode` (目录树), `AppConfig`, `NoteMeta`, `GitStatus` 等核心接口。

## 3. 核心服务层开发 (Electron Main Process)
> 位于 `electron/services/`

- [x] **配置服务 (ConfigService)**
    - [x] 实现 `.github-notebook` 目录的初始化检查。
    - [x] 实现 `config.json` 的读写（不上传 GitHub）。
    - [x] 实现密钥文件的本地存储管理。

- [x] **文件服务 (FileService)**
    - [x] 封装 `fs-extra`。
    - [x] 实现递归读取目录树（限制 3 级）。
    - [x] 实现笔记 CRUD、重命名、移动。
    - [x] 实现 `file/` 附件目录的自动管理（上传、引用）。
    - [x] 实现文件名合法性校验。

- [x] **Git 服务 (GitService)**
    - [x] 封装 `simple-git`。
    - [x] 实现 `init`, `clone`, `pull`, `push`, `status`。
    - [ ] 实现 SSH/HTTPS 认证处理。
    - [ ] 实现冲突检测（SHA 对比）。

- [ ] **加密服务 (CryptoService)**
    - [ ] 基于 `crypto` 模块实现 AES-256-GCM。
    - [ ] 提供 `encryptContent` / `decryptContent`。

- [x] **IPC 通信配置**
    - [x] 在 `electron/main.ts` 中注册上述服务的 handle。
    - [x] 在 `electron/preload.js` 中暴露类型安全的 `window.electronAPI`。

## 4. 前端架构与状态管理 (Frontend Store)
- [x] **Store 搭建 (`src/store/`)**
    - [x] `FileStore`: 管理文件树数据、当前选中文件。
    - [x] `ConfigStore` (UIStore): 管理主题、同步配置。
    - [x] `GitStore`: 管理同步状态、冲突信息。
    - [x] `RootStore`: 统一导出所有 Store。

## 5. UI 组件开发 (Components)
> 采用 **Tailwind CSS** + **Headless UI** 架构。拒绝臃肿的组件库，实现轻量、高性能、高度可定制的现代化界面。

- [x] **侧边栏 (Sidebar)**
    - [x] 实现自定义文件树组件（基于递归或 3 层循环）。
    - [ ] 集成 `@dnd-kit` 实现文件/目录的流畅拖拽。
    - [x] 使用 `@radix-ui/react-dropdown-menu` 实现原生级右键菜单。
    - [x] 样式：实现 MacOS 风格的毛玻璃与选中态，支持 CSS 变量主题切换。

- [x] **编辑器 (Editor)**
    - [x] 实现分栏布局（编辑/预览）。
    - [ ] 集成 FrontMatter 编辑（标题、Tags）。
    - [x] 实现自动保存 Hook（1秒防抖）。
    - [ ] 实现图片/附件拖拽上传。

- [x] **项目入口 (Welcome)**
    - [x] 实现项目选择/新建/克隆页面。

- [ ] **预览器 (Preview)**
    - [ ] 配置 `marked` 解析器。
    - [ ] 使用 `@tailwindcss/typography` (`prose` 类) 自动处理 Markdown 样式，极大简化 CSS 编写。
    - [ ] 集成 `mermaid` 渲染流程图。
    - [ ] 集成代码高亮。
    - [ ] **多主题预览系统**:
        - [ ] 设计并实现多套预览主题 CSS（如：清新绿、沉稳黑、护眼模式等）。
        - [ ] 实现主题配置与动态切换（支持 CSS Variables 或 class 切换）。
        - [ ] 优化 Markdown 基础元素样式（排版、间距、字体）。

- [ ] **工具栏 (Toolbar)**
    - [ ] 同步按钮（带状态动画）。
    - [ ] 主题切换。
    - [ ] 面包屑导航。

## 6. 业务流程实现 (Features)
- [ ] **同步流程**
    - [ ] 自动/手动同步逻辑。
    - [ ] 冲突解决弹窗 (Diff View)。
- [ ] **加密流程**
    - [ ] 密钥设置与验证 UI。
    - [ ] `.md.enc` 文件的透明加解密处理。
- [ ] **搜索与标签**
    - [ ] 建立本地搜索索引。
    - [ ] 标签云 UI。

## 7. 验收与测试
- [ ] 验证 3 级目录限制。
- [ ] 验证 Git 同步冲突处理。
- [ ] 验证加密笔记无法直接读取。
- [ ] 验证附件引用路径正确性。
