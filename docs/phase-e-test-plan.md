# AI Radar — Phase E 测试计划 (W1)

> **作者**: 严过关 (QA Engineer)
> **日期**: 2026-05-31
> **范围**: Phase E W1 全部 9 个任务 (T01-T09)
> **关联文档**:
> - `docs/phase-e-task-breakdown.md` (T01-T09 验收标准来源)
> - `docs/phase-e-architecture.md` (ADR-01~08 设计依据)
> - `docs/phase-e-api-contracts.md` (12 端点契约)
> - `docs/phase-e-prd-incremental.md` (PRD A-1~A-13 / B-1~B-10)
> - `supabase/migrations/002_launch_events_and_trend_signals.sql` (DDL/RLS 权威来源)
> - `supabase/seed-phase-e-*.sql` × 4 (种子文件)
>
> **原则**:
> 1. 只写测试计划, **不实际执行** (本轮 W1 仍处于开发期, 测试随 W2 端到端一并跑)
> 2. 所有用例 ID 形如 `T0X-NNN` (X=任务号, NNN=顺序)
> 3. 优先级 P0=阻塞 / P1=重要 / P2=建议
> 4. 失败归属 (Fix Owner) 标注: Alex(代码) / DB(DDL/Seed) / Doc(文档) / 无(测试代码自身问题)

---

## 0. W1 测试矩阵总览

| 任务 ID | 任务名 | 测试类型 | 用例数 | 优先级 | 备注 |
|---------|--------|----------|--------|--------|------|
| T01 | 5 新表 DDL+RLS+索引+触发器 | DB (SQL+psql) | 12 | P0 | 含幂等 + RLS + pg_net 降级 |
| T02 | `user_profiles.plan` CHECK 升级 | DB (SQL+psql) | 6 | P0 | 含现有 63 seed 回退 |
| T03 | seed 200 条 (40+120+40) | DB (SQL 验证) | 8 | P0 | 含完整性 / 配比 / 关联 |
| T04 | README v9.1 重写 | 文档评审 | 6 | P1 | 3 入口卡片 + 数据流图 |
| T05 | Newsletter 订阅 API + 确认 | API (curl) | 7 | P0 | 6 错误码全覆盖 |
| T06 | `/pricing` 页 + 3 档卡片 | FE (浏览器) | 8 | P0 | i18n + 响应式 + a11y |
| T07 | NewsletterForm 组件 | FE (浏览器) | 7 | P1 | 3 使用位点 + a11y |
| T08 | `.env.example` + `deploy.md` | 文档/配置 | 5 | P1 | pg_net 步骤完整性 |
| T09 | v_launches_recent / v_trends_active | DB (SQL) | 4 | P1 | 视图查询 + RLS 透传 |
| **回归** | **63 seed 未受影响 + 旧页面 + build** | **混合** | **5** | **P0** | **W1 完成定义** |
| **合计** | | | **68** | | |

---

## 1. T01 — 5 新表 DDL + 索引 + RLS

### 测试前置
- 干净的 Supabase 项目: `prwqhfahtqfmosmslgon`
- `psql` 客户端 + `.env` 中 `DATABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 已就绪
- 准备 2 个 shell 标签: 标签A=首次执行 / 标签B=二次执行

### 用例

#### T01-001 [P0] 5 张表全部存在
- **测试步骤**:
  ```bash
  psql "$DATABASE_URL" -c "\dt launch_events,trend_signals,categories,product_signals,newsletter_subscriptions"
  ```
- **预期**: 5 行, 全部 `public | table | <name>`
- **Fix Owner**: DB

#### T01-002 [P0] 9 个新索引全部建立
- **测试步骤**:
  ```bash
  psql "$DATABASE_URL" -c "\di" | grep -E "idx_launch|idx_trend|idx_categories|idx_product_signals|idx_newsletter"
  ```
- **预期**: 至少 9 行匹配
  - `idx_launch_event_at_desc`
  - `idx_launch_product_id`
  - `idx_launch_source_event_at`
  - `idx_trend_status_strength`
  - `idx_trend_signal_type`
  - `idx_categories_parent_id`
  - `idx_categories_display_order`
  - `idx_categories_hot_score`
  - `idx_product_signals_signal_id`
  - `idx_product_signals_relevance`
  - `idx_newsletter_frequency_active`
  - `idx_newsletter_created_at`
- **实际索引数**: 12 个 (含 2 个 newsletter 索引), 验收表述"9 个"为 PRD 历史值, 实施已扩到 12
- **Fix Owner**: DB

#### T01-003 [P0] 触发器 `trg_launch_events_notify_push` 存在
- **测试步骤**:
  ```bash
  psql "$DATABASE_URL" -c "\df fn_launch_events_notify_push_worker" && \
  psql "$DATABASE_URL" -c "SELECT tgname FROM pg_trigger WHERE tgname = 'trg_launch_events_notify_push'"
  ```
- **预期**: 函数存在 + 触发器绑定到 `launch_events` 表, 事件类型 `AFTER INSERT`
- **Fix Owner**: DB

#### T01-004 [P0] 二次执行无报错 (幂等)
- **测试步骤**:
  ```bash
  # 首次
  psql "$DATABASE_URL" -f supabase/migrations/002_launch_events_and_trend_signals.sql 2>&1 | tee /tmp/002-first.log
  # 二次
  psql "$DATABASE_URL" -f supabase/migrations/002_launch_events_and_trend_signals.sql 2>&1 | tee /tmp/002-second.log
  ```
- **预期**:
  - 两次都退出码 0
  - 二次执行**不应**出现 `relation already exists` / `policy already exists` / `trigger already exists` 类 NOTICE 升级为 ERROR
  - 二次执行末尾应出现 `=== Migration 002 完成 ===` NOTICE
- **Fix Owner**: DB

#### T01-005 [P0] 5 张表 RLS 已 ENABLE
- **测试步骤**:
  ```bash
  psql "$DATABASE_URL" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('launch_events','trend_signals','categories','product_signals','newsletter_subscriptions')"
  ```
- **预期**: 5 行 `rowsecurity = t`
- **Fix Owner**: DB

#### T01-006 [P0] anon SELECT 公开可读
- **测试步骤**:
  ```bash
  ANON_KEY=$(grep SUPABASE_ANON_KEY frontend/.env.local | cut -d= -f2)
  for t in launch_events trend_signals categories product_signals; do
    echo "--- $t ---"
    curl -s -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
      "$SUPABASE_URL/rest/v1/$t?select=*&limit=1" | jq -c .
  done
  ```
- **预期**: 4 个端点都返回 `200`, 数据数组长度 ≥ 0 (空表也 OK, 但 RLS 不应拦截)
- **Fix Owner**: DB / Alex (若策略未生效)

#### T01-007 [P0] anon INSERT 默认拒绝 (除 newsletter)
- **测试步骤**:
  ```bash
  for t in launch_events trend_signals categories product_signals; do
    echo "--- $t ---"
    curl -s -X POST -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
      -H "Content-Type: application/json" -d '{"test":1}' \
      "$SUPABASE_URL/rest/v1/$t" -w "HTTP:%{http_code}\n"
  done
  ```
- **预期**: 4 个端点都返回 `401` 或 `403` 或 `400` 含 `row-level security` 关键字
- **Fix Owner**: DB

#### T01-008 [P1] pg_net 触发器条件过滤正确
- **测试步骤** (在 psql 中):
  ```sql
  -- 准备一个 product 用于关联
  INSERT INTO products (slug, name) VALUES ('_test_trigger', 'Trigger Test')
    ON CONFLICT (slug) DO NOTHING RETURNING id;
  -- case 1: 满足条件 (event_type=launch, source=producthunt, confidence=0.8)
  INSERT INTO launch_events (product_id, source, source_id, event_type, confidence)
    SELECT id, 'producthunt', 'ph-trigger-test-1', 'launch', 0.8
    FROM products WHERE slug='_test_trigger';
  -- case 2: 不满足 (confidence=0.5)
  INSERT INTO launch_events (product_id, source, source_id, event_type, confidence)
    SELECT id, 'producthunt', 'ph-trigger-test-2', 'launch', 0.5
    FROM products WHERE slug='_test_trigger';
  -- case 3: 不满足 (event_type=major_update)
  INSERT INTO launch_events (product_id, source, source_id, event_type, confidence)
    SELECT id, 'producthunt', 'ph-trigger-test-3', 'major_update', 0.9
    FROM products WHERE slug='_test_trigger';
  -- case 4: 不满足 (source=arxiv, 也不在白名单)
  INSERT INTO launch_events (product_id, source, source_id, event_type, confidence)
    SELECT id, 'arxiv', 'arxiv-trigger-test-1', 'launch', 0.9
    FROM products WHERE slug='_test_trigger';
  ```
- **预期**:
  - case 1 触发: 推送日志(走 push-worker mock) 可见 1 次 X-AI-Radar-Event-Id
  - case 2/3/4 不触发: 推送日志无新增
  - 4 条数据本身都成功插入 (触发器不阻塞)
- **观测方法**: 抓 `push-worker` 日志或 `pg_stat_activity` 看 `net.http_post` 调用次数
- **Fix Owner**: DB / Alex (若条件过滤错误)

#### T01-009 [P0] pg_net 扩展未启用时降级不报错
- **测试步骤**:
  - 在测试库临时 `DROP EXTENSION pg_net;` (或新建一个无 pg_net 的测试库)
  - 执行 `002_*.sql`
  - 再次 `INSERT launch_events (...)` 满足条件
- **预期**:
  - SQL 迁移脚本不因 pg_net 缺失而失败 (CREATE EXTENSION IF NOT EXISTS 静默通过)
  - 插入事件成功, 仅 RAISE NOTICE 出现 `pg_net not available, launch event % not pushed`
- **Fix Owner**: DB

#### T01-010 [P1] `update_updated_at_column` 函数复用正确
- **测试步骤**:
  ```sql
  UPDATE launch_events SET body='updated' WHERE id=(SELECT id FROM launch_events LIMIT 1);
  SELECT updated_at FROM launch_events LIMIT 1;
  ```
- **预期**: `updated_at` 字段比 `created_at` 更晚
- **Fix Owner**: DB

#### T01-011 [P1] `email_format` CHECK 约束在 newsletter 触发
- **测试步骤**:
  ```sql
  INSERT INTO newsletter_subscriptions (email) VALUES ('bad-email');
  ```
- **预期**: 报错 `violates check constraint "newsletter_subscriptions_email_format"`
- **Fix Owner**: DB

#### T01-012 [P1] `newsletter_subscriptions` 唯一约束正确
- **测试步骤**:
  ```sql
  INSERT INTO newsletter_subscriptions (email) VALUES ('a@a.com') ON CONFLICT DO NOTHING;
  INSERT INTO newsletter_subscriptions (email) VALUES ('a@a.com') ON CONFLICT DO NOTHING;
  SELECT count(*) FROM newsletter_subscriptions WHERE email='a@a.com';
  ```
- **预期**: count = 1 (第二次不报错但未插入)
- **Fix Owner**: DB

---

## 2. T02 — `user_profiles.plan` 升级

### 用例

#### T02-001 [P0] CHECK 约束 4 枚举值
- **测试步骤**:
  ```sql
  SELECT pg_get_constraintdef(oid) FROM pg_constraint
  WHERE conname = 'user_profiles_plan_check';
  ```
- **预期**: 包含 `free`, `starter`, `pro`, `enterprise` 4 个值
- **Fix Owner**: DB

#### T02-002 [P0] 默认值 'free' 生效
- **测试步骤**:
  ```sql
  SELECT column_default FROM information_schema.columns
  WHERE table_name='user_profiles' AND column_name='plan';
  ```
- **预期**: `'free'::text`
- **Fix Owner**: DB

#### T02-003 [P0] 现有 63 条 seed 中空 plan 回退
- **测试步骤**:
  ```sql
  -- 模拟"无 plan"的旧 user
  INSERT INTO user_profiles (id, email) VALUES (gen_random_uuid(), 'test@x.com')
  ON CONFLICT DO NOTHING;
  -- 不指定 plan 字段, 应回退 'free'
  SELECT plan FROM user_profiles WHERE email='test@x.com';
  ```
- **预期**: `plan = 'free'`
- **Fix Owner**: DB

#### T02-004 [P0] 非法 plan 被拒绝
- **测试步骤**:
  ```sql
  UPDATE user_profiles SET plan='invalid' WHERE email='test@x.com';
  ```
- **预期**: 报错 `violates check constraint "user_profiles_plan_check"`
- **Fix Owner**: DB

#### T02-005 [P0] 4 合法 plan 全部接受
- **测试步骤**:
  ```sql
  UPDATE user_profiles SET plan='starter' WHERE email='test@x.com';
  UPDATE user_profiles SET plan='pro' WHERE email='test@x.com';
  UPDATE user_profiles SET plan='enterprise' WHERE email='test@x.com';
  UPDATE user_profiles SET plan='free' WHERE email='test@x.com';
  ```
- **预期**: 4 次 UPDATE 全部成功
- **Fix Owner**: DB

#### T02-006 [P1] plan 字段不强制 NOT NULL
- **测试步骤**:
  ```sql
  SELECT is_nullable FROM information_schema.columns
  WHERE table_name='user_profiles' AND column_name='plan';
  ```
- **预期**: `is_nullable = YES` (允许 NULL, 应用层回退 'free')
- **Fix Owner**: DB

---

## 3. T03 — seed 200 条 (40+120+40)

### 用例

#### T03-001 [P0] 4 文件全部执行成功
- **测试步骤**:
  ```bash
  time psql "$DATABASE_URL" -f supabase/seed-phase-e-products-40.sql
  time psql "$DATABASE_URL" -f supabase/seed-phase-e-launch-events-120.sql
  time psql "$DATABASE_URL" -f supabase/seed-phase-e-trend-signals-40.sql
  time psql "$DATABASE_URL" -f supabase/seed-phase-e-200.sql
  ```
- **预期**:
  - 4 个文件 exit 0
  - 单文件 ≤ 30s, 总执行 ≤ 60s
  - 每个文件末尾的 RAISE NOTICE 出现
- **Fix Owner**: DB

#### T03-002 [P0] products 数量净增 40
- **测试步骤**:
  ```sql
  -- 基线: 已有 63 条 L1 成熟产品
  SELECT
    (SELECT count(*) FROM products) - 63 AS new_count,
    (SELECT count(*) FROM products) AS total_count;
  ```
- **预期**:
  - `new_count = 40` (或 0 二次执行, 幂等)
  - `total_count = 103` (63 + 40) 首次 / 103 二次
- **覆盖校验**:
  ```sql
  SELECT category, count(*) FROM products
  WHERE slug IN (
    'hunyuan','glm-4','doubao','baichuan',
    'adobe-firefly','leonardo-ai','playground-ai',
    'replit','cody','tabnine',
    'autogpt','manus','lindy',
    'grammarly','otter-ai','mem-ai',
    'playht','resemble-ai','aiva',
    'luma-dream-machine','synthesia','heygen',
    'huggingface','replicate','anyscale',
    'brave-search','andi-search','komo',
    'khanmigo','duolingo-max','speak-app','quizlet-qchat',
    'intercom-fin','ada-support','forethought',
    'hippocratic-ai','glass-health',
    'jasper-ai','copy-ai','mutiny'
  ) GROUP BY category ORDER BY category;
  ```
- **预期**: 13 个分类全部出现, 总和 = 40
- **Fix Owner**: DB

#### T03-003 [P0] launch_events = 120
- **测试步骤**:
  ```sql
  SELECT count(*) AS total, count(DISTINCT source) AS src_count
  FROM launch_events;
  ```
- **预期**: `total = 120`, `src_count = 6` (producthunt/hackernews/github/x/arxiv/xiaohongshu)
- **源分布校验**:
  ```sql
  SELECT source, count(*) FROM launch_events GROUP BY source ORDER BY count(*) DESC;
  ```
- **预期**:
  - producthunt: 30
  - hackernews: 25
  - github: 25
  - x: 20
  - arxiv: 15
  - xiaohongshu: 5
- **Fix Owner**: DB

#### T03-004 [P0] trend_signals = 40
- **测试步骤**:
  ```sql
  SELECT
    count(*) AS total,
    count(*) FILTER (WHERE status='emerging') AS emerging,
    count(*) FILTER (WHERE status='peaking') AS peaking,
    count(*) FILTER (WHERE status='cooling') AS cooling
  FROM trend_signals;
  ```
- **预期**: total=40, emerging=24, peaking=12, cooling=4
- **Fix Owner**: DB

#### T03-005 [P0] signal_type 5 种全部覆盖
- **测试步骤**:
  ```sql
  SELECT signal_type, count(*) FROM trend_signals
  GROUP BY signal_type ORDER BY signal_type;
  ```
- **预期**: 5 行, 类型 ∈ {`tag_emerging`, `category_growing`, `tech_stack_shift`, `cluster_new`, `funding_pattern`}
- **Fix Owner**: DB

#### T03-006 [P0] categories ≥ 40 (13 L1 + 27 L2)
- **测试步骤**:
  ```sql
  SELECT
    count(*) AS total,
    count(*) FILTER (WHERE parent_id IS NULL) AS l1,
    count(*) FILTER (WHERE parent_id IS NOT NULL) AS l2
  FROM categories;
  ```
- **预期**: total=40, l1=13, l2=27
- **Fix Owner**: DB

#### T03-007 [P0] LEFT JOIN 验证: 每条 L1 产品 ≥ 1 个 launch_event
- **测试步骤**:
  ```sql
  SELECT count(*) AS orphans
  FROM products p
  LEFT JOIN launch_events le ON le.product_id = p.id
  WHERE p.slug IN (
    'hunyuan','glm-4','doubao','baichuan',
    'adobe-firefly','leonardo-ai','playground-ai',
    'replit','cody','tabnine',
    'autogpt','manus','lindy',
    'grammarly','otter-ai','mem-ai',
    'playht','resemble-ai','aiva',
    'luma-dream-machine','synthesia','heygen',
    'huggingface','replicate','anyscale',
    'brave-search','andi-search','komo',
    'khanmigo','duolingo-max','speak-app','quizlet-qchat',
    'intercom-fin','ada-support','forethought',
    'hippocratic-ai','glass-health',
    'jasper-ai','copy-ai','mutiny'
  )
  GROUP BY p.id
  HAVING count(le.id) = 0;
  ```
- **预期**: 0 行 (无孤儿产品)
- **Fix Owner**: DB

#### T03-008 [P0] product_signals ≥ 20
- **测试步骤**:
  ```sql
  SELECT count(*) FROM product_signals;
  ```
- **预期**: ≥ 20 (实际 25, 主文件定义)
- **关联校验**:
  ```sql
  SELECT
    count(DISTINCT product_id) AS products_with_signals,
    count(DISTINCT signal_id) AS signals_with_products,
    avg(relevance)::numeric(3,2) AS avg_relevance
  FROM product_signals;
  ```
- **预期**: products_with_signals ≥ 10, signals_with_products ≥ 8, avg_relevance ∈ [0.6, 1.0]
- **Fix Owner**: DB

#### T03-009 [P1] 事件时间分布 2025-12 ~ 2026-05
- **测试步骤**:
  ```sql
  SELECT
    min(event_at) AS earliest,
    max(event_at) AS latest,
    count(*) FILTER (WHERE event_at >= '2025-12-01' AND event_at < '2026-06-01') AS in_range,
    count(*) FILTER (WHERE event_at < '2025-12-01' OR event_at >= '2026-06-01') AS out_of_range
  FROM launch_events;
  ```
- **预期**:
  - earliest ∈ [2025-12-01, 2025-12-31]
  - latest ∈ [2026-05-01, 2026-05-31]
  - in_range = 120
  - out_of_range = 0
- **Fix Owner**: DB

#### T03-010 [P1] event_type 分布 70/30/10/5/5 (PRD 比例)
- **测试步骤**:
  ```sql
  SELECT event_type, count(*) FROM launch_events GROUP BY event_type ORDER BY count(*) DESC;
  ```
- **预期** (允许 ±2 浮动):
  - launch: 70
  - major_update: 30
  - open_source: 10
  - funding: 5
  - milestone: 5
- **Fix Owner**: DB

---

## 4. T04 — README v9.1 重写

### 用例

#### T04-001 [P1] 3 层信息架构开篇段
- **测试步骤**: 浏览器或编辑器打开 `README.md`, 阅读前 50 行
- **预期**: 第 1 段(50-200 字内)明确提到 "L1 成熟赛道" / "L2 今日新发" / "L3 趋势方向" (或英文等效 Mature / Today's Launches / Trends)
- **Fix Owner**: Doc

#### T04-002 [P1] 3 入口卡片 ASCII 图
- **测试步骤**: grep `README.md` 的 L1/L2/L3 + 链接
- **预期**: 出现 3 个入口块, 每个含链接路径 (如 `/launches`, `/trends`, `/products`)
- **Fix Owner**: Doc

#### T04-003 [P1] 数据流图章节
- **测试步骤**: 搜索 "数据流" / "Data Flow" / "sources →" 关键字
- **预期**: 出现 1 张图, 描述 `sources → launch_events/trend_signals → products → frontend`
- **Fix Owner**: Doc

#### T04-004 [P1] 章节完整 6 项
- **测试步骤**: 提取 H2 标题
- **预期**: 含 "项目背景 / 信息架构 / 数据模型 / 爬虫矩阵 / 商业化 / 路线图" 6 个 (或英文等效 6 个)
- **Fix Owner**: Doc

#### T04-005 [P1] 爬虫矩阵明确 "4 + 4"
- **测试步骤**: 搜索 "爬虫" / "crawler" 章节
- **预期**: 出现 "4 个已实现 + 4 个 P0 扩展中" (或等效), **不写** "15 个" 或 "8 个全实现" 之类的虚标
- **Fix Owner**: Doc

#### T04-006 [P2] 4 张新表 DDL 摘要
- **测试步骤**: 搜索 "launch_events" / "trend_signals" / "categories" / "product_signals"
- **预期**: 4 个表都有 5-10 行 DDL 摘要 (字段列表, 非完整 DDL)
- **Fix Owner**: Doc

---

## 5. T05 — Newsletter 订阅 API

### 用例 (核心 6 条, 任务重点)

#### T05-001 [P0] 正常订阅 201
- **测试步骤**:
  ```bash
  curl -X POST "$SITE_URL/api/newsletter/subscribe" \
    -H "Content-Type: application/json" \
    -d '{"email":"alice@example.com","frequency":"daily","language":"en","source":"home_hero"}' \
    -w "\nHTTP:%{http_code}\n"
  ```
- **预期**:
  - HTTP 201
  - JSON: `code=0, data.subscription_id` (UUID) 存在
  - `data.confirmation_required = true`
  - `data.mock_email_sent = true`
  - `data.email = "alice@example.com"`
  - `data.frequency = "daily"`
- **DB 副作用**:
  ```sql
  SELECT email, frequency, language, confirmation_token IS NOT NULL AS has_token,
         unsubscribed_at, confirmed_at
  FROM newsletter_subscriptions WHERE email='alice@example.com';
  ```
  - 预期: 1 行, has_token=t, unsubscribed_at=null, confirmed_at=null
- **Fix Owner**: Alex

#### T05-002 [P0] 邮箱格式错误 → 4000
- **测试步骤**:
  ```bash
  for email in "no-at-sign" "@missing-user.com" "user@" "user@x" "user@x.c"; do
    echo "--- $email ---"
    curl -X POST "$SITE_URL/api/newsletter/subscribe" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\"}" -w "\nHTTP:%{http_code}\n"
  done
  ```
- **预期**:
  - HTTP 400
  - JSON: `code=4000, message` 包含 "Invalid email" / "邮箱格式"
  - 5 个用例全部拒绝
- **DB 副作用**: 无新行
- **Fix Owner**: Alex

#### T05-003 [P0] 重复 email → 4006
- **测试步骤**:
  ```bash
  # 第 1 次 (同 T05-001)
  curl -X POST "$SITE_URL/api/newsletter/subscribe" \
    -H "Content-Type: application/json" \
    -d '{"email":"dup@example.com","frequency":"daily"}' -w "\nHTTP:%{http_code}\n"
  # 第 2 次 (相同 email)
  curl -X POST "$SITE_URL/api/newsletter/subscribe" \
    -H "Content-Type: application/json" \
    -d '{"email":"dup@example.com","frequency":"weekly"}' -w "\nHTTP:%{http_code}\n"
  ```
- **预期**:
  - 第 2 次 HTTP 409
  - JSON: `code=4006, data.already_subscribed=true, data.subscription_id` (与第 1 次相同 UUID), `data.frequency='daily'` (保留首次订阅的频率, 不覆盖)
  - 响应 message 包含 "already subscribed" / "已订阅"
- **DB 副作用**: 表中只有 1 行, frequency 仍为 'daily'
- **Fix Owner**: Alex

#### T05-004 [P0] frequency 非法 → 4001
- **测试步骤**:
  ```bash
  for f in "hourly" "monthly" "" "DAILY"; do
    echo "--- $f ---"
    curl -X POST "$SITE_URL/api/newsletter/subscribe" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"freq-$f@example.com\",\"frequency\":\"$f\"}" -w "\nHTTP:%{http_code}\n"
  done
  ```
- **预期**:
  - HTTP 400
  - JSON: `code=4001, message` 包含 "frequency" 或 "invalid"
  - 4 个用例全部拒绝 (DAILY 因大小写敏感也拒绝)
  - language 非法同理 (单独测 `language='jp'`)
- **Fix Owner**: Alex

#### T05-005 [P0] 确认 token 成功 → 200
- **测试步骤**:
  ```sql
  -- 取 alice@example.com 的 confirmation_token
  SELECT confirmation_token FROM newsletter_subscriptions WHERE email='alice@example.com';
  -- 假设 token = 'tok-abc123'
  ```
  ```bash
  curl "$SITE_URL/api/newsletter/confirm?token=tok-abc123" -w "\nHTTP:%{http_code}\n"
  ```
- **预期**:
  - HTTP 200
  - JSON: `code=0, data.email='alice@example.com', data.confirmed_at` (非 null, ISO8601)
- **DB 副作用**:
  ```sql
  SELECT confirmed_at IS NOT NULL FROM newsletter_subscriptions WHERE email='alice@example.com';
  ```
  - 预期: t
- **Fix Owner**: Alex

#### T05-006 [P0] 确认 token 失效 → 4000/4003
- **测试步骤**:
  ```bash
  # 场景 1: token 不存在
  curl "$SITE_URL/api/newsletter/confirm?token=invalid-token" -w "\nHTTP:%{http_code}\n"
  # 场景 2: token 缺失
  curl "$SITE_URL/api/newsletter/confirm" -w "\nHTTP:%{http_code}\n"
  # 场景 3: token 已使用过 (用 T05-005 中已确认的 token 再请求)
  curl "$SITE_URL/api/newsletter/confirm?token=tok-abc123" -w "\nHTTP:%{http_code}\n"
  # 场景 4: token 来自已退订用户
  curl "$SITE_URL/api/newsletter/confirm?token=expired-token" -w "\nHTTP:%{http_code}\n"
  ```
- **预期**:
  - 场景 1/2/3/4 都返回 4000 (token 缺失) 或 4003 (token 不存在)
  - **注 (P0-2 已修复)**: 原标题误写 "4007 限流触发", 与 API 契约 §5.2 冲突 (4007 是 subscribe 限流专用)。正确错误码为 4000/4003, 已修正。
  - 若代码实际返回 429 + 4007 视为错误, 应修正
- **DB 副作用**: confirmed_at 不再被覆盖
- **Fix Owner**: Alex / Doc (确认接口规范)

#### T05-007 [P1] 完整 curl 一句话
- **测试步骤**:
  ```bash
  curl -X POST "$SITE_URL/api/newsletter/subscribe" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","frequency":"daily"}' \
    -w "\nHTTP:%{http_code}\n"
  ```
- **预期**: HTTP 201, `code=0` (T05 验收第 7 条)
- **Fix Owner**: Alex

#### T05-008 [P1] email 字段缺失 → 4002
- **测试步骤**:
  ```bash
  curl -X POST "$SITE_URL/api/newsletter/subscribe" \
    -H "Content-Type: application/json" \
    -d '{"frequency":"daily"}' -w "\nHTTP:%{http_code}\n"
  ```
- **预期**: HTTP 400, `code=4002`, message 含 "email" + "required/missing"
- **Fix Owner**: Alex

---

## 6. T06 — `/pricing` 页面 + 3 档卡片

### 用例

#### T06-001 [P0] 3 档卡片渲染
- **测试步骤**: 浏览器访问 `$SITE_URL/pricing`
- **预期**:
  - 看到 3 张卡片: Starter $29 / Pro $79 / Enterprise $299
  - 卡片顺序: 横向, Starter → Pro → Enterprise
- **Fix Owner**: Alex (FE)

#### T06-002 [P0] 月付/年付切换
- **测试步骤**: 点击 "年付" 切换按钮
- **预期**:
  - 价格变更: Starter $29→$23.2 (省 20%) / Pro $79→$63.2 / Enterprise $299→$239.2
  - 副标题含 "Save 20%" / "省 20%"
- **Fix Owner**: Alex (FE)

#### T06-003 [P0] Pro 卡片 "推荐" 角标
- **测试步骤**: 视觉检查中间 Pro 卡片
- **预期**:
  - 卡片顶部有 badge, 文案 "推荐" / "Recommended" (i18n 切换后)
  - 视觉上 Pro 卡片背景或边框高亮
- **Fix Owner**: Alex (FE)

#### T06-004 [P0] CTA 按钮响应
- **测试步骤**:
  - 点 Starter CTA → 期望: 弹窗或跳转 `/api/admin/plan-switch?plan=starter` mock
  - 点 Pro CTA → 同上, `plan=pro`
  - 点 Enterprise CTA → 期望: 打开 `mailto:...` 链接
- **预期**:
  - Starter/Pro 触发 mock 弹窗 (Phase E 不实际升级)
  - Enterprise 触发邮件客户端
- **Fix Owner**: Alex (FE)

#### T06-005 [P1] 底部 FAQ 3-5 条
- **测试步骤**: 滚动到页面底部
- **预期**: FAQ 区含 3-5 个折叠/展开项, 主题覆盖:
  - 订阅周期
  - 退款政策
  - 发票/企业
  - 多账号
  - 取消订阅
- **Fix Owner**: Alex (FE)

#### T06-006 [P0] i18n 切换
- **测试步骤**:
  - 访问 `$SITE_URL/en/pricing` 看到英文
  - 访问 `$SITE_URL/zh/pricing` 看到中文
  - 切换页面右上角语言切换器, URL 同步更新
- **预期**:
  - 英文版 3 卡片标题: "Starter / Pro / Enterprise"
  - 中文版 3 卡片标题: "入门 / 专业 / 企业" (或架构约定的中文译名)
  - 切换后无内容缺失
- **Fix Owner**: Alex (FE) / Doc (若 i18n 字典未补)

#### T06-007 [P1] 响应式 3 档布局
- **测试步骤**:
  - 桌面 (≥1024px): 3 列
  - 平板 (768-1023px): 2 列
  - 手机 (<768px): 1 列
- **预期**: 卡片在 3 种断点下不重叠、不溢出
- **Fix Owner**: Alex (FE)

#### T06-008 [P1] Lighthouse 性能
- **测试步骤**:
  ```bash
  npx lighthouse "$SITE_URL/pricing" --quiet --chrome-flags="--headless" --output=json \
    | jq '.categories.performance.score, .categories.seo.score'
  ```
- **预期**: performance ≥ 0.9, seo ≥ 0.95
- **Fix Owner**: Alex (FE)

---

## 7. T07 — NewsletterForm 组件

### 用例

#### T07-001 [P1] 3 使用位点存在
- **测试步骤**: 浏览器访问以下 3 个页面
  1. `/` (首页) Hero 下方
  2. `/pricing` 顶部
  3. `/launches` 空态 (DB 中清空 launch_events 临时造)
- **预期**: 3 个页面都能看到订阅表单
- **Fix Owner**: Alex (FE)

#### T07-002 [P1] 组件 props
- **测试步骤**: 检查 `frontend/src/components/NewsletterForm.tsx`
- **预期**:
  - `interface Props { source: string; defaultFrequency?: 'daily'|'weekly' }`
  - source 必填, defaultFrequency 可选 (默认 'daily')
- **Fix Owner**: Alex (FE)

#### T07-003 [P1] 邮箱防抖校验
- **测试步骤**:
  1. 邮箱输入 "abc"
  2. 触发 blur
  3. 等待 200ms
- **预期**: 显示错误 "Invalid email" / "邮箱格式错"
- **Fix Owner**: Alex (FE)

#### T07-004 [P1] 频率下拉
- **测试步骤**: 点击频率下拉
- **预期**: 2 个选项: "Daily / 每日" 和 "Weekly / 每周" (i18n 切换)
- **Fix Owner**: Alex (FE)

#### T07-005 [P1] 提交 loading + toast
- **测试步骤**: 提交合法邮箱
- **预期**:
  - 按钮变 loading (禁用 + spinner)
  - 成功 toast: "Please check your email" / "请检查邮箱"
  - 失败 toast: 显示 code + message
- **Fix Owner**: Alex (FE)

#### T07-006 [P1] a11y label 关联
- **测试步骤**:
  - 浏览器 inspect `<input>`
  - 检查 `aria-describedby` 指向错误信息元素
- **预期**: 错误信息元素 `id` 与 `aria-describedby` 匹配
- **Fix Owner**: Alex (FE)

#### T07-007 [P2] 移动端可用
- **测试步骤**: 移动端模拟 (< 375px 宽)
- **预期**:
  - 邮箱输入框宽度自适应
  - 提交按钮可点 (hit area ≥ 44px)
  - 错误提示不溢出
- **Fix Owner**: Alex (FE)

---

## 8. T08 — `.env.example` + `deploy.md`

### 用例

#### T08-001 [P1] 3 份 `.env.example` 完整
- **测试步骤**: 检查 3 个文件
  - `frontend/.env.example`
  - `crawler/.env.example`
  - `push-worker/.env.example`
- **预期**:
  - **frontend**: 含 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`
  - **crawler**: 含 4 源 mock 路径: `MOCK_PRODUCTHUNT_DIR`, `MOCK_HACKERNEWS_DIR`, `MOCK_GITHUB_DIR`, `MOCK_ARXIV_DIR` (或等效命名)
  - **push-worker**: 含 `MOCK_MAIL_MODE=true`, `WEBHOOK_SECRET`, `SITE_URL`
- **Fix Owner**: Doc

#### T08-002 [P1] `docs/deploy.md` 存在
- **测试步骤**: 检查文件存在且非空
- **预期**: 至少 200 行, 含 W1 部署步骤
- **Fix Owner**: Doc

#### T08-003 [P0] pg_net 开启步骤
- **测试步骤**: grep `pg_net` in `docs/deploy.md`
- **预期**: 步骤明确:
  1. Supabase 控制台 → Database → Extensions → 搜索 `pg_net` → 启用
  2. SQL: `CREATE EXTENSION IF NOT EXISTS "pg_net";`
  3. 设置 GUC: `ALTER DATABASE postgres SET app.webhooks_base_url = 'https://your-site.vercel.app';`
- **Fix Owner**: Doc

#### T08-004 [P0] push-worker 部署步骤
- **测试步骤**: grep `push-worker` in `docs/deploy.md`
- **预期**: 步骤含:
  1. 复制 `.env.example` → `.env`
  2. `pnpm install` / `npm install`
  3. 启动: `pnpm dev` 或 `npm run start`
  4. 健康检查: `curl http://localhost:3001/health`
- **Fix Owner**: Doc

#### T08-005 [P1] 截图位置留档
- **测试步骤**: grep `截图` / `screenshot` in `docs/deploy.md`
- **预期**: 步骤含 `(Phase E 仅描述步骤, 截图 Phase F+ 补)` 类说明
- **Fix Owner**: Doc

---

## 9. T09 — 数据库视图

### 用例

#### T09-001 [P0] `v_launches_recent` 视图可查
- **测试步骤**:
  ```sql
  SELECT count(*) FROM v_launches_recent;
  -- 90 天滚动, 应包含 2026-03 ~ 2026-05 的事件
  SELECT id, product_slug, product_name, product_logo_url, source, event_type
  FROM v_launches_recent LIMIT 5;
  ```
- **预期**:
  - count ≥ 80 (120 事件中 90 天内的占比)
  - 5 行数据 product_slug / product_name 都有值 (LEFT JOIN 应都匹配)
  - source / event_type 不为 null
- **Fix Owner**: DB

#### T09-002 [P0] `v_trends_active` 视图含 product_count
- **测试步骤**:
  ```sql
  SELECT id, signal_type, scope, title, product_count
  FROM v_trends_active
  WHERE product_count > 0
  ORDER BY product_count DESC LIMIT 10;
  ```
- **预期**:
  - 至少 5 行 product_count > 0
  - product_count 最大值 ≤ 25 (实际 product_signals 总数)
  - 视图过滤 status ∈ ('emerging', 'peaking', 'cooling')
- **Fix Owner**: DB

#### T09-003 [P1] 视图对 anon 可读
- **测试步骤**:
  ```bash
  curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
    "$SUPABASE_URL/rest/v1/v_launches_recent?select=*&limit=1" -w "\nHTTP:%{http_code}\n"
  curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
    "$SUPABASE_URL/rest/v1/v_trends_active?select=*&limit=1" -w "\nHTTP:%{http_code}\n"
  ```
- **预期**:
  - 2 个端点都返回 200
  - RLS 透传 (因底层表 RLS 是 SELECT USING true)
- **Fix Owner**: DB

#### T09-004 [P1] EXPLAIN 走索引
- **测试步骤**:
  ```sql
  EXPLAIN ANALYZE SELECT * FROM v_launches_recent
  WHERE event_at >= NOW() - INTERVAL '30 days' LIMIT 20;
  ```
- **预期**:
  - 出现 `Index Scan using idx_launch_event_at_desc`
  - Total runtime < 30ms (P95)
- **Fix Owner**: DB

---

## 10. 回归测试清单 (W1 完成定义)

> 任何一条失败 → W1 不可发布

### REG-001 [P0] 63 条原有 seed 未受影响
- **测试步骤**:
  ```sql
  -- 备份并对比
  SELECT count(*) FROM products;  -- 应 = 103 (63 + 40)
  SELECT count(*) FROM products
  WHERE slug IN ('chatgpt','claude','cursor','midjourney','runway','perplexity');
  -- 应 = 6 (L1 头部 6 个)
  ```
- **预期**:
  - 原有 63 条 products 仍在
  - 头部 6 个 (ChatGPT/Claude/Cursor/Midjourney/Runway/Perplexity) 都在
  - 任何 L1 头部产品缺失即失败
- **Fix Owner**: DB

### REG-002 [P0] 旧页面可访问
- **测试步骤**: 浏览器访问以下页面
  - `/` (首页)
  - `/products` (L1 列表)
  - `/products/:slug` (L1 详情)
  - `/discover` (探索页)
- **预期**:
  - 4 个页面都 200, 不出现 5xx
  - 旧页面 UI/数据未变 (Phase E 范围内不动 L1 现有渲染逻辑)
- **Fix Owner**: Alex (FE)

### REG-003 [P0] pnpm build 全绿
- **测试步骤**:
  ```bash
  cd frontend && pnpm build 2>&1 | tee /tmp/build.log
  echo "Exit: $?"
  ```
- **预期**:
  - 退出码 0
  - 0 个 TypeScript error
  - 0 个 ESLint error (warning 可接受)
- **Fix Owner**: Alex (FE)

### REG-004 [P0] pnpm typecheck + lint
- **测试步骤**:
  ```bash
  cd frontend && pnpm typecheck && pnpm lint
  ```
- **预期**: 退出码 0
- **Fix Owner**: Alex (FE)

### REG-005 [P0] API 端点冒烟 (12 端点)
- **测试步骤**:
  ```bash
  ENDPOINTS=(
    "GET /api/launches"
    "GET /api/trends"
    "GET /api/categories"
    "GET /api/products/cursor/signals"
    "POST /api/newsletter/subscribe"
    "GET /api/pricing"
    "GET /api/admin/plan"
  )
  for ep in "${ENDPOINTS[@]}"; do
    method=${ep%% *}; path=${ep##* }
    # ... curl
  done
  ```
- **预期**:
  - 7 个 GET 端点 (含 2 个公开 anon 可访问) 返回 200
  - POST newsletter 返回 201 (合法 body)
  - 0 个 5xx
- **Fix Owner**: Alex

---

## 11. 测试通过判据

W1 可签收条件 (ALL 必须满足):
1. P0 用例 (T01-T09) 全部通过 → 60/60
2. P1 用例 90% 通过 → 至少 13/15
3. 回归清单 5/5 通过
4. 0 个 P0 bug
5. 0 个已知安全/数据丢失风险

W2 端到端测试 (T20) 将在以下任务完成后启动:
- T10 `/launches` + Timeline
- T11 `/trends` + 4 组件
- T12 首页 3 入口
- T06 `/pricing` 完成后

---

## 12. 风险与未覆盖项

| 风险 | 等级 | 说明 |
|------|------|------|
| Newsletter 邮件 mock 不发真实邮件 | P1 | Phase E 设计如此, W3 接入 mock worker 后再验证 |
| pg_net 触发器未在 staging 实测 | P1 | T01-008/009 依赖 staging 环境, 本地无 pg_net |
| 200 seed 全部回退方案 | P1 | PRD 允许降级 100 条 (35:50:20), 测试矩阵未覆盖此场景 |
| 推送链路 (T25) 端到端 | P0 | W3 任务, 需 T01 + T22 完成后单测 |
| Stripe/X API 真实接入 | - | Phase F+, 不在本测试计划范围 |

---

## 13. 报告输出

测试结果汇总为:
- `docs/qa-phase-e-w1.md` (W1 完成时, T20 启动前)
- 含: 总数/通过/失败、用例 ID 列表、bug 列表、阻塞项、签收结论
- 报告入口: 提交到 `team-lead` 进行仲裁

---

**最后更新**: 2026-05-31 (W1 测试计划 v1)
**作者**: 严过关 (QA Engineer)
