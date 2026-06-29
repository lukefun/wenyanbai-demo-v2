# Plan: 拆分单文件 index.html 为多文件结构

## Summary
将 780 行单文件 `index.html` 按关注点拆分为 5 个独立文件（HTML/CSS/数据/逻辑），每次迭代只需读取变更相关文件，token 消耗降低 60-85%。保持零构建、零依赖、浏览器直开。

## User Story
As a 开发者用 AI 迭代这个项目,
I want 只读取我正要改的那部分代码而不是每次读完 780 行,
So that token 消耗大幅降低，迭代速度加快。

## Problem → Solution
每次改 CSS → 要读 780 行 (含 234 行从不改的数据) → 改为每次 CSS 只读 121 行

## Metadata
- **Complexity**: Medium
- **Source PRD**: N/A
- **PRD Phase**: standalone
- **Estimated Files**: 7 (1 modify + 4 create + 2 move)

---

## UX Design

N/A — 内部重构，用户体验和行为完全不变。浏览器打开 `index.html` 的行为不变。

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `index.html` | all (780) | 唯一源文件，需要理解完整结构再拆 |
| P1 (important) | `CLAUDE.md` | all | 项目架构文档 |

## External Documentation

No external research needed — feature uses established internal patterns.

---

## Patterns to Mirror

### CSS_DESIGN_TOKENS
```css
/* SOURCE: index.html:12-17 */
:root{
  --bg:#f5f0e8;--card:#ffffff;--accent:#c04030;--gold:#b8860b;
  --green:#3d8b63;--text:#2c2420;--muted:#9a8e80;--border:#ebe5d8;
  --serif:'Noto Serif SC','STSong','SimSun',serif;
  --sans:'PingFang SC','Microsoft YaHei',sans-serif;
}
```

### DATA_EMBED_INLINE_HTML
```js
// SOURCE: index.html:235 — 例句字段包含内嵌 HTML 高亮标记
// 例如: s:'择其善者而从<b class="hl">之</b>'
// 拆分到 JS 文件时必须保持为 JS 字符串，不能转 JSON（避免逃逸问题）
```

### SCRIPT_LOADING_ORDER
```
// SOURCE: index.html:232-778 — 数据在逻辑之前定义
// 加载顺序必须是: cards.js → quiz.js → app.js
// 数据文件设 window.CARDS / window.QUIZZES 全局变量
// app.js 顶部用 var C = window.CARDS; var Q = window.QUIZZES; 接住
```

### GLOBAL_NAMESPACE
```js
// SOURCE: index.html — 所有变量和函数都在全局作用域
// var C, var Q, var R{}, var stats{}, var INT[], ...
// function save(), function nav(), function updateHome(), ...
// 拆分后保持全局作用域（window 挂载），不做模块化封装
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `index.html` | MODIFY | 删除内嵌 `<style>` 和 `<script>`，改为外联引用 |
| `styles.css` | CREATE | 提取 CSS (lines 10-130) |
| `data/cards.js` | CREATE | 提取 C[] 数据 (lines 234-398) |
| `data/quiz.js` | CREATE | 提取 Q[] 数据 (lines 401-471) |
| `app.js` | CREATE | 提取 JS 逻辑 (lines 473-778) |

## NOT Building

- 不引入任何构建工具 (Vite/Webpack/等)
- 不引入任何 npm 依赖
- 不改变任何 UI、交互、数据、SRS 算法
- 不做 ES module (import/export) — 浏览器 file:// 协议不支持
- 不做 JSON + fetch() — 增加异步复杂度且 file:// 下 fetch 可能受限
- 不改变 localStorage key (`w3_r`, `w3_s`) — 保证现有用户数据兼容

---

## Step-by-Step Tasks

### Task 1: 创建 `styles.css`
- **ACTION**: 从 index.html 提取 `<style>...</style>` 块内容到独立文件
- **IMPLEMENT**: 将 lines 9-131 (从 `*{margin:0...` 到 `</style>` 之前) 的内容写入 `styles.css`。保持所有 CSS custom properties、选择器、压缩格式不变。文件编码 UTF-8。
- **MIRROR**: CSS_DESIGN_TOKENS — `:root{}` 块必须在文件最前面
- **GOTCHA**: 不要提取 `<style>` 和 `</style>` 标签本身，只保留中间的 CSS 规则
- **VALIDATE**: `styles.css` 行数应为 121 行；文件开头的第一行是 `*{margin:0;padding:0;box-sizing:border-box}`

### Task 2: 创建 `data/` 目录和 `data/cards.js`
- **ACTION**: 创建 `data/` 目录，提取 C[] 数组到 `data/cards.js`
- **IMPLEMENT**: 内容为 `window.CARDS = [` + (lines 235-397 的数组元素) + `];`。保持每个元素的 `c, t, s, r, m, p, o` 字段不变，保持内嵌 HTML (`<b class="hl">`) 不变。
- **MIRROR**: GLOBAL_NAMESPACE — 挂到 `window.CARDS`; DATA_EMBED_INLINE_HTML — 例句里的 `<b class="hl">` 标签保持原样
- **GOTCHA**: 原代码 `var C=[` 那行（line 234）和结尾 `];`（line 398）都需要改掉。line 398 的 `];` 后面没有逗号 — 确认它是数组末尾。
- **VALIDATE**: 文件行数约 166 行 (~164 行数据 + 头尾)。数组首元素 `{c:'之',...}`，末元素 `{c:'坐',...}`。

### Task 3: 创建 `data/quiz.js`
- **ACTION**: 提取 Q[] 数组到 `data/quiz.js`
- **IMPLEMENT**: 内容为 `window.QUIZZES = [` + (lines 401-471 的数组元素) + `];`。每个元素 `{q, s, r, op, a}` 字段不变。
- **MIRROR**: GLOBAL_NAMESPACE, 与 Task 2 一致
- **GOTCHA**: 原代码 line 471 结尾是 `];`，后面 line 472 是空行。确认数组正确闭合。`q` 和 `s` 字段包含内嵌 HTML (`<b class="hl">`)。
- **VALIDATE**: 文件行数约 72 行。数组首元素 `{q:'「之」是...',...}`。

### Task 4: 创建 `app.js`
- **ACTION**: 提取所有 JS 逻辑到 `app.js`
- **IMPLEMENT**: 
  - 开头加入: `var C = window.CARDS; var Q = window.QUIZZES;`
  - 主体为 lines 473-778 (从 `/* ==================== 间隔重复 ==================== */` 到 `</script>` 之前的所有 JS 代码)
  - 保持所有变量名(`R`, `stats`, `INT`, `LVL_NAME`, ...)、函数名(`nav`, `save`, `buildQueue`, ...)、注释不变
- **MIRROR**: GLOBAL_NAMESPACE — 所有 `var` 和 `function` 声明保持在全局作用域
- **GOTCHA**: 
  - line 474 `var INT=[...];` 里的时间戳值 (180000, 900000, ...) 必须精确保持
  - line 479 `localStorage.getItem('w3_r')` — key 名必须保持不变
  - line 480 `localStorage.getItem('w3_s')` — key 名必须保持不变
- **VALIDATE**: 文件行数约 311 行。开头两行是 `var C = ...` 和 `var Q = ...`。

### Task 5: 修改 `index.html`
- **ACTION**: 删除内嵌 `<style>` 和 `<script>`，改为外联引用
- **IMPLEMENT**:
  1. 删除 lines 9-131 (`<style>...</style>` 整个块)，替换为 `<link rel="stylesheet" href="styles.css">`
  2. 删除 lines 232-778 (`<script>...</script>` 整个块)，替换为三个 script 标签:
     ```html
     <script src="data/cards.js"></script>
     <script src="data/quiz.js"></script>
     <script src="app.js"></script>
     ```
  3. 保持 lines 1-8 (DOCTYPE + head)，lines 133-231 (所有 HTML 模板)，line 779-780 (`</body></html>`) 不变
- **MIRROR**: SCRIPT_LOADING_ORDER — cards.js → quiz.js → app.js 顺序不可变
- **GOTCHA**: 
  - `<link>` 必须放在 `</head>` 之前 (line 131 位置)
  - `<script>` 必须放在 `</body>` 之前 (line 779 位置)，保持原有的 script 位置
  - Google Fonts 的 `<link>` (lines 7-8) 保持不变
- **VALIDATE**: `index.html` 行数约 240 行。包含 `<link rel="stylesheet" href="styles.css">`、`<script src="data/cards.js">` 等外联标签。

---

## Testing Strategy

### 功能回归测试

| 测试项 | 操作 | 预期结果 |
|---|---|---|
| 首页渲染 | 打开 index.html | 进度条、过滤按钮、操作入口正常显示 |
| 学习闪卡 | 点击"开始学习" | 闪卡出现，点击可翻转，评记按钮正常工作 |
| 测验 | 点击"复习测验" | 10 题随机出现，四选一点击有正确/错误反馈 |
| 键盘快捷键 | 测验中按 A/B/C/D | 对应选项触发 |
| 中途小测 | 学完 15 个新词 | 弹窗出现，可进入小测 |
| 词库渲染 | 切换到词库页 | 全部/虚词/实词过滤正常 |
| 我的页 | 切换到我的页 | 科举等级、统计数据显示 |
| localStorage 兼容 | 使用旧 localStorage 数据 | 进度无缝迁移 |
| SRS 复习 | 评记后切换再回来 | 下次复习时间正确计算 |

### 边界情况检查
- [x] 浏览器 file:// 协议直接打开 (不经过 localhost)
- [x] 中文编码 (UTF-8) — 所有文件保存时确认 BOM-free UTF-8
- [x] localStorage key 不变 — `w3_r` 和 `w3_s`
- [x] 例句中的内嵌 HTML 标签不被 CSS 转义破坏

---

## Validation Commands

### 结构验证
```bash
# 确认文件结构正确
ls index.html styles.css data/cards.js data/quiz.js app.js
```
EXPECT: All 5 files exist

### 行数验证
```bash
wc -l index.html styles.css data/cards.js data/quiz.js app.js
```
EXPECT: ~240 + ~121 + ~166 + ~72 + ~311 ≈ 910 lines total (比原来多 ~130 行，来自 window.xxx 赋值)

### 浏览器验证
```bash
# Windows: 直接用浏览器打开
start index.html
```
EXPECT: 应用正常运行，所有功能可用

### localStorage 兼容验证
打开旧版 index.html 学几个词（产生 localStorage 数据），然后用新版 index.html 打开，确认进度没丢。

---

## Acceptance Criteria
- [ ] 5 个文件全部创建/修改完成
- [ ] 浏览器 file:// 打开 index.html 正常运行
- [ ] 所有 5 个页面 (首页/学习/测验/词库/我的) 功能正常
- [ ] SRS 间隔重复正常工作
- [ ] localStorage 数据向后兼容
- [ ] 没有任何构建步骤或外部依赖
- [ ] Google Fonts 正常加载

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| file:// 下跨域加载 JSON 失败 | 中 | 高 | 不用 JSON+fetch，用 JS 全局变量方案 |
| 中文编码乱码 | 低 | 中 | 所有文件 UTF-8 保存 |
| 脚本加载顺序错误 | 中 | 高 | 严格按 cards.js→quiz.js→app.js 顺序 |
| localStorage key 改变导致数据丢失 | 低 | 高 | 保持 `w3_r` / `w3_s` key 名不变 |

## Notes
- 原 `index.html` 的 CSS 是压缩格式（无换行），拆分后保持同样风格
- `data/cards.js` 和 `data/quiz.js` 中的例句含 `<b class="hl">` 内嵌 HTML — 这些是 JS 字符串字面量，不需要 HTML 转义
- 拆分后总计约 910 行（比原来的 780 行多 ~130 行），但每次迭代只需读 72-311 行
- Token 节省: CSS 迭代 85%↓, JS 迭代 60%↓, 数据迭代 80%↓
