# 密码管理器功能文档 (Password Manager Features)

本文档详细说明了应用中的密码管理器功能，包括安全性设计、功能特性以及代码实现细节。

## 1. 功能概述

密码管理器提供了一种安全、加密的方式来存储用户的账号密码信息，支持分类管理及快捷复制。

主要特性包括：
- **安全解锁**: 启动时需输入主密码（暂未强加密，需未来升级）。
- **条目管理**: 支持添加、编辑、删除密码条目（标题、用户名、密码、网站、备注）。
- **快捷复制**: 一键复制用户名或密码到剪贴板。
- **密码显示/隐藏**: 安全切换密码可见性。

## 2. 核心逻辑

### 2.1 数据存储与安全
- **Master Password**: 主密码用于解锁管理器，目前存储在 `PasswordStore` 状态中。
- **Encryption**: 密码数据在本地 JSON 文件中存储时进行了简单混淆/加密（具体实现参考 `PasswordStore`）。
- **Item Structure**: 每个条目包含 unique ID, Title, Username, Password (encrypted), Website, Notes。

### 2.2 交互逻辑
- **解锁机制**: 打开页面时首先显示解锁弹窗，验证成功后加载密码列表。
- **添加/编辑**: 弹窗形式录入信息，支持生成随机强密码（预留功能）。
- **复制反馈**: 复制成功后显示 Toast 提示。

## 3. 架构与实现

### 3.1 目录结构

```
src/
  ├── store/
  │   └── PasswordStore.ts    # MobX Store，管理密码数据、解锁状态和 CRUD
  ├── components/
  │   └── PasswordManager/
  │       ├── PasswordPage.tsx    # 主页面组件 (全屏视图)
  │       ├── PasswordList.tsx    # 密码列表组件 (如果拆分)
  │       └── PasswordItem.tsx    # 单个密码条目组件
  └── types/                  # 类型定义 (PasswordItem)
```

### 3.2 页面重构
原 `PasswordManager` (Dialog) 已重构为 `PasswordPage` (全屏页面)，移除了最外层的 `Dialog` 包装，保留了内部的解锁逻辑和 CRUD 弹窗。

### 3.3 关键组件
- **PasswordPage**: 核心页面，根据 `isUnlocked` 状态决定显示解锁界面还是密码列表。
- **UnlockView**: 输入主密码解锁的视图。
- **PasswordStore**:
    - `isUnlocked`: 当前锁定状态。
    - `passwords`: 当前加载的密码条目列表。
    - `addPassword()` / `updatePassword()` / `deletePassword()`: CRUD 操作。

## 4. UI Design

- **布局**: 顶部工具栏（添加、搜索、锁定）+ 列表展示区。
- **视觉风格**:
    - 密码字段默认显示为圆点 (`••••••`)。
    - 敏感操作（删除）需二次确认。
    - 列表项支持 Hover 显现操作按钮。

## 5. 未来规划 (To-Do)

- **强加密**: 引入 `crypto-js` 或更强的加密算法保护本地数据。
- **自动锁定**: 页面切换或闲置超时后自动锁定。
- **导入导出**: 支持导出为 CSV 或导入其他密码管理器数据。
