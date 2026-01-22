# Markdown 语法完全指南

Markdown 是一种轻量级标记语言，让你可以使用易读易写的纯文本格式编写文档。

知夏笔记完全支持 GitHub Flavored Markdown (GFM) 语法。

---

## 📝 标题

标题使用 `#` 号，数量表示级别（1-6 级）。

### 语��

```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
```

### 实际效果

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

### 最佳实践

- 文档只使用一个一级标题
- 标题层级不要跳级（如从一级直接跳到三级）
- 标题要简洁明确

---

## 🎨 文本样式

### 基础样式

| 样式 | 语法 | 快捷键 |
|------|------|--------|
| **粗体** | `**粗体**` 或 `__粗体__` | `⌘ + B` |
| *斜体* | `*斜体*` 或 `_斜体_` | `⌘ + I` |
| ***粗斜体*** | `***粗斜体***` | - |
| ~~删除线~~ | `~~删除线~~` | - |
| \`行内代码\`` | `` `代码` `` | - |
| ==高亮== | `==高亮==` | - |

### 示例

```markdown
这是 **粗体文本**
这是 *斜体文本*
这是 ***粗斜体文本***
这是 ~~删除线文本~~
这是 \`行内代码\`
```

**效果：**

这是 **粗体文本**
这是 *斜体文本*
这是 ***粗斜体文本***
这是 ~~删除线文本~~
这是 \`行内代码\`

### 转义字符

使用反斜杠 `\` 转义特殊字符：

```markdown
\* 不是斜体
\[ 不是链接
\` 不是代���
```

---

## 📋 列表

### 无序列表

使用 `-`、`*` 或 `+` 开头：

```markdown
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3
```

**效果：**

- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3

### 有序列表

使用数字加点开头：

```markdown
1. 第一步
2. 第二步
3. 第三步
```

**效果：**

1. 第一步
2. 第二步
3. 第三步

### 嵌套列表

```markdown
1. 一级项目
   - 二级无序项目
   - 二级无序项目
2. 一级项目
   1. 二级有序项目
   2. 二级有序项目
```

### 任务列表

```markdown
- [x] 已完成的任务
- [ ] 未完成的任务
- [ ] 待办事项
```

**效果：**

- [x] 已完成的任务
- [ ] 未完成的任务
- [ ] 待办事项

### 列表最佳实践

- 列表项之间可以有空行
- 嵌套列表使用 2 或 4 个空格缩进
- 有序列表的数字可以不连续

---

## 🔗 链接

### 基础链接

```markdown
[链接文本](https://example.com)
[带标题的链接](https://example.com "鼠标悬停显示")
```

### 相对路径链接

```markdown
[查看其他笔记](./其他笔记.md)
[上一级](../README.md)
```

### 锚点链接

```markdown
[跳转到标题](#标题文字)
[跳转到代码块](#代码)
```

### 引用链接

```markdown
[链接文本][reference-id]

[reference-id]: https://example.com "可选标题"
```

### 自动链接

```markdown
<https://example.com>
<email@example.com>
```

### 邮箱链接

```markdown
<user@example.com>
[给我发邮件](mailto:user@example.com)
```

---

## 🖼️ 图片

### 基础语法

```markdown
![替代文本](图片URL)
![替代文本](图片URL "可选标题")
```

### 相对路径（推荐）

```markdown
![本地图片](./files/image.png)
![子目录图片](../assets/logo.png)
```

### 设置图片大小

知夏笔记支持通过查询参数调整图片大小：

```markdown
![图片](./image.png?w=300)        # 宽度 300px
![图片](./image.png?h=200)        # 高度 200px
![图片](./image.png?w=300&h=200)  # 宽度 300px，高度 200px
```

### 图片最佳实践

- 使用相对路径便于移动和分享
- 适当的替代文本有助于 SEO 和无障碍访问
- 控制图片大小，避免过大影响加载速度

---

## 💬 引用

### 基础引用

```markdown
> 这是一段引用文本
```

**效果：**

> 这是一段引用文本

### 嵌套引用

```markdown
> 外层引用
>
> > 内层引用
```

**效果：**

> 外层引用
>
> > 内层引用

### 引用中包含其他元素

```markdown
> **引用中的粗体**
>
> \`引用中的代码\`
>
> - 引用中的列表
```

**效果：**

> **引用中的粗体**
>
> \`引用中的代码\`
>
> - 引用中的列表

---

## 📊 代码

### 行内代码

使用反引号 \` 包裹代码：

```markdown
使用 \`print()\` 函数输出结果
在 HTML 中使用 \`<div>\` 标签
```

### 代码块

使用三个反引号包裹代码，可指定语言：

\`\`\`javascript
function hello(name) {
    console.log(\`Hello, \${name}!\`);
}

hello('World');
\`\`\`

**效果：**

```javascript
function hello(name) {
    console.log(\`Hello, \${name}!\`);
}

hello('World');
```

### 支持的语言

| 语言 | 标识符 | 语言 | 标识符 |
|------|--------|------|--------|
| JavaScript | `javascript`, `js` | Python | `python`, `py` |
| TypeScript | `typescript`, `ts` | Java | `java` |
| HTML | `html` | CSS | `css` |
| Bash | `bash`, `shell` | SQL | `sql` |
| JSON | `json` | XML | `xml` |
| C++ | `cpp`, `c++` | Go | `go` |
| Rust | `rust` | PHP | `php` |
| Ruby | `ruby` | Swift | `swift` |

### 代码块语法高亮示例

**JavaScript:**

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);

const sum = (a, b) => a + b;
console.log(sum(1, 2)); // 3
\`\`\`

**Python:**

\`\`\`python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))

data = [1, 2, 3, 4, 5]
squared = [x ** 2 for x in data]
print(squared)  # [1, 4, 9, 16, 25]
\`\`\`

**CSS:**

\`\`\`css
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.button {
    background: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
}
\`\`\`

### 行号和代码高亮

\`\`\`javascript {.line-numbers}
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`

---

## 📋 表格

### 基础表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |
```

**效果：**

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |

### 对齐方式

```markdown
| 左对齐 | 居中 | 右对齐 |
|:-------|:----:|-------:|
| Left   | Center | Right |
| L      | C      | R      |
```

**效果：**

| 左对齐 | 居中 | 右对齐 |
|:-------|:----:|-------:|
| Left   | Center | Right |
| L      | C      | R      |

### 复杂表格示例

```markdown
| 功能 | 状态 | 优先级 | 负责人 |
|------|------|--------|--------|
| 用户登录 | ✅ 已完成 | 🔴 高 | 张三 |
| 数据导出 | 🚧 进行中 | 🟡 中 | 李四 |
| 权限管理 | ❌ 未开始 | 🟢 低 | 王五 |
```

**效果：**

| 功能 | 状态 | 优先级 | 负责人 |
|------|------|--------|--------|
| 用户登录 | ✅ 已完成 | 🔴 高 | 张三 |
| 数据导出 | 🚧 进行中 | 🟡 中 | 李四 |
| 权限管理 | ❌ 未开始 | 🟢 低 | 王五 |

### 表格内使用其他元素

```markdown
| 列1 | 列2 |
|-----|-----|
| **粗体** | \`代码\` |
| *斜体* | ~~删除~~ |
| - 列表项1<br>- 列表项2 | 链接：[百度](https://baidu.com) |
```

---

## ➗ 分隔线

使用三个或更多的 `*`、`-` 或 `_`：

```markdown
***

---

___
```

---

## 🎯 高级语法

### 脚注

```markdown
这是一段文字，包含一个脚注[^1]。

这是另一个脚注[^note]。

[^1]: 这是第一个脚注内容
[^note]: 这是命名脚注的内容
```

### 定义列表

```markdown
术语 1
:   定义 1 的详细说明

术语 2
:   定义 2 的详细说明
```

**效果：**

术语 1
:   定义 1 的详细说明

术语 2
:   定义 2 的详细说明

### 任务列表（复选框）

```markdown
- [ ] 未完成的任务
- [x] 已完成的任务
- [ ] **重要**任务
- [ ] *紧急*任务
```

### 键盘快捷键

知夏笔记支持一些快捷键来快速插入格式：

- `⌘ + B` - 粗体
- `⌘ + I` - 斜体
- `⌘ + K` - 插入链接
- `⌘ + Shift + C` - 插入代码块

---

## 📐 HTML 支持

Markdown 支持内嵌 HTML：

### HTML 标签

```html
<div style="color: red;">
  这是红色文字
</div>

<details>
  <summary>点击展开</summary>
  这是隐藏的内容
</details>
```

### 视频

```html
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4">
</video>
```

### 音频

```html
<audio controls>
  <source src="audio.mp3" type="audio/mpeg">
</audio>
```

---

## 🎨 知夏笔记特色功能

### 1. 图片上传

- 拖拽图片到编辑器自动上传
- 支持调整图片大小
- 图片自动保存到 \`files/\` 目录

### 2. Mermaid 图表

使用 \`\`\`mermaid` 代码块创建流程图、时序图等（详见 Mermaid 帮助文档）

### 3. 全文搜索

使用 \`⌘ + Shift + F\` 在所有笔记中搜索内容

### 4. 自动保存

编辑时自动保存，无需手动操作

### 5. 标签管理

在笔记开头使用 YAML frontmatter 添加标签：

\`\`\`markdown
---
tags: [重要, 待办, 项目A]
---
\`\`\`

---

## 📝 实战示例

### 技术文档

\`\`\`markdown
# 项目名称

## 简介
这是一个优秀的项目。

## 安装

\`\`\`bash
npm install project-name
\`\`\`

## 使用

\`\`\`javascript
import { init } from 'project-name';

init({
    debug: true
});
\`\`\`

## API 文档

### init()

初始化项目。

**参数：**
- \`options.debug\` (boolean) - 是否开启调试模式

**示例：**

\`\`\`javascript
init({ debug: true });
\`\`\`

## 许可证

MIT
\`\`\`

### 会议记录

\`\`\`markdown
# 周会记录 - 2024年1月15日

**时间：** 14:00 - 15:30
**地点：** 会议室 A
**参与人员：** 张三、李四、王五

## 会议议程

1. 上周工作总结
2. 本周工作计划
3. 问题讨论

## 工作总结

### 完成的任务

- [x] 完成用户登录功能
- [x] 修复页面样式问题
- [ ] 完成数据导出功能

### 遇到的问题

**问题：** 数据导出时性能较差

**解决方案：** 使用分页加载

## 工作计划

| 任务 | 负责人 | 截止日期 |
|------|--------|----------|
| 数据导出优化 | 张三 | 1月20日 |
| 单元测试补充 | 李四 | 1月22日 |
| 文档更新 | 王五 | 1月25日 |

## 行动项

- [ ] 张三：1月18日前提交代码审查
- [ ] 李四：1月19日前完成测试用例
- [ ] 王五：1月20日前更新 API 文档

## 下次会议

**时间：** 2024年1月22日 14:00
\`\`\`

### 个人笔记

\`\`\`markdown
# 学习笔记 - JavaScript 闭包

## 什么是闭包？

闭包是指有权访问另一个函数作用域中变量的函数。

## 示例

\`\`\`javascript
function createCounter() {
    let count = 0;
    return function() {
        count++;
        return count;
    };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
\`\`\`

## 闭包的用途

1. 数据封装
2. 柯里化
3. 保持状态

## 注意事项

- 闭包会占用内存，过度使用可能导致内存泄漏
- 及时释放不再使用的闭包
\`\`\`

---

## 🎯 最佳实践

### 1. 文件命名

- 使用有意义的文件名
- 推荐格式：\`YYYY-MM-DD-标题.md\`
- 示例：\`2024-01-15-会议记录.md\`

### 2. 目录结构

\`\`\`
项目根目录/
├── README.md
├── 00-项目概览/
│   ├── 简介.md
│   └── 快速开始.md
├── 01-需求文档/
│   ├── 功能需求.md
│   └── 非功能需求.md
└── 02-技术文档/
    ├── API文档.md
    └── 数据库设计.md
\`\`\`

### 3. 标题层级

- 保持标题层级清晰，不要跳级
- 一篇文档只使用一个一级标题
- 二级标题用于主要章节
- 三级及以下用于小节

### 4. 代码块

- 始终指定语言以获得语法高亮
- 保持代码简洁，移除不必要的注释
- 复杂代码添加说明

### 5. 图片和链接

- 使用相对路径引用项目内资源
- 外部链接确保可访问
- 图片添加适当的替代文本

### 6. 列表

- 列表项保持简短
- 过长的列表考虑分组
- 任务列表使用复选框

---

## ⌨️ 快捷键速查

| 快捷键 | 功能 |
|--------|------|
| \`⌘ + B\` | 粗体 |
| \`⌘ + I\` | 斜体 |
| \`⌘ + K\` | 插入链接 |
| \`⌘ + Shift + C\` | 插入代码块 |
| \`⌘ + Shift + K\` | 插入图片 |
| \`⌘ + /\` | 查看快捷键帮助 |
| \`⌘ + H\` | 查看帮助文档 |

---

## 💡 常见技巧

### 1. 快速创建表格

使用在线工具生成表格，然后复制到笔记：
- [Tables Generator](https://www.tablesgenerator.com/)
- [Markdown Tables Generator](https://www.tablesgenerator.com/markdown_tables_generator)

### 2. 数学公式

知夏笔记支持 LaTeX 数学公式（使用 KaTeX）：

\`\`\`markdown
行内公式：$E = mc^2$

块级公式：
$$
\\frac{n!}{k!(n-k)!} = \\binom{n}{k}
$$
\`\`\`

### 3. emoji 表情

直接复制粘贴 emoji，或使用代码：
- ✅ \`:white_check_mark:\`
- ❌ \`:x:\`
- ⭐ \`:star:\`

### 4. 转义特殊字符

需要显示特殊字符时使用反斜杠转义：
- \`\\*\` 显示为 \`*\`
- \`\\#\` 显示为 \`#\`
- \`\\[\` 显示为 \`[\`

---

## 📚 扩展资源

### 官方文档

- [Markdown 官方教程](https://www.markdowntutorial.com/)
- [GitHub Flavored Markdown 规范](https://github.github.com/gfm/)
- [CommonMark 规范](https://spec.commonmark.org/)

### 在线工具

- [Markdown 在线编辑器](https://markdown-it.github.io/)
- [Dillinger 在线编辑器](https://dillinger.io/)
- [Mermaid 在线编辑器](https://mermaid.live/)

### 学习资源

- [Markdown 语法说明](https://blog.csdn.net/ity квали/article/details/80356123)
- [Markdown 最佳实践](https://markdown.guide/)

---

> 💡 **提示**：将本文档保存到你的笔记中，随时查阅！
> 
> Markdown 的魅力在于简单易学，多练多用！
> 
> 推荐使用 \`⌘ + H\` 快捷键随时打开帮助文档！
