# AI Radar Frontend — QA Regression Report (Round 2)

**Date**: 2026-05-29
**Tester**: Yan (QA Engineer)
**Type**: Regression verification of 11 fixed bugs from Round 1

---

## 1. Build Verification

| Check | Result | Details |
|-------|--------|---------|
| `npm run build` | **PASS** | Compiled successfully, TypeScript zero errors |
| Route generation | **PASS** | 24 routes generated (20 static + 4 dynamic API routes) |
| No type errors | **PASS** | Build completed without type-checking errors |

---

## 2. Regression Verification — Per Bug

### Bug #2: 缺失 API 路由 (High) → **PARTIALLY FIXED**

| Route | Exists | Returns Correct Format | Caller Matches | Result |
|-------|--------|----------------------|----------------|--------|
| `/api/recommendations/daily` | ✅ Yes | ✅ `{ products: [...] }` | Home page expects `data.products` | **PASS** |
| `/api/products/search` | ✅ Yes | ✅ `{ products: [...] }` | Compare expects `data.products` | **PASS** |
| `/api/trends/wordcloud` | ✅ Yes | ✅ `{ tags: [...] }` | Trends expects `data.tags` | **PASS** |
| `/api/trends/top20` | ✅ Yes | ⚠️ `{ products: [...], growth field }` | Trends expects `p.weekly_growth_rate` | **FAIL — 数据不匹配** |

**问题**: `/api/trends/top20` 返回 mock 数据包含 `growth: 45` 字段，但 Trends page (line 120) 读取 `p.weekly_growth_rate`。由于 mock 数据没有 `weekly_growth_rate` 字段，`Math.round(p.weekly_growth_rate * 100)` 结果为 `NaN`。

**建议修复**: 将 `/api/trends/top20` 的 mock 数据中 `growth` 改为 `weekly_growth_rate` 并确保值是小数格式（如 `0.45`）以匹配 `Math.round(p.weekly_growth_rate * 100)` 的调用。

---

### Bug #3: Watchlist 无鉴权守卫 (High) → **PASS**

ProductCard.tsx 已正确添加：
- `isAuthenticated` 状态（line 59）
- `handleWatchlistToggle` 开头检查（line 72-75）
- 未登录时 `setLoginOpen(true)` 弹出 LoginModal（line 73）
- `<LoginModal open={loginOpen} onOpenChange={setLoginOpen} />` 渲染在 Card 底部（line 152）

**注意**: `isAuthenticated` 当前初始化为 `false`，实际项目中应通过 `useAuth()` hook 或 context 获取真实状态。目前功能逻辑正确。

---

### Bug #4: i18n 未实现 (High) → **PARTIALLY FIXED**

| 检查项 | 结果 |
|--------|------|
| `next-intl` 已安装 | ✅ 存在于 `node_modules/` |
| `LanguageSwitcher` 组件已创建 | ✅ 存在于 `LanguageSwitcher.tsx`，正确导出 |
| Navbar 已集成 `LanguageSwitcher` | ✅ 在 Actions 区域渲染（line 55） |
| 实际翻译系统实现 | ❌ 无 `i18n.ts` 配置文件、无 `messages/` 翻译文件、无 `middleware.ts` 路由、所有 UI 文本仍硬编码英文 |

**结论**: 语言切换 UI 组件已添加，但完整 i18n 系统（翻译文件、Provider、路由中间件、文本替换）未实现。当前 LanguageSwitcher 的 `setLang` 仅改变本地 state，不影响页面语言。

---

### Bug #5: `any[]` 类型滥用 (Medium) → **PASS**

| 页面 | 修复前 | 修复后 | 结果 |
|------|--------|--------|------|
| `discover/page.tsx` | `useState<any[]>` | `useState<Product[]>` (Product = Database Row) | **PASS** |
| `home/page.tsx` | `useState<any[]>` (×2) | `useState<Product[]>` (×2) | **PASS** |
| `watchlist/page.tsx` | `useState<any[]>` | `useState<Product[]>` | **PASS** |
| `compare/page.tsx` | `useState<any[]>` (×2) | `useState<Product[]>` (×2) | **PASS** |
| `trends/page.tsx` | `useState<any[]>` (×2) | `WordTag[]` + `Database Row[]` | **PASS** |

**残余问题**: Compare page `addProduct` 函数参数仍为 `product: any`（line 32），应改为 `Product`。

---

### Bug #6: 无错误 UI (Medium) → **PASS**

| 页面 | 错误状态 | 错误 UI 组件 | 重试按钮 | 结果 |
|------|----------|-------------|---------|------|
| `discover/page.tsx` | ✅ `error` state | ✅ AlertCard with icon | ✅ `fetchProducts()` | **PASS** |
| `home/page.tsx` | ✅ `error` state | ✅ AlertCard with icon | ✅ Retry | **PASS** |
| `watchlist/page.tsx` | ✅ `error` state | ✅ AlertCard with icon | ❌ 无重试按钮 | **PARTIAL** |

Watchlist 页面有 error state 和错误提示 UI，但缺少重试按钮。

---

### Bug #7: Navbar 活跃链接匹配 (Medium) → **PASS**

- Desktop nav (line 44): `pathname === link.href || pathname.startsWith(link.href + '/')`
- Mobile nav (line 82): 同样使用 `startsWith`

**PASS** — 嵌套路由如 `/discover/slug` 现在能正确高亮 "Discover" 链接。

---

### Bug #9: Discover filterOpen 状态 (Medium) → **PASS**

- Aside className (line 60): `` `w-full lg:w-64 shrink-0 ${filterOpen ? 'block' : 'hidden lg:block'}` ``
- 移动端筛选按钮（line 149）: 正确切换 `filterOpen`
- 侧边栏内关闭按钮（line 78-80）: 正确设置 `filterOpen(false)`

**PASS** — 移动端筛选侧边栏通过 className 控制显隐，默认隐藏，点击 Filters 按钮显示，内部关闭按钮隐藏。

---

### Bug #10: alert() 注册成功提示 (Low) → **PASS**

RegisterModal.tsx 已改为：
- `success` 状态（line 35）
- 注册成功后设置 `setSuccess(true)`（line 62）
- 条件渲染 success Dialog（line 77-96）：使用 shadcn Dialog + CheckCircle icon + Card + Button，替代原生 `alert()`

**PASS**

---

### Bug #11: LanguageSwitcher 文件名误导 (Low) → **PASS**

`LanguageSwitcher.tsx` 现在同时导出：
- `ThemeToggle`（原功能）
- `LanguageSwitcher`（新组件，含 Languages icon + DropdownMenu with English/中文选项）

Navbar 同时 import 两者（line 10）：`import { ThemeToggle, LanguageSwitcher } from './LanguageSwitcher'`

**PASS** — 虽然文件名仍为 `LanguageSwitcher.tsx`，但已包含两个组件的导出，不再误导。

---

### Bug #12: ProductCard name 空字符串边界 (Low) → **PASS**

Line 98: `` {(name || '?').charAt(0).toUpperCase()} ``

**PASS** — 空字符串、null、undefined 均有安全 fallback。

---

### 额外修复验证

| 修复项 | 结果 | 详情 |
|--------|------|------|
| ProductCard props 适配 `string \| null` | **PASS** | `description: string \| null`, `category: string \| null`, `pricing_model: ... \| null`，所有使用处有 fallback |
| `github_stars` 添加到 Supabase types | **PASS** | types.ts line 53: `github_stars: number \| null` |
| Trends `p.growth` → `p.weekly_growth_rate` | **PARTIAL** | 页面侧已修改，但 API mock 数据仍用 `growth` 字段，**数据不匹配** |
| `npm run build` 通过 | **PASS** | 24 路由生成，TypeScript 零错误 |

---

## 3. 回归引入的新问题

| # | 严重度 | 问题 | 描述 |
|---|--------|------|------|
| R1 | 中 | Trends API 数据不匹配 | `/api/trends/top20` mock 数据用 `growth: number` 但 Trends page 读 `weekly_growth_rate`，导致增长百分比显示 `NaN%` |
| R2 | 低 | Watchlist error 无重试 | watchlist/page.tsx 有 error state 和 UI 但无重试按钮 |
| R3 | 低 | Compare addProduct 参数仍为 any | compare/page.tsx line 32: `addProduct` 函数参数仍为 `any` |

---

## 4. 回归结果汇总

| Bug | 原始严重度 | 修复状态 | 验证结果 |
|-----|-----------|---------|---------|
| #2 缺失 API 路由 | 高 | 4 条路由已创建 | ⚠️ 1 条数据不匹配 |
| #3 Watchlist 鉴权 | 高 | 已添加 auth 检查 | ✅ PASS |
| #4 i18n 未实现 | 高 | 组件已创建，系统未完整实现 | ⚠️ 部分通过 |
| #5 any[] 滥用 | 中 | useState 全部替换 | ✅ PASS（残余 1 处） |
| #6 无错误 UI | 中 | 已添加 error state + UI | ✅ PASS |
| #7 Navbar 匹配 | 中 | 改用 startsWith | ✅ PASS |
| #9 filterOpen | 中 | className 控制显隐 | ✅ PASS |
| #10 alert() | 低 | 改为 Dialog 组件 | ✅ PASS |
| #11 文件名误导 | 低 | 双导出 | ✅ PASS |
| #12 name 边界 | 低 | null-safe + uppercase | ✅ PASS |
| 额外: github_stars | — | 已添加到 types | ✅ PASS |
| 额外: trends growth | — | 页面已改，API 未同步 | ⚠️ 不匹配 |
| 额外: ProductCard props | — | 已适配 null 类型 | ✅ PASS |

---

## 5. 总体评价

| 指标 | 值 |
|------|-----|
| 修复验证通过率 | **82%** (9/11 完全通过) |
| 部分通过 | 2 (Bug #2 API 数据不匹配, Bug #4 i18n 系统不完整) |
| 回归引入新问题 | 3 (1 中, 2 低) |
| 剩余遗留 | Bug #1（无测试文件）仍待处理 |

### 待修复项（按优先级）

1. **修复 `/api/trends/top20` mock 数据** — 将 `growth` 改为 `weekly_growth_rate`，值格式从 `45` 改为 `0.45` 以匹配页面 `Math.round(p.weekly_growth_rate * 100)` 计算
2. **完成 i18n 系统实现** — 添加 `i18n.ts`、`messages/` 翻译文件、`middleware.ts`、`NextIntlProvider`，替换所有硬编码英文文本
3. **Watchlist error UI 添加重试按钮**
4. **Compare `addProduct` 参数类型改为 `Product`**
