# AI Radar 实际可用性收口概览

## 本轮目标
让 AI Radar 在 Supabase DNS/网络不稳定时仍然“实际可用”：核心页面能打开、关键 API 返回 200、首页/Launches/Trends/Discover 能展示真实结构的数据，而不是空壳或 500。

## 完成内容
- 保留 Supabase 作为优先真实数据源：数据库能通时仍读取线上数据。
- 新增本地 curated fallback 数据层：Supabase 查询失败或超时后，关键 API 自动返回可展示的 AI 产品情报数据。
- 增加 Supabase 查询短超时保护：默认 2500ms，避免页面被外部网络长时间拖死。
- 修复关键 API 从“外部网络失败即 500”变为“返回 200 + fallback 数据”。
- 保持原有 API envelope：成功仍为 `{ code: 0, data, message: 'ok' }`，前端调用方不用重写。
- 复跑 TypeScript、生产构建和生产服务 smoke，确认实际可访问。

## 关键修改文件
- `frontend/src/lib/api/fallback-data.ts`
  - 新增 categories / launches / trends fallback 数据。
  - 新增 `withSupabaseFallbackTimeout()`，Supabase 超时后自动进入 fallback。
- `frontend/src/app/api/categories/route.ts`
  - Supabase 查询失败/超时时返回 fallback categories，不再 500。
- `frontend/src/app/api/launches/route.ts`
  - Supabase 查询失败/超时时返回 fallback launches。
  - 补齐 pagination 的 `page_size` 字段，兼容前端类型。
- `frontend/src/app/api/trends/route.ts`
  - Supabase 查询失败/超时时返回 fallback trends。

## 验证结果
- `pnpm -C frontend exec tsc --noEmit`：通过。
- `pnpm -C frontend build`：通过。
- `pnpm -C frontend start -p 3000`：生产服务启动成功。

### API smoke
| Endpoint | app_code | 数据量 | 结果 |
|---|---:|---:|---|
| `/api/categories?lang=zh&include_empty=true` | 0 | total=5 | PASS |
| `/api/launches?range=24h&limit=3` | 0 | total=3, page_size=3 | PASS |
| `/api/trends?range=7d&limit=3` | 0 | total=4, page_size=3 | PASS |
| `/api/pricing` | 0 | fallback plans | PASS |

### 页面 smoke
| Page | HTML bytes | 核心 marker | 结果 |
|---|---:|---:|---|
| `/` | 166187 | 3 | PASS |
| `/home` | 100464 | 3 layer cards | PASS |
| `/launches?range=24h` | 109032 | 3 launch cards | PASS |
| `/trends?range=7d` | 84582 | 3 trend markers | PASS |
| `/discover` | 91320 | 5 category cards | PASS |
| `/compare` | 59492 | compare empty guide | PASS |
| `/pricing` | 70826 | free/starter/pro | PASS |
| `/watchlist` | 61539 | paywall marker | PASS |

## 当前结论
- AI Radar 当前已经从“依赖 Supabase 网络才能看”推进到“Supabase 不通也能实际浏览核心产品情报”的状态。
- 当前 fallback 是产品级兜底，不是最终数据闭环；后续上线仍建议继续修 Supabase 网络/部署环境，但它不再阻断用户打开和评估产品。

## 注意事项
- fallback 数据用于可用性兜底，线上真实数据恢复后 API 会优先使用 Supabase。
- 可通过 `AI_RADAR_SUPABASE_TIMEOUT_MS` 调整 fallback 触发超时时间，默认 2500ms。
- 工作区仍有历史未提交/未跟踪文件；提交前必须精确 stage 本轮相关文件，避免带入 `.env` 或临时文件。
