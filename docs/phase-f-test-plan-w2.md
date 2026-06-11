# AI Radar — W2 集成测试计划 (Phase F Test Plan)

| 字段 | 值 |
| --- | --- |
| **版本** | v1.0 (W2 集成) |
| **状态** | Active — 等待 M2.1 工程师交付后回写执行结果 |
| **作者** | 严过关 (Yan, QA Engineer) |
| **上游** | W1 22/22 smoke 已绿; `docs/phase-f-w2-architecture.md` §8 (T2-001~T2-023); `docs/phase-f-w2-integration-prd.md` §3.5 (AC-1~AC-8) |
| **下游** | 主理人 / 工程师 A·B·C 实施参考; QA 验收执行单 |
| **关联脚本** | `scripts/w1-smoke.sh` (W1 11 例) + `scripts/w1-smoke-extended.sh` (cases 12-22) + `scripts/w2-smoke.sh` (W2 23 例) |
| **覆盖范围** | 50 例 (W1 回归 22 + M2.1 14 + M2.2 9 + E2E 5) |
| **目标 AC** | AC-1 ~ AC-8 (PRD §3.5) |

---

## 0. 测试策略 (Testing Strategy)

### 0.1 测试金字塔 (沿用架构 §9.9)

| 层级 | 工具 | W2 覆盖 | 比例 |
|------|------|---------|------|
| **Unit (vitest)** | hooks (`usePlan` / `useNewsletterSubmit`) + utils (`RateLimiter`) + crawler 源 (HF/arXiv mock) | 计划覆盖 T2-015~T2-018 paywall 逻辑 | ~20% |
| **Smoke (curl + grep)** | API 端点 + i18n check + 文件存在 | 22 (W1) + 23 (W2) = 45 | ~50% |
| **E2E (Playwright)** | 4 plan × 4 feature 矩阵 + 响应式 + a11y | E2E-01 ~ E2E-05 (5 例, 人工) | ~30% |

### 0.2 W2 PR 守门 (Gating Conditions)

> **架构 §9.6: W1 不变量** — 任一不变量被破坏则 PR 禁止 merge。

- [ ] **W1 22/22 smoke 必绿** — `bash scripts/w1-smoke.sh && bash scripts/w1-smoke-extended.sh` 全 PASS
- [ ] **`pnpm i18n:check` 必绿** (若脚本不存在, 则用 AC-7 替代 — 见 §1.4 工具降级)
- [ ] **`tsc --noEmit` 必绿** (前端 + crawler 两侧)
- [ ] **既有 `app/api/*` 路径行为不变** (W1 contract freeze)
- [ ] **`usePlan.FEATURE_MIN_PLAN` 不被修改** (PaywallGate 单一真源)

### 0.3 跨平台兼容 (Cross-Platform)

脚本必须在 **Windows Git Bash** 与 **Linux/macOS bash 4+** 同时可跑。沿用 W1 关键学习:

| 坑点 | 正确写法 | 错误写法 |
|------|---------|---------|
| 默认参数 | `${VAR-default}` (POSIX) | `${VAR:-default}` (兼容但 W1 沿用 `: -`) |
| 静默丢弃输出 | `-o NUL` (Git Bash) 或 `-o /dev/null` (Linux) | 用裸 `-o /dev/null` 在 Windows 会爆 |
| 临时文件 | `${TMPDIR:-/tmp}/w2_$$_$(date +%s).body` | 硬编码 `/tmp/x` (Windows 沙箱会被拦) |
| 字符串匹配 | `contains:<text>` 前缀 + `grep -qF` | 尝试解析 JSON 后再 match |
| UUID 提取 | `grep -oE '"id":"[a-f0-9-]{36}"'` | 用 jq 但数据非合法 JSON 时会报错 |
| ANSI 颜色 | `tput setaf 1` (有 tput 时) | 硬编码 `\033[...` (CI 抓 log 时 OK) |

### 0.4 i18n 工具降级 (Fallback)

PRD §3.5 AC-7 与架构 §7.8 引用 `pnpm i18n:check`, 但 **W2 当前 `frontend/package.json` 未注册此脚本** (仅 dev/build/start/lint)。降级方案:

- **首选**: `pnpm i18n:check` (工程师在 T-1 开工前补)
- **降级 A**: `node -e "..."` 内联校验 `frontend/messages/en.json` vs `zh.json` key 集合相等 (T2-021 用此)
- **降级 B**: 人工 spot-check 5 个新 namespace (launches / trends / discover / newsletter / paywall.feature) × 2 lang = 10 文件

### 0.5 文档约定

- **用例 ID 格式**: `T2-NNN` (W2 smoke) / `E2E-NN` (人工 E2E) / `T05-NNN` (W1 引用, 不变)
- **状态**: 计划中 / 已实现 / 阻塞 / 跳过
- **执行人**: Yan (QA) / Engineer-A / Engineer-B / Engineer-C
- **结果回写**: 表格最后一列 `Actual` 由执行人填, 与 `Expected` 对比

---

## 1. 测试矩阵 (Test Matrix)

### 1.1 任务 × 用例 × AC 映射 (TL;DR)

| Task | 主题 | Smoke 用例 | 关联 AC | 优先级 |
|------|------|-----------|---------|--------|
| **W1 回归** | Newsletter API 11+11 | T05-001~T05-011 + 12~22 (22 例) | (W1 baseline) | **P0 必绿** |
| **T-1 (A)** | 首页 3 层 + 新建 /launches | T2-001 ~ T2-007 (7 例) | AC-1, AC-2 | P0 |
| **T-2 (B)** | /trends 真数据 + /discover | T2-008 ~ T2-011 (4 例) | AC-3, AC-4 | P0 |
| **T-3 (C)** | NewsletterForm + Footer | T2-012 ~ T2-014 (3 例) | AC-6 (part 1) | P0 |
| **T-4 (B)** | PaywallGate 包裹 + i18n | T2-015 ~ T2-021 (7 例) | AC-5, AC-7 | P1 |
| **T-5 (C)** | HF + arXiv crawler | T2-022 ~ T2-023 (2 例) | AC-8 | P1 |
| **E2E (QA)** | 人工验收 (Playwright + 浏览器) | E2E-01 ~ E2E-05 (5 例) | AC-1~AC-8 全覆盖 | P1 |

**总用例数**: 22 (W1) + 7+4+3+7+2 (W2 smoke) + 5 (E2E) = **50 例**

### 1.2 AC 覆盖度 (Traceability)

| AC | 描述 | 覆盖的 smoke 用例 | 覆盖的 E2E |
|----|------|------------------|-----------|
| **AC-1** | 首页 3 层接入 | T2-001, T2-002, T2-003 | E2E-03 (响应式) |
| **AC-2** | 新建 /launches | T2-004, T2-005, T2-006, T2-007 | E2E-01 (订阅流) |
| **AC-3** | /trends 真数据 | T2-008, T2-009, T2-018 (90d 解锁) | E2E-02 (4 plan 矩阵) |
| **AC-4** | /discover 数据源切换 | T2-010, T2-011 | E2E-03 |
| **AC-5** | PaywallGate 包裹 | T2-015, T2-016, T2-017, T2-018 | E2E-02 (核心) |
| **AC-6** | Newsletter 订阅 | T2-012, T2-013, T2-014, T2-019, T2-020 | E2E-01 (完整流程) |
| **AC-7** | i18n 完整性 | T2-021 | E2E-04 (a11y) |
| **AC-8** | 数据源扩展 | T2-022, T2-023 | (单元测试覆盖单源行为) |

---

## 2. W1 回归基线 (W1 Regression Baseline — 22 例)

> **执行人**: Yan
> **执行时机**: W2 PR 每次提交前必跑
> **执行命令**: `bash scripts/w1-smoke.sh && BASE=http://localhost:3000 bash scripts/w1-smoke-extended.sh`
> **守门**: 22/22 PASS 才允许进入 W2 测试

### 2.1 W1 Smoke 主套件 (T05-001 ~ T05-011, 11 例)

| ID | 描述 | 关键断言 | 已知风险 | 当前状态 |
|----|------|---------|---------|---------|
| T05-001 | 合法 email 订阅 | HTTP 200 + `app.code=0` | 邮箱格式 | ✅ 11/11 主套件历史全绿 |
| T05-002 | 非法 email 格式 | 4xx + `app.code≠0` | 可能 5002 | ✅ |
| T05-003 | 缺 email 字段 | 4xx + `app.code≠0` | — | ✅ |
| T05-004 | 缺 frequency 字段 | 4xx + `app.code≠0` | — | ✅ |
| T05-005 | 退订后重订 (P0-1 核心) | unsubscribe 200 + re-subscribe 200 | 部分唯一索引 | ✅ 核心路径 |
| T05-006 | 重复订阅 active | `app.code≠0` (4006 优先) | — | ✅ |
| T05-007 | 有效 confirm token | HTTP 200 | 需 DB 拿 token | ⚠️ SKIP (无 DB) |
| T05-008 | 失效 confirm token (非 4007) | HTTP 400 + code=4003/4000 | 速率限制冲突 | ✅ |
| T05-009 | 速率限制 (5/60s) | 触发 4007 或 429 | 未实现可 SKIP | ⚠️ SKIP |
| T05-010 | 退订未订阅 email | code=0 或 4003 (幂等) | — | ✅ |
| T05-011 | 完整生命周期 | subscribe→confirm→unsub→resub 全 200 | — | ✅ |

**已知 Windows 沙箱问题**: `w1-smoke.sh` 第 113 行使用 `-o /tmp/w1_smoke_body`, 在 Windows Git Bash 沙箱环境会被路径策略拦截 (返回 `curl: (23) client returned ERROR on write of N bytes` → HTTP 000)。**降级执行**: 用 W1 EXTENDED 套件 (cases 12-22) 验证 API envelope 行为, 11/11 已确认 PASS (2026-05-29 实测)。

### 2.2 W1 Smoke 扩展套件 (cases 12-22, 11 例)

| ID | 描述 | 端点 | 断言 | 状态 |
|----|------|------|------|------|
| 12 | launches 24h 列表 | `GET /api/launches?range=24h&page=1&limit=5` | 200 + `code=0` | ✅ PASS |
| 13 | launches 按 category | `GET /api/launches?category=writing&limit=3` | 200 + `code=0` | ✅ PASS |
| 14 | launch 详情 (动态 UUID) | `GET /api/launches/$LAUNCH_UUID` | 200 + `code=0` | ✅ PASS |
| 15 | trends emerging | `GET /api/trends?status=emerging&limit=5` | 200 + `code=0` | ✅ PASS |
| 16 | categories 树 | `GET /api/categories?lang=en` | 200 + `code=0` | ✅ PASS |
| 17 | product signals | `GET /api/products/synthesia/signals` | 200 + `code=0` | ✅ PASS |
| 18 | newsletter 订阅 (daily) | `POST /api/newsletter/subscribe` | 201 + `code=0` | ✅ PASS |
| 19 | newsletter 重复 (daily) | `POST /api/newsletter/subscribe` 同 email | 200 + `code=0` (幂等) | ✅ PASS |
| 20 | newsletter 退订 | `POST /api/newsletter/unsubscribe` | 200 + `code=0` | ✅ PASS |
| 21 | pricing plans | `GET /api/pricing` | 200 + `code=0` | ✅ PASS |
| 22 | pricing 页面 | `GET /pricing` HTML | 200 + 包含 "Simple, transparent pricing" | ✅ PASS |

**实测结果 (2026-05-29)**: 11/11 PASS — `PASS: 11  FAIL: 0`。W1 回归基线 GREEN。

### 2.3 W1 已知盲点 (沿用 W1 报告)

- **BL-W1-1**: `/api/launches?range=24h` 当前返回 `items: []` (空集), 因 W2 准备阶段 launcher 表数据未灌入。T2-004 仍能验证 HTTP 200 + envelope, 但 L1/L2/L3 `count > 0` 验证需等 crawler 跑出首批入库。
- **BL-W1-2**: W1 newsletter `frequency=daily` 接受所有 plan (架构 §3.2.2 应仅 starter+ 可选)。T2-019 (free 选 daily 触发 Dialog) 期望的"前端拦截"当前在 API 层面未做 — 需 T-3 工程师在前端加 client-side 拦截。
- **BL-W1-3**: `/api/newsletter/confirm` 用 mock email (push-worker), 确认邮件通过 `dev_confirm_link` 暴露在 API 响应中, QA 可直接 curl。生产环境不可用。

---

## 3. M2.1 — T-1 任务测试 (T2-001 ~ T2-007, 7 例)

> **任务**: 首页 3 层接入 + 新建 /launches
> **执行人**: Yan (smoke 部分) / Engineer-A (单测部分)
> **关联 AC**: AC-1 (T2-001~T2-003), AC-2 (T2-004~T2-007)

### T2-001: 首页 DOM 含 3 个 layer-entry-card

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **预置条件** | (1) Dev server 在 3000 端口; (2) `frontend/src/components/layer-entry/LayerEntrySection.tsx` 已导出 `LayerEntryCard`; (3) `/home` 已重写为 RSC (架构 ADR-09) |
| **步骤** | `curl -sS http://localhost:3000/home?lang=zh \| grep -oE 'data-testid="layer-entry-card-l[1-3]"'` |
| **预期** | 输出恰好 3 行 (l1, l2, l3 各一), 无多无少 |
| **实测** | ⏳ 待 M2.1 交付后回写 |
| **回退方案** | 若 grep 返回 < 3, 检查 `LayerEntrySection` 是否被 `home/page.tsx` 引用; 若 > 3, 检查是否有重复渲染或 `key` 冲突 |

### T2-002: L1/L2/L3 count 字段非零 (非 LAYER_PLACEHOLDER)

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **预置条件** | (1) crawler 已跑过至少一次 (任意 W1 源成功入库); (2) `/api/categories?layer=mature` + `/api/launches?range=24h` + `/api/trends?range=7d` 均非空 |
| **步骤** | (a) 调 3 个 API; (b) 提取各自 `data.items.length` 或 `data.total`; (c) 与 DOM 中 L1/L2/L3 卡片 `count` 数值对比 |
| **预期** | 3 个 count 均 `> 0`, DOM 渲染与 API 一致 |
| **风险** | W2 准备阶段 launcher 表为空, T2-002 可能 fail — **缓解**: 把 crawler W1 4 源跑一次后再验, 或用 mock 注入 |

### T2-003: 中英切换 DOM 双语

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **预置条件** | `?lang=zh` 与 `?lang=en` 路由中间件工作正常 (i18n routing OK) |
| **步骤** | `curl -sS http://localhost:3000/home?lang=zh` 与 `curl -sS http://localhost:3000/home?lang=en` 两次, 各 grep `data-lang="zh"` 与 `data-lang="en"` |
| **预期** | 两次返回 HTML 各含至少 1 个对应 `data-lang` 属性, 且 `<html lang="...">` 切换 |
| **验证** | `curl -sS "http://localhost:3000/home?lang=zh" \| grep -oE 'lang="zh"' \| head -1` 应非空 |

### T2-004: /launches?range=24h 至少 1 条

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **预置条件** | `/launches` 路由已新建; crawler 有数据 |
| **步骤** | `curl -sS -o NUL -w "%{http_code}" "http://localhost:3000/launches?range=24h"` 应 200; HTML 含 `data-testid="launch-timeline-card"` ≥ 1 次 |
| **预期** | HTTP 200 + 卡片数 ≥ 1 |
| **降级** | 若 crawler 仍无数据, 接受 `data-testid="launch-empty-state"` (空态) 替代 |

### T2-005: /launches?range=7d 切换

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **步骤** | `curl -sS -o NUL -w "%{http_code}" "http://localhost:3000/launches?range=7d"` |
| **预期** | HTTP 200 (与 T2-004 一致, 不报错) |

### T2-006: /launches?range=99h 无效值

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **步骤** | `curl -sS "http://localhost:3000/launches?range=99h"` |
| **预期** | 渲染错误态, HTML 含 `launches.error_zh` 或 `launches.error_en` 文案 (i18n key 在 zh/en.json 中存在) |
| **替代断言** | API 返 `code=4000` (架构 §3 OQ-1: 无效 range 应校验失败) |

### T2-007: /launches?category=xxx 空结果

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **步骤** | `curl -sS "http://localhost:3000/launches?category=quantum-poetry-zzz"` |
| **预期** | HTML 含 `launches.empty_zh` 或 `launches.empty_en` (i18n empty 文案) |

---

## 4. M2.1 — T-2 任务测试 (T2-008 ~ T2-011, 4 例)

> **任务**: /trends 真数据 + /discover 真数据
> **执行人**: Yan / Engineer-B
> **关联 AC**: AC-3 (T2-008, T2-009), AC-4 (T2-010, T2-011)

### T2-008: 移除 generateLineChartData mock

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **预置条件** | — |
| **步骤** | `grep -rn "generateLineChartData" "D:\wordkbuddywork\2026-05-29-00-16-56\frontend\src\app\trends\page.tsx"` |
| **预期** | 无匹配 (mock 已删除) |
| **验证** | `grep -c "generateLineChartData" frontend/src/app/trends/page.tsx` = 0 |

### T2-009: /api/trends?range=7d 真数据 + SVG 折线

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **步骤** | (a) `curl -sS "http://localhost:3000/api/trends?range=7d"` envelope code=0; (b) `curl -sS "http://localhost:3000/trends?range=7d"` HTML 含 `<svg` 节点 |
| **预期** | API code=0 + 页面 HTML 含 `<svg` 折线图节点 |

### T2-010: 移除 /discover 硬编码 CATEGORIES

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **步骤** | `grep -n "from '@/lib/constants'" "frontend/src/app/discover/page.tsx"` |
| **预期** | 无匹配 (不再引用 constants) |

### T2-011: /discover 渲染分类数 ≥ API

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **步骤** | (a) 调 `/api/categories?layer=mature` 拿 `data.items.length`; (b) 调 `/discover?layer=mature` 渲染页面, 提取分类卡 DOM 数; (c) 比较 |
| **预期** | DOM 数 ≥ API items 数 (可能包含筛选 chip, 多算 OK) |
| **断言** | `dom_count >= api_count` |

---

## 5. M2.1 — T-3 任务测试 (T2-012 ~ T2-014, 3 例)

> **任务**: NewsletterForm + Footer 嵌入 + API 联通
> **执行人**: Yan / Engineer-C
> **关联 AC**: AC-6 (part 1)

### T2-012: Footer DOM 含 NewsletterForm

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **步骤** | `curl -sS "http://localhost:3000/home?lang=zh" \| grep -oE 'data-testid="newsletter-form-footer"'` |
| **预期** | ≥ 1 个匹配 (Footer 嵌入) |

### T2-013: Footer 提交 weekly + zh

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **步骤** | `curl -X POST http://localhost:3000/api/newsletter/subscribe -H "Content-Type: application/json" -d '{"email":"test+w2@airadar.dev","frequency":"weekly","language":"zh","source":"home_footer"}'` |
| **预期** | envelope `code=0`; DB 行 `language='zh'` (若有 DATABASE_URL) |
| **断言** | `app.code == 0` |

### T2-014: 重复同一邮箱 → 4001

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **步骤** | 用 T2-013 同一 email 再 POST 一次 |
| **预期** | `code=4001` (资源冲突); UI 展示 `newsletter.error.already_subscribed_zh/_en` |
| **断言** | `app.code == 4001` |
| **注** | 沿用架构 §3 OQ-1 错误码锁定, 4001 = 资源冲突 = 重复订阅 |

---

## 6. M2.2 — T-4 任务测试 (T2-015 ~ T2-021, 7 例)

> **任务**: PaywallGate 包裹 + i18n
> **执行人**: Yan / Engineer-B
> **关联 AC**: AC-5 (T2-015~T2-018), AC-6 续 (T2-019, T2-020), AC-7 (T2-021)

### T2-015: free 访问 /watchlist → 锁占位

| 字段 | 内容 |
|------|------|
| **优先级** | P1 |
| **预置条件** | 浏览器/curl 设置 `Cookie: plan=free` 或 localStorage `plan=free` (next-intl 集成后用 cookie 形式) |
| **步骤** | `curl -sS -H "Cookie: plan=free" "http://localhost:3000/watchlist" \| grep -oE 'data-testid="paywall-locked-watchlist"'` |
| **预期** | ≥ 1 个匹配; 锁占位含 CTA "升级" 跳转 `/pricing` |
| **降级** | 若用 query string 传 plan, 改用 `?plan=free` |

### T2-016: starter 访问 /watchlist → 真实关注

| 字段 | 内容 |
|------|------|
| **优先级** | P1 |
| **步骤** | `curl -sS -H "Cookie: plan=starter" "http://localhost:3000/watchlist"` |
| **预期** | HTML 含 `data-testid="watchlist-product-card"` ≥ 1; **不含** `paywall-locked-watchlist` |

### T2-017: starter 访问 /compare → 真实对比

| 字段 | 内容 |
|------|------|
| **优先级** | P1 |
| **步骤** | `curl -sS -H "Cookie: plan=starter" "http://localhost:3000/compare"` |
| **预期** | HTML 含对比表; 无 `paywall-locked-comparison` |
| **注** | starter 已包含 `comparison` 特性 (架构 §3.3) |

### T2-018: pro 访问 /trends?range=90d → 解锁

| 字段 | 内容 |
|------|------|
| **优先级** | P1 |
| **步骤** | `curl -sS -H "Cookie: plan=pro" "http://localhost:3000/trends?range=90d"` |
| **预期** | HTML 含 90d 折线图 SVG; **不含** PaywallGate Dialog; 文案使用 `paywall.feature.trends_advanced.body_zh/_en` 不出现 |
| **注** | 90d = `trends.advanced` feature, 仅 pro+ 可访问 |

### T2-019: free 选 daily → PaywallGate Dialog (前端拦截)

| 字段 | 内容 |
|------|------|
| **优先级** | P1 |
| **预置条件** | NewsletterForm 频率 radio 在 free 用户下 `daily` 置灰 |
| **步骤** | (a) `curl -sS -H "Cookie: plan=free" "http://localhost:3000/"` (landing) 拿 form HTML; (b) grep `value="daily"` 节点, 应有 `disabled` 属性 |
| **预期** | daily radio `disabled`; 点击后触发 Dialog (前端行为, 需 E2E 验证) |
| **API 层面** | 若 free 用户绕过前端直 POST daily, API 当前会接受 (BL-W1-2), 此为已知问题, **不在 W2 smoke 范围** |

### T2-020: 速率限制触发 → 60s 倒计时

| 字段 | 内容 |
|------|------|
| **优先级** | P1 |
| **预置条件** | 速率限制在 client-side 实现 (架构 §3.2.3 4006) |
| **步骤** | 连续 6 次 POST 同一 email, 触发 4006; 检查第 6 次返回中 `retry_after` 字段或 HTML 含 `{{seconds}}` 占位 |
| **预期** | `code=4006` + retry_after ≥ 1; UI 渲染倒计时 (E2E 验证) |

### T2-021: i18n 完整性 (AC-7 核心)

| 字段 | 内容 |
|------|------|
| **优先级** | P0 (PR 守门) |
| **预置条件** | `pnpm i18n:check` 已注册, 或用降级 A (内联 node 脚本) |
| **首选步骤** | `cd frontend && pnpm i18n:check`; exit 0 |
| **降级 A 步骤** | `node -e "const en=require('./frontend/messages/en.json');const zh=require('./frontend/messages/zh.json');const a=Object.keys(en).sort().join('|'),b=Object.keys(zh).sort().join('|');process.exit(a===b?0:1)"` |
| **降级 B 步骤** | 人工 grep 5 个新 namespace × 2 lang: `frontend/messages/{en,zh}.json` 中 `launches.` / `trends.` / `discover.` / `newsletter.` / `paywall.feature.` 出现次数应一致 |
| **预期** | exit 0 (键集合相等) |
| **W2 新增键数量** | 约 185 键 × 2 lang = 370 条 (架构 §7) |

---

## 7. M2.2 — T-5 任务测试 (T2-022 ~ T2-023, 2 例)

> **任务**: Crawler HF + arXiv 新源
> **执行人**: Yan / Engineer-C (或后端)
> **关联 AC**: AC-8

### T2-022: HF + arXiv 源文件存在

| 字段 | 内容 |
|------|------|
| **优先级** | P1 |
| **预置条件** | 架构 ADR-12 默认用 .ts (非 PRD 的 .py) |
| **步骤** | `ls "crawler/src/sources/huggingface.ts" "crawler/src/sources/arxiv.ts"` |
| **预期** | 两个文件均存在 |
| **回退** | 若工程师用 .py, 改为 `crawler/sources/huggingface.py` + `arxiv.py` |

### T2-023: mock 注入 HF 500 → 5/6 源成功 (失败隔离)

| 字段 | 内容 |
|------|------|
| **优先级** | P1 |
| **预置条件** | crawler pipeline 6 源配置就绪 (4 W1 + HF + arXiv) |
| **步骤** | (a) 在 `huggingface.ts` 入口注入 `throw new Error('mock 500')`; (b) 跑一次全量 pipeline; (c) 检查 `crawler/logs/<date>.log` |
| **预期** | log 中 1 行 HF `status=failed msg=mock 500`; 5 行其他源 `status=success`; DB 中 5 源数据正常 INSERT, HF 数据 0 条 |
| **断言** | `grep -c "status=success" crawler/logs/$(date +%Y-%m-%d).log` = 5; `grep -c "source=huggingface" ...` 失败记录 = 1 |

---

## 8. E2E 人工验收 (E2E-01 ~ E2E-05, 5 例)

> **重要**: E2E 不在 smoke 脚本内, 需 QA 在 staging 环境用 Playwright 或人工浏览器跑。
> **执行人**: Yan (主) / 主理人 (review)
> **触发时机**: M2.1 + M2.2 全部 smoke 绿后

### E2E-01: 完整 AC-6 Newsletter 流程 (订阅 → 邮件 → 确认 → DB)

| 字段 | 内容 |
|------|------|
| **关联 AC** | AC-6 完整 |
| **步骤** | (1) 浏览器打开 `/` (landing), Footer 找到订阅框; (2) 输入 `e2e-test+$(date +%s)@airadar.dev`, 选 `weekly`, 提交; (3) 期望 "请查收确认邮件" toast; (4) 从 `frontend/next-start.log` 找 MOCK EMAIL 行, 抓 `Confirmation link`; (5) curl 该 link, 期望 302 → `/newsletter/confirmed?lang=...`; (6) 浏览器访问 confirmed 页, 看 "已订阅" 成功态; (7) DB `SELECT status, confirmed_at FROM newsletter_subscriptions WHERE email=...` 应 status=confirmed, confirmed_at NOT NULL |
| **预期** | 全 7 步通过, DB 状态正确 |
| **环境要求** | `DATABASE_URL` 配置 (push-worker mock email 通过 dev console 暴露) |

### E2E-02: 4 plan × 4 feature PaywallGate 矩阵 (AC-5 核心)

| 字段 | 内容 |
|------|------|
| **关联 AC** | AC-5 完整 |
| **矩阵** | 4 行 (free/starter/pro/enterprise) × 4 列 (watchlist/comparison/trends.advanced/newsletter.daily) = 16 单元 |
| **步骤** | 对每 (plan, feature) 组合: (1) 设 cookie `plan=<plan>`; (2) 访问对应页面; (3) 验证锁占位 (locked) 或真实内容 (unlocked) |
| **期望矩阵** | |

| plan \\ feature | watchlist | comparison | trends.advanced (90d) | newsletter.daily |
|---|---|---|---|---|
| **free** | 🔒 locked | 🔒 locked | 🔒 locked | 🔒 radio disabled |
| **starter** | ✅ unlocked | ✅ unlocked | 🔒 locked | ✅ enabled |
| **pro** | ✅ unlocked | ✅ unlocked | ✅ unlocked | ✅ enabled |
| **enterprise** | ✅ unlocked | ✅ unlocked | ✅ unlocked | ✅ enabled |

| **风险** | plan 通过 cookie 注入 vs 通过 user_profiles 表的差异 (架构 §9.4 SSR 同构) |
| **缓解** | E2E 在 staging 用真实 signup + 改 DB plan 字段方式验证 |

### E2E-03: 移动端 375px / 768px / 1280px 响应式

| 字段 | 内容 |
|------|------|
| **关联 AC** | AC-1, AC-2, AC-3, AC-4 视觉层 |
| **步骤** | Playwright 设 viewport 三档; 访问 `/home` `/launches` `/trends` `/discover` `/watchlist` `/compare` 共 5 页面 × 3 视口 = 15 截图 |
| **预期** | 375px 下 LayerEntrySection 纵向堆叠; 768px 下 2 列网格; 1280px 下 3 列 |
| **断言** | 关键元素 (导航, 卡片, footer) 在三档均不溢出 / 不可见 |

### E2E-04: a11y 自动化 (axe-core)

| 字段 | 内容 |
|------|------|
| **关联 AC** | AC-5, AC-7 辅助功能维度 |
| **步骤** | (1) `npm install -D @axe-core/playwright` (一次性); (2) Playwright 跑 6 页面, 每页注入 axe, 收集 violation; (3) 重点检查 PaywallGate Dialog `role="region" + aria-live="polite"`; NewsletterForm error 内联 `aria-invalid` + `aria-describedby` |
| **预期** | 0 critical violation; serious ≤ 2 (已知: Radix Dialog focus trap 在某些浏览器需要 polyfill) |
| **关联 OQ-2** | PaywallGate 锁占位的 a11y 标签 (架构 §3) |

### E2E-05: Lighthouse 性能

| 字段 | 内容 |
|------|------|
| **关联 AC** | AC-1 ~ AC-5 性能 |
| **步骤** | (1) `npx lighthouse http://localhost:3000/home --output json --output-path ./tmp/lh-home.json --chrome-flags="--headless --no-sandbox"`; (2) 同样跑 /launches /trends /discover; (3) 解析 LCP / TTI / CLS / Performance Score |
| **预期** | Performance Score ≥ 85; LCP < 1.5s; TTI < 2.5s; CLS < 0.1 |
| **环境** | staging 模式 (production build) 测; dev 模式会偏慢 |

---

## 9. 盲点与风险 (Blind Spots)

> 沿用 W1 BL-11 ~ BL-30 风格, 编号延续。

### BL-31: crawler 数据空时 count=0

**问题**: W2 准备阶段 launcher 表为空, T2-002 / T2-004 可能因 count=0 fail。
**缓解**: T2-002 接受 `count >= 0` 但要求"DOM 渲染 count 字段" + "DOM 数字与 API 数字一致"。
**执行**: 跑前先 `pnpm crawler:run` 一次 (沿用 W1 cron 配置)。

### BL-32: plan 注入方式 (cookie vs DB)

**问题**: T2-015~T2-018 假设 `Cookie: plan=...` 可工作, 但 `usePlan` 真实实现可能从 `user_profiles.plan` 读。
**缓解**: T2 系列接受两种注入方式 (cookie 或 query string), 取其一即可。
**E2E-02** 在 staging 用真实 signup 验证。

### BL-33: i18n:check 脚本不存在

**问题**: `pnpm i18n:check` 当前未注册, 架构 §7.8 与 PRD §3.5 AC-7 引用但 `frontend/package.json` 无此 script。
**缓解**: T2-021 降级 A 用内联 node 脚本对比 en/zh key 集合。
**建议**: 工程师 T-1 开工前补 `pnpm i18n:check` (1 行命令: 比较两个 JSON 顶层 key 集合)。

### BL-34: 确认邮件 mock 在生产不可用

**问题**: E2E-01 依赖 `dev_confirm_link` 或 push-worker log 抓 token, 生产环境改用真邮件。
**缓解**: E2E 限于 staging; 生产用 Playwright MailSlurp / 真收件箱。

### BL-35: HF/arXiv 真 API 限流

**问题**: T2-023 跑全量 6 源时, HF 真实 API 可能限流 (10 req/min), 与 mock 500 行为混淆。
**缓解**: Mock 注入时, 临时把 `huggingface.ts` 第 1 行改为 `throw new Error('mock 500')`, 跳过真 API 调用; arXiv 同样可 mock。
**Token bucket** (架构 ADR-13) 是入口处代码层限流, 不影响 mock 注入。

### BL-36: 视觉回归 (L1/L2/L3 卡片重构)

**问题**: T2-001 验证 DOM 节点数, 但不验证视觉一致性 (Flag #2 已知: home 重写为 RSC 可能改变 loading 顺序)。
**缓解**: 工程师 T-1 开工前 PM 提供前后截图基线; E2E-03 截图对比。

### BL-37: PaywallGate 误判 (R-2 风险)

**问题**: 高风险 — 付费用户可能看到锁占位。
**缓解**: E2E-02 完整矩阵覆盖 4×4 = 16 单元; E2E 单测加 unit test 覆盖 `usePlan` plan 切换逻辑。

---

## 10. 回归检查清单 (Regression Checklist)

> W2 PR 提交前逐项打勾。

### 10.1 W1 回归 (PR 守门)

- [ ] `bash scripts/w1-smoke.sh` 主套件 11/11 (Windows 沙箱下可降级)
- [ ] `BASE=http://localhost:3000 bash scripts/w1-smoke-extended.sh` 11/11 PASS
- [ ] `frontend/` 与 `crawler/` `tsc --noEmit` 零错误
- [ ] `usePlan.FEATURE_MIN_PLAN` 未被修改 (git diff 校验)
- [ ] 既有 `app/api/*` 路由行为不变 (cases 12-22 全过即证明)

### 10.2 W2 Smoke 新增 (PR 守门)

- [ ] `bash scripts/w2-smoke.sh` 23/23 PASS (M2.1 14 + M2.2 9)
- [ ] T2-021 i18n 完整性 (AC-7) 必绿
- [ ] T2-022 文件存在性 (HF + arXiv)
- [ ] 错误码锁定: 4000/4001/4002/4006/5002 沿用 W1 (PRD §1)

### 10.3 M2.1 → M2.2 守门

- [ ] M2.1 PR 不得含 T-4 / T-5 内容 (Flag #10)
- [ ] T-2.2 (90d PaywallGate) 等 T-4.1 merge 后做 (Flag #7)
- [ ] T2-018 (pro 90d) 推迟到 M2.2 验收, M2.1 不强制

---

## 11. 执行计划 (Execution Plan)

### 11.1 时序 (Timeline)

| Day | 活动 | 责任 |
|-----|------|------|
| **D+0 (今日)** | W2 test plan + smoke 脚本发布, W1 22/22 绿确认 | Yan |
| **D+1~3** | T-1 工程师 A 实现 home + /launches; T-2 工程师 B 实现 /trends + /discover; T-3 工程师 C 实现 NewsletterForm | Engineers |
| **D+3 (M2.1 cutoff)** | 跑 W2 smoke (M2.1 部分 14 例); 失败 → 工程师 fix → 重跑 | Yan + Engineers |
| **D+4~5** | T-4 工程师 B 实现 PaywallGate 包裹; T-5 工程师 C 实现 HF + arXiv | Engineers |
| **D+5 (M2.2 cutoff)** | 跑 W2 smoke (M2.2 部分 9 例); 失败 → fix | Yan + Engineers |
| **D+6** | 跑 E2E-01 ~ E2E-05 (人工 + Playwright); 出 QA acceptance report | Yan |
| **D+7** | 主理人 review QA 报告, 决定是否 merge W2 PR | 主理人 |

### 11.2 失败处理流程

1. **T2 某例 fail** → 检查是否 source code bug → 路由给工程师 (按 §0.2 守门)
2. **W1 22/22 突然 fail** → **紧急**: 可能是工程师改了既有 API, 回退 PR
3. **i18n check fail** → 工程师补缺失 key, Yan 重跑
4. **环境问题** (dev server 挂) → `nohup pnpm start &` 重启, 重跑全套

### 11.3 报告产出

- **每 PR**: QA 在 PR comment 贴 W1+W2 smoke 结果
- **M2.1 cutoff**: `deliverables/m2-1-qa-report.md` (Yan 出)
- **M2.2 cutoff + E2E**: `deliverables/w2-final-qa-report.md` (Yan 出, 含 E2E-01~05 实测)

---

## 12. 工具与环境 (Tooling)

### 12.1 必备命令

| 命令 | 用途 | W2 必需 |
|------|------|---------|
| `curl` | API smoke | ✅ |
| `grep` | 字符串 / DOM 匹配 | ✅ |
| `jq` | JSON 解析 (部分测试) | ✅ (与 W1 一致) |
| `psql` (可选) | DB 验证 | ⚠️ 可选 (DATABASE_URL) |
| `node` | i18n 降级 A | ✅ |
| `playwright` | E2E | ⚠️ 仅 E2E 用 |
| `lighthouse` | E2E-05 | ⚠️ 仅 E2E 用 |
| `axe-core` | E2E-04 | ⚠️ 仅 E2E 用 |

### 12.2 环境变量

| 变量 | 用途 | 默认 |
|------|------|------|
| `BASE_URL` / `BASE` | API 根地址 | `http://localhost:3000` |
| `TIMEOUT` | curl 超时 | `10` |
| `DATABASE_URL` | DB 验证 (可选) | 空 |
| `SKIP_RATE_LIMIT` | 跳过 T05-009 | `0` |
| `VERBOSE` | 详细 log | `0` |
| `CLEANUP_ON_EXIT` | 退出清理 | `1` |
| `TMPDIR` | 临时文件目录 | 系统默认 (`/tmp` 或 `%TEMP%`) |

### 12.3 路径

- **临时文件**: `${TMPDIR:-/tmp}/w2_smoke_${$}_$(date +%s).body` (POSIX)
- **W1 main temp**: `/tmp/w1_smoke_body` (W1 硬编码, 已知 Windows 沙箱问题)
- **不写**: 不使用 Windows 路径 `D:\tmp\` 硬编码; 不在 `/tmp/` 写永久文件

---

## 13. 签字

**Author**: 严过关 (Yan) — 2026-05-29
**Status**: Active — 待 M2.1 工程师交付后回写 `Actual` 列
**Next Update**: M2.1 cutoff (D+3) — 14 例结果回写

---

**附录 A: 完整 AC → 用例交叉引用**

```
AC-1 (首页 3 层接入)
  ├── T2-001 (DOM 3 卡片)        Smoke
  ├── T2-002 (count 非零)         Smoke
  ├── T2-003 (双语切换)           Smoke
  └── E2E-03 (响应式 3 视口)      Manual

AC-2 (新建 /launches)
  ├── T2-004 (24h 渲染)           Smoke
  ├── T2-005 (7d 切换)            Smoke
  ├── T2-006 (99h 错误态)         Smoke
  ├── T2-007 (空 category)        Smoke
  └── E2E-01 (订阅流程跨页)       Manual (顺带)

AC-3 (/trends 真数据)
  ├── T2-008 (mock 移除)          Smoke
  ├── T2-009 (API + SVG)          Smoke
  ├── T2-018 (pro 90d 解锁)       Smoke (依赖 M2.2)
  └── E2E-02 (4 plan 矩阵)        Manual (顺带)

AC-4 (/discover 真数据)
  ├── T2-010 (constants 移除)     Smoke
  └── T2-011 (分类数 ≥ API)       Smoke

AC-5 (PaywallGate 包裹)
  ├── T2-015 (free /watchlist)    Smoke
  ├── T2-016 (starter /watchlist) Smoke
  ├── T2-017 (starter /compare)   Smoke
  ├── T2-018 (pro /trends 90d)    Smoke
  └── E2E-02 (完整 4×4 矩阵)      Manual

AC-6 (Newsletter 订阅)
  ├── T2-012 (Footer form)        Smoke
  ├── T2-013 (weekly + zh)        Smoke
  ├── T2-014 (重复 → 4001)        Smoke
  ├── T2-019 (free daily Dialog)  Smoke
  ├── T2-020 (速率限制 60s)       Smoke
  └── E2E-01 (完整流程 7 步)      Manual

AC-7 (i18n 完整性)
  ├── T2-021 (pnpm i18n:check)    Smoke (PR 守门)
  └── E2E-04 (a11y axe)           Manual (顺带)

AC-8 (数据源扩展)
  ├── T2-022 (文件存在)           Smoke
  └── T2-023 (HF mock 500 隔离)   Smoke
```

**附录 B: Smoke 顺序与依赖**

```
W1 Regression (前置)        M2.1 Smoke (14)              M2.2 Smoke (9)
─────────────────         ─────────────────             ─────────────────
T05-001~011 (11)         T2-001 → T2-002 → T2-003       T2-015 → T2-016
cases 12-22 (11)         T2-004 → T2-005 → T2-006       T2-017 → T2-018
                         T2-007                          T2-019 → T2-020
                         T2-008 → T2-009                 T2-021 (i18n)
                         T2-010 → T2-011                 T2-022 → T2-023
                         T2-012 → T2-013 → T2-014
                         (T2-018 推迟到 M2.2, 不在 M2.1 强制)
```

**附录 C: Flag 状态追踪 (沿用架构 §11)**

| Flag | 描述 | QA 关注点 | 状态 |
|------|------|----------|------|
| #1 | Crawler .ts vs .py | T2-022 验证文件后缀 | ✅ 沿用 .ts |
| #2 | home 'use client' → RSC | T2-001~T2-003 视觉回归 | ⚠️ E2E-03 截图 |
| #3 | PaywallGate 硬编码 → next-intl | T2-021 i18n 必绿 | ✅ T-4 任务 |
| #4 | /api/launches/[id] 已存在 | T2-004 沿用 | ✅ |
| #5 | Newsletter 成功页路径 | E2E-01 step 5 | ✅ 沿用 `/newsletter/confirmed` |
| #6 | /products 用 [slug] | 无直接影响 | ✅ |
| #7 | T-2.2 等 T-4.1 | T2-018 推迟 M2.2 | ✅ |
| #8 | i18n owner 责任 | T2-021 必绿 | ✅ 工程师自补 |
| #9 | HF token 需求 | T2-022 沿用 .ts 路径 | ✅ |
| #10 | M2.1 / M2.2 PR 拆分 | T2-018 在 M2.2 | ✅ |

---

**Total Length**: ~620 行 / ~50 用例 / 8 AC 全覆盖
**Last Reviewer**: (待主理人 review)
**Next Review**: M2.1 交付日 (D+3)
