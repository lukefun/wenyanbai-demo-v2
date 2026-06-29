# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**文言斩** — 上海中考/高考文言文实词虚词冲刺工具的单文件 HTML 应用。

纯前端 (vanilla HTML/CSS/JS, 零依赖, 无构建)。移动优先 (max-width 430px)，所有状态持久化到 localStorage。

## 核心架构

```
index.html (114行) → HTML 模板 + 外联引用
styles.css (121行) → CSS custom properties + 全部样式
data/cards.js (165行) → window.CARDS = [...]  含义卡片 163张
data/quiz.js  (71行)  → window.QUIZZES = [...] 测验题库 69题
app.js        (307行) → SRS + 导航 + 渲染 + 测验逻辑
docs/         → 结构化词汇数据 + 教学参考资料
```

**加载顺序**: cards.js → quiz.js → app.js（数据在前，逻辑在后，全部挂 window 全局变量）

### 数据层 (`index.html` 内嵌)

- **`C[]`** — 含义卡片数组。每条: `{c: 字, t: 实词/虚词, s: 例句(含 HTML 高亮), r: 出处, m: 含义, p: 记忆提示, o: 其他用法[]}`
- **`Q[]`** — 测验题库数组。每条: `{q, s, r, op: 选项[], a: 正确索引}`
- **`R{}`** — SRS 复习状态 (`{l: 级别 0-9, n: 下次复习时间戳, ok: 答对次数}`)
- **`stats{}`** — 统计 (`{t: 总答题数, c: 正确数}`)

### 导航与页面

5个页面通过 `.sc.on` 切换，底栏导航 (`nav()` 函数):
- **首页** — 进度条、过滤(全部/待复习/新词)、主操作入口
- **学习页** — 闪卡翻转→评记(记住/还不熟)，每15个新词触发中途小测
- **测验页** — 随机10题四选一，支持键盘快捷键 (A/B/C/D / 1/2/3/4)
- **词库页** — 按全部/虚词/实词过滤，每字显示含义进度圆点
- **我的页** — 科举等级(童生→状元)、学习统计

### 间隔重复 (SRS)

`INT[]` 定义了10个级别的时间间隔 (3分钟→30分钟→1.5小时→1天→2天→4天→7天→15天→30天)。记住升一级，忘记降两级。`buildQueue()` 按 3:1 复习:新词比例混合队列。

## 常见操作

- **运行/预览**: 直接用浏览器打开 `index.html`（双击或 `start index.html`）
- **查看结构化数据**: 参见 `docs/output/new-words-only.json`（大规模结构化词汇数据，包含 Word/Meaning/Example 三层 schema）
- **教学参考**: `docs/` 目录包含上海中考/高考文言文篇目总览、实词虚词专项梳理、默写检测等教学资料

## 数据流

```
浏览器打开 index.html
  → <link> 加载 styles.css
  → <script> 顺序加载 data/cards.js → data/quiz.js → app.js
  → app.js: var C = window.CARDS; var Q = window.QUIZZES; 接住数据
  → try{ JSON.parse(localStorage.w3_r) } 恢复 SRS 状态
  → updateHome() 渲染首页
  → 用户交互 → save() 持久化到 localStorage
```

## 迭代效率

拆分后每个文件职责单一，修改时只需读取目标文件：
- 改 CSS → `styles.css` (121行, ~10K)
- 改逻辑 → `app.js` (307行, ~15K)
- 改数据 → `data/cards.js` (165行) 或 `data/quiz.js` (71行)
- 改模板 → `index.html` (114行, ~5K)

## 关键设计决策

- **零构建/零依赖** — 故意为之，浏览器 file:// 直接打开即可运行
- **JS 全局变量桥接** — `window.CARDS`/`window.QUIZZES` 跨文件传递数据，避免 fetch 异步复杂度
- **CSS custom properties** — 设计 token 在 `:root` 中定义，支持快速换肤
- **移动端限定** — max-width: 430px, `overflow: hidden`, 无响应式断点
- **科举等级 gamification** — 掌握字数映射到童生→秀才→举人→进士→探花→榜眼→状元
- **localStorage key 不变** — `w3_r` 和 `w3_s`，保证向后兼容

`docs/output/` 中的结构化数据 (content-words.ts, function-words.ts, new-words-only.json) 是更完整的词汇数据集，可作为未来数据扩展的参考。
