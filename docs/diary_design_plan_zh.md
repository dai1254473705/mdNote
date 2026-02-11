
# 日记功能设计方案 (Diary Feature Design Plan)

## 1. 产品总监视角 (Product Director)

### 核心价值
用户希望拥有一个“写日记”的专属空间。虽然现有的 Markdown 编辑器可以写任何内容，但“日记”具有特殊的时间属性和情感价值。通过提供专属的日记功能，可以增强用户的粘性，帮助用户养成记录习惯。

### 功能定位
- **作为“功能百宝箱”的新成员**：与“日程清单”、“密码管理器”并列，提供轻量级但专属的日记体验。
- **时间胶囊**：以“日期”为核心索引，而非文件夹层级。
- **极简与专注**：提供无干扰的写作环境，但支持必要的 Markdown 格式。

### 更好的建议 (Better Suggestion)
用户最初的想法是“在现有的 md 里面加个预制的日记格式”。
**我的建议是**：不仅提供格式，更提供**以日历为核心的管理视图**。
- **原因**：单纯的 MD 文件混在普通笔记中容易通过文件树很难回顾“哪天写了，哪天没写”。通过日历视图，用户可以直观地看到自己的记录轨迹，点击日期即可创建或查看当天的日记。这比单纯加个模板体验更好。

---

## 2. UED 总监视角 (UED Director)

### 界面布局
采用 **日历 + 阅读/编辑** 的分栏布局（类似经典的日记应用或博客后台）。

```
+----------------------------------+--------------------------------------------------+
| 侧边栏 (功能百宝箱 - 日记)         | 主内容区域 (Main Content)                        |
|                                  |                                                  |
| [2024年 2月] < >                 | [ 2024年2月10日 星期一 ] (标题自动生成)          |
|                                  | 天气: ☀️ | 心情: 😊                             |
| Mon Tue Wed Thu Fri Sat Sun      |                                                  |
|              1   2   3           | # 今天发生了什么...                              |
|  4   5   6   7   8   9  [10]     |                                                  |
| 11  12  13  14  15  16  17       | (这里是标准的 Markdown 编辑器区域)               |
| ...                              |                                                  |
|                                  |                                                  |
| [统计: 本月已记录 5 天]           |                                                  |
+----------------------------------+--------------------------------------------------+
```

### 交互逻辑
1.  **日历导航**：
    *   日历上标记有日记的日期（例如有个小圆点）。
    *   点击某个日期：
        *   如果该日期已有日记 -> 打开并加载内容。
        *   如果该日期无日记 -> 自动创建新文件，并填充预制模板。
2.  **今日直达**：提供“回到今天”按钮，由空状态引导用户开始今天的记录。
3.  **模板系统**：
    *   新建日记时，自动插入 FrontMatter (元数据) 和默认内容模板。

---

## 3. 技术总监视角 (Technical Director)

### 数据存储 (Data Storage)
为了满足用户**“不丢失”**和**“独立存放”**的需求，我们将支持自定义存储路径。

*   **默认路径**: `ProjectRoot/Diary`
*   **[NEW] 自定义路径**: 用户可以在设置中指定任意文件夹作为日记存储位置。
    *   **场景**: 用户可以将日记文件夹指向一个独立的 Git 仓库克隆目录。
*   **[NEW] 独立 Git 同步**:
    *   如果日记目录是一个 Git 仓库，系统将提供独立的“同步”按钮。
    *   这允许日记与主文档物理隔离，备份到完全不同的 GitHub/Gitee 仓库。
*   **目录结构**: 建议按年/月归档（可选，MVP版本可先扁平存储或按年存储）。
    *   `DiaryRoot/2024/2024-02-10.md`
*   **文件命名**: 严格按照 `YYYY-MM-DD.md` 命名，依靠文件名作为日期的唯一索引。

### 模板实现 (Template)
在创建文件时，写入预设的 Markdown 内容：

```markdown
---
title: 2024-02-10
date: 2024-02-10
tags: [diary]
weather: 
mood: 
location:
people:
time: 
---

# 2024-02-10 星期一

## 💡 今日心情


## 📝 记录一下


```

### 组件复用
*   **Editor**: 复用现有的 `Editor` 组件，但可能需要由 `UIStore` 控制其加载的文件路径，或者简单地复用 `FileStore` 的打开文件逻辑（`openFile`）。
*   **Calendar**: 复用或引入轻量级的日历组件 (如 `react-day-picker`)。

---

## 4. 待确认问题 (TODO List)
- [x] **已确认**: 用户希望日记能独立存储并备份到 GitHub。解决方案：支持配置独立的存储路径。
- [x] **已确认**: 确认需要“心情”和“天气”,"时间"，“地点”，“人物”等特色字段
- [x] **已确认**: MVP 版本优先实现“自定义路径”+“基础读写”，Git以此文件夹自带的 git 为准。（即用户自己 clone 下来，App 只负责读写，提供简单的 Sync 按钮）

## 5. 执行计划 (Execution Plan) - [已完成]

1.  **Store 层**: Created `DiaryStore`, supporting local project root relative paths.
2.  **设置**: Implemented "Setup" flow for first-time usage to configure the diary folder name.
3.  **UI 层**: Developed `DiaryPage` with:
    -   **Sidebar**: Calendar view, folder toggle, and "Change Folder" option.
    -   **Editor**: Integrated Markdown editor with metadata inputs (Mood, Weather, Location, People).
4.  **集成**: Added entrance in "Function Toolbox".
5.  **增强特性**:
    -   **目录结构**: Adopted `YYYY-MM-DD/index.md` structure for better asset isolation.
    -   **媒体支持**: Supported pasting images (saved locally) and video playback.
    -   **本地化**: Fully localized to Chinese.

## 6. 现状 (Current Status)
功能已完全实现并发布。
- 支持按日历导航。
- 支持创建/编辑/保存日记。
- 支持元数据记录。
- 支持图片粘贴和视频播放。
- 数据存储在本地项目文件夹中，安全且易于备份。
