# 功能百宝箱 - TodoList (待办清单) 功能设计方案

## 1. 产品总监视角 (Product Strategy)

### 1.1 核心价值 (Value Proposition)
为知夏笔记用户提供一个轻量级、专注的任务管理工具，集成在“功能百宝箱”中。它填补了“日程清单”（偏向日历时间管理）与瞬时灵感记录之间的空白，专注于无特定日期的任务收集与执行。

### 1.2 功能定位 (Positioning)
- **极简主义**: 摒弃复杂的项目管理功能，专注个人的每日待办。
- **心流体验**: 快速记录，快速勾选，微动效反馈，带来完成任务的愉悦感。
- **数据安全**: 本地化存储，隐私无忧。

### 1.3 MVP 功能范围 (Scope)
1. **任务管理**: 
   - 快速添加任务（支持回车键）。
   - 标记完成/未完成（Checkbox）。
   - 删除任务。
2. **多清单分类**: 
   - 支持创建自定义清单（如：工作、生活、阅读）。
   - 默认提供“我的一天”和“重要紧急”清单。
3. **数据持久化**: 
   - 使用 Electron 文件系统存储 JSON 数据，确保重启不丢失。

### 1.4 未来规划 (Future Roadmap - Out of Scope for MVP)
- [ ] 任务截止日期提醒
- [ ] 任务优先级拖拽排序
- [ ] 子任务层级
- [ ] 自定义清单图标/颜色

---

## 2. UED 总监视角 (User Experience Design)

### 2.1 视觉风格 (Visual Style)
延续知夏笔记的“现代极简”风格，利用阴影层次和微动效提升质感。

- **配色**: 主色调用于强调操作（如添加按钮），完成的任务使用低饱和度灰色并带有删除线。
- **布局**: 经典的“左侧导航 + 右侧内容”双栏布局。
- **动效**: 
    - 添加任务时的淡入 (Fade In)。
    - 完成任务时的删除线动画和位置移动。
    - 清单切换时的平滑过渡。

### 2.2 界面布局原型 (Layout Prototype)
### 2.2 布局设计 (Layout)
采用经典的“左侧导航 + 右侧内容”布局，但在“功能百宝箱”的语境下，它将作为其中一个子页面呈现。

```
+----------------------------------+
| 侧边栏 (应用导航)                 |
| ...                              |
| 功能百宝箱                        |
|   - 日程清单                      |
|   - 密码管理器                    |
|   - [新] 待办清单 (TodoList)      | <--- 入口
| ...                              |
+----------------------------------+
| 主内容区域 (Main Content)         |
|                                  |
| [顶部栏]                         |
|  标题: 我的一天                   |
|  [新建清单按钮]                   |
|                                  |
| [左侧: 清单列表]                  | [右侧: 任务列表]
|  - 我的一天 (图标: 太阳)          |  标题: 我的一天
|  - 工作 (图标: 公文包)            |  日期: 2月10日, 星期二
|  - 购物 (图标: 购物袋)            | 
|                                  |  [输入框: 添加任务...]
|                                  |
|                                  |  [未完成任务]
|                                  |  O  完成设计文档
|                                  |  O  修复 Bug #123
|                                  |
|                                  |  [已完成任务 (默认折叠)]
|                                  |  X  开晨会
|                                  |
+----------------------------------+
```

### 2.3 交互设计 (Interaction)
1. **添加任务**: 
   - 输入框常驻顶部和底部。
   - 输入文字后按 Enter 立即添加。
   - 添加成功后有轻微的动效（淡入）。
2. **完成任务**: 
   - 点击左侧圆圈 (复选框)。
   - 播放令人愉悦的“打勾”微动效。
   - 任务文字变为灰色并添加删除线。
   - 任务项自动移动到“已完成”区域（可选：延迟 1s 移动，让用户有反悔机会）。
3. **切换清单**:
   - 点击左侧清单名，右侧平滑切换内容。

---

## 3. 技术实现方案 (Technical Implementation)

### 3.1 数据结构 (Data Structure)
```typescript
interface TodoTask {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
  listId: string; // 注意: 需确保清单关联
}

interface TodoList {
  id: string;
  name: string;
  icon: string; // Lucide 图标名称
  isDefault?: boolean;
}
```

### 3.2 状态管理 (MobX)
新建 `TodoStore.ts`：
- `lists`: TodoList[]
- `tasks`: TodoTask[]
- `activeListId`: string
- Actions: `addTask` (添加任务), `toggleTask` (切换状态), `deleteTask` (删除任务), `addList` (添加清单), `deleteList` (删除清单)

### 3.3 组件拆分 (Components)
- `TodoPage.tsx`: 主页面容器。
- `TodoListSidebar.tsx`: 左侧清单列表侧边栏。
- `TodoTaskView.tsx`: 右侧任务列表视图。
- `TodoItem.tsx`: 单个任务项组件。

---

## 4. 现状 (Current Status) - [已完成]

### 4.1 功能实现 (Implemented Features)
- **Store 层**: Implemented `TodoStore` with `lists` and `tasks` state managed by MobX.
- **数据持久化**: Data is saved to `todo.json` in the user's data directory.
- **UI 组件**:
    - `TodoPage`: Main container layout.
    - `TodoListSidebar`: Sidebar for managing multiple lists (Add/Delete/Switch).
    - `TodoTaskItem`: Task item component with completion toggle and delete action.
- **交互细节**:
    - Visual feedback for task completion (checkbox toggle, strikethrough).
    - Hover actions for deleting tasks.
    - Context menu support for list management.

### 4.2 待确认问题 (TODO List Status)
- [x] **已解决**: 仅支持本地存储，确保隐私安全。
- [x] **已解决**: “日程清单”后续重构为“日历视图”，与本功能不冲突。
- [x] **已解决**: MVP 版本不支持搜索。

## 5. 更好的建议 (Better Suggestions)
- **建议 1**: 增加“专注模式 (Focus Mode)”，点击某个待办事项可进入全屏倒计时番茄钟，强化“Do it now”的执行力。
- **建议 2**: 每日回顾功能，每天首次打开时提示昨天的未完成任务是否推迟到今天。
