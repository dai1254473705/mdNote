# 日志系统 (Log System) 设计文档

**创建时间**: 2026-02-04
**状态**: 已实现 (Stable)
**适用版本**: v1.0+

本文档详细说明了项目中日志系统的设计、存储策略及使用指南。

---

## 1. 核心功能概述

日志系统负责记录应用运行时的关键信息、错误和警告，用于故障排查和行为分析。

*   **单例模式**: 通过 `LogService` 单例统一管理。
*   **按天生成**: 每天生成独立的日志文件，便于按时间回溯。
*   **异步写入**: 采用队列 + 异步写入机制，避免阻塞主进程 IO。
*   **自动管理**: 自动创建目录，自动按日期命名。

## 2. 架构设计

### 2.1 LogService

核心逻辑位于 `electron/services/logService.ts`。

*   **`LogService`**: 
    *   `logPath`: 当前会话的日志文件路径。
    *   `logQueue`: 待写入消息队列。
    *   `isWriting`: 写入锁，防止并发写入冲突。

### 2.2 存储策略

*   **存储位置**: `app.getPath('userData')/logs/`
    *   macOS: `~/Library/Application Support/zhixia-note/logs/`
    *   Windows: `%APPDATA%/zhixia-note/logs/`
*   **命名规则**: `zhixia-YYYY-MM-DD.log`
    *   例如: `zhixia-2026-02-04.log`
*   **会话标记**: 每次应用启动（LogService 初始化）时，会写入一行会话开始标记：
    ```
    ========== Session Start: 2026-02-04T09:00:00.000Z ==========
    ```

### 2.3 自动轮转 (Rotation)

*   **旧机制**: 曾使用 `.1`, `.2` 后缀的大小限制轮转（已废弃）。
*   **新机制**: **按天分割**。无需手动轮转文件，只需按日期查找对应的文件即可。
*   **清理策略**:目前保留所有历史日志。若未来通过 `getAllLogFiles` 发现文件过多，可轻易扩展清理逻辑（例如删除 30 天前的 log）。

## 3. API 与 使用

### 3.1 后端 (Electron Main Process)

直接引入 `logService.ts` 导出的便捷函数：

```typescript
import { log, logError, logWarn } from './services/logService';

log('Project initialized');
logError('Failed to save file: EPERM');
```

*   **格式**: `[ISO-TIMESTAMP] [LEVEL] Message`

### 3.2 前端 (Renderer Process)

前端无法直接写入文件，需通过 IPC 调用（如有需要暴露）。目前主要通过 UI 入口查看日志。

*   **查看日志**:
    *   入口: `Toolbar` -> `More Tools (...)` -> `打开日志目录`
    *   调用: `window.electronAPI.openLogDirectory()`
    *   实现: 打开操作系统文件管理器定位到 logs 目录。

## 4. 维护指南

1.  **跨天问题**: 服务虽然是单例，但在 `startNewSession` 或每次写入前，理论上可以再次检查日期。目前的实现是在**启动时**确定文件名。
    *   *注意*: 如果应用长期不关闭运行跨天，日志仍会写入启动当天的文件中。若需严格按日，可在写入时检查日期变化并更新 `logPath`。
2.  **性能**: `processQueue` 使用了 `fsPromises.appendFile`，性能足以应对常规桌面应用日志量。
3.  **扩展**: 若需上传日志到服务器，可直接读取 `getAllLogFiles()` 返回的文件列表。
