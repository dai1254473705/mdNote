# Git 同步功能文档

本文档详细说明了应用中的 Git 同步功能，包括功能特性、架构设计、配置选项以及代码实现细节。供后续开发和维护参考。

## 1. 功能概述

知夏笔记集成了 Git 版本控制功能，允许用户将笔记数据同步到远程 Git 仓库（如 GitHub、GitLab）。

主要特性包括：
- **手动同步**：一键执行拉取（Pull）和推送（Push）。
- **细粒度状态**：清晰展示 "正在拉取"、"正在推送"、"提交中" 等具体状态。
- **自动同步**：支持定时自动提交并推送更改。
- **状态监控**：实时监控本地变更、落后/超前提交数。

## 2. 核心逻辑

### 2.1 同步流程 (Split Sync)

为了提供更友好的 UI 反馈，同步操作被拆分为两个独立的步骤：

1.  **Pull (拉取)**: `git pull --rebase`
    - 首先尝试从远程拉取最新更改。
    - 使用 rebase 模式以保持提交历史整洁。
2.  **Push (推送)**: `git push`
    - 拉取成功后，将本地提交推送到远程。

### 2.2 自动同步 (Auto Sync)

自动同步功能允许应用在后台定期执行同步任务。

- **触发条件**：
    - 定时器触发（间隔可配置）。
    - 检查条件：
        - 如果有 `modified` (未提交更改) -> 执行 **Commit** 然后 **Sync** (Pull + Push)。
        - 如果有 `ahead` (本地超前) 或 `behind` (落后远程) -> 执行 **Sync** (Pull + Push)。
        - 如果状态干净且在此期间无变化 -> 跳过。
- **配置项**：
    - `enabled`: 是否开启自动同步。
    - `interval`: 同步间隔（分钟），支持 2m, 5m, 10m, 30m, 1h, 2h, 1d。

## 3. 架构与实现

### 3.1 目录结构

```
electron/
  ├── services/
  │   ├── gitService.ts       # Git 核心服务 (simple-git 封装)
  │   └── configService.ts    # 配置服务 (存储 sync 设置)
  ├── main.ts                 # IPC 处理程序 (git:pull, git:push 等)
  └── preload.js              # 暴露 API 给渲染进程

src/
  ├── store/
  │   └── GitStore.ts         # MobX Store，管理状态和自动同步定时器
  ├── components/
  │   └── Toolbar.tsx         # 工具栏 UI (同步按钮组)
  │   └── GitSettingsDialog.tsx # 设置弹窗 UI
  └── types/                  # 类型定义 (GitConfig, GitStatus)
```

### 3.2 IPC 接口

主进程 (`main.ts`) 提供了以下 IPC 接口供渲染进程调用：

- `git:status`: 获取当前 Git 状态。
- `git:commit`: 提交更改。
- `git:pull`: **[新增]** 执行拉取操作。
- `git:push`: **[新增]** 执行推送操作。
- `git:sync`: 执行完整同步 (Pull + Push)，主要用于旧逻辑兼容，新 UI 推荐分别调用 Pull/Push 以获得更好反馈。

### 3.3 数据流

1.  **初始化**: `GitStore` 加载配置，启动状态轮询 (`startStatusLoop`) 和自动同步轮询 (`startAutoSyncLoop`, 如开启)。
2.  **手动同步**:
    - 用户点击 Toolbar 按钮。
    - `GitStore` 设置 `syncStep = 'pulling'` -> 调用 `electronAPI.pullGit()`。
    - 成功后，设置 `syncStep = 'pushing'` -> 调用 `electronAPI.pushGit()`。
    - 完成后恢复 `idle` 状态。
3.  **自动同步**:
    - 定时器触发 `autoSync()`。
    - 判断是否有变更，分别调用 `handleFullSync` (含 commit) 或 `sync` (仅传输)。

## 4. 相关代码

### GitStore.ts 关键片段

```typescript
// 自动同步循环
startAutoSyncLoop() {
  this.stopAutoSyncLoop();
  if (!this.autoSyncConfig.enabled) return;
  const intervalMs = this.autoSyncConfig.interval * 60 * 1000;
  this.autoSyncIntervalId = setInterval(() => {
    this.autoSync();
  }, intervalMs);
}

// 分步同步逻辑
private async syncInternal() {
  // 1. Pull
  runInAction(() => this.syncStep = 'pulling');
  await window.electronAPI.pullGit();
  
  // 2. Push
  runInAction(() => this.syncStep = 'pushing');
  await window.electronAPI.pushGit();
}
```

### 配置文件 (config.json)

配置存储在用户的 AppData 目录下的 `config.json` 中：

```json
{
  "git": {
    "autoSync": true,
    "autoSyncInterval": 30
  }
}
```

## 5. UI 设计

- **Toolbar 按钮组**: 采用 Split Button 设计，左侧为主同步按钮（显示状态），右侧为设置按钮（齿轮图标）。
- **设置弹窗**: 使用 Radix UI Dialog 构建，提供开关和下拉选择，实时保存配置。

## 6. 注意事项

- **主进程修改**: 修改 `git:pull` 等 handler 涉及 `electron/main.ts`，需要在开发时重启 Electron 主进程。
- **错误处理**: 同步过程中的网络错误或冲突会在 UI 上显示为 Error 状态，建议查看日志以排查详细问题。
