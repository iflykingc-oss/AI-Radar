-- =====================================================================
-- AI Radar Migration 002 — Phase E 双线并行
-- 创建时间: 2026-05-30
-- 作者: 高见远 (Architect) / 由寇豆码 (Engineer) 执行
--
-- 范围:
--   A 线: launch_events / trend_signals / categories / product_signals
--   B 线: newsletter_subscriptions + user_profiles.plan CHECK 升级
--   触发器: launch_events 写入 → pg_net 异步调用 /webhook/launch
--           trend_signals 写入 → 同上（仅 status 变更时）
--
-- 幂等策略:
--   - CREATE TABLE / INDEX / POLICY 全部使用 IF NOT EXISTS / DROP IF EXISTS
--   - trigger / function 使用 CREATE OR REPLACE
--   - 不修改 001_initial_schema.sql 既有表结构（仅 ADD COLUMN IF NOT EXISTS）
-- =====================================================================

-- 启用扩展（pg_net 用于异步调用 webhook）
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- Part 1: B 线 — user_profiles.plan 升级为 TEXT + CHECK
-- =====================================================================

-- 移除 001 中的隐式默认（如果有 CHECK 旧约束则替换）
ALTER TABLE user_profiles
  ALTER COLUMN plan SET DEFAULT 'free';

-- 清理可能存在的旧 CHECK 约束，再重新加（保持幂等）
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_plan_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'enterprise'));

-- 不强制 NOT NULL：未登录用户 / 系统用户 plan 可空，统一回退 'free'
COMMENT ON COLUMN user_profiles.plan IS 'subscription tier; free | starter | pro | enterprise';

-- =====================================================================
-- Part 2: A 线 — launch_events（L2 新发布事件流）
-- =====================================================================

CREATE TABLE IF NOT EXISTS launch_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  source          TEXT NOT NULL,
  source_url      TEXT,
  source_id       TEXT,
  event_type      TEXT NOT NULL DEFAULT 'launch',
  title           TEXT,
  body            TEXT,
  author          TEXT,
  engagement      JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_at        TIMESTAMPTZ,
  confidence      REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  raw_data        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT launch_events_source_unique UNIQUE (source, source_id),
  CONSTRAINT launch_events_event_type_check
    CHECK (event_type IN ('launch', 'major_update', 'open_source', 'funding', 'milestone', 'pricing_change'))
);

-- 索引：3 个（按 PRD A-1 要求）
CREATE INDEX IF NOT EXISTS idx_launch_event_at_desc
  ON launch_events (event_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_launch_product_id
  ON launch_events (product_id);
CREATE INDEX IF NOT EXISTS idx_launch_source_event_at
  ON launch_events (source, event_at DESC NULLS LAST);

-- updated_at 自动维护
DROP TRIGGER IF EXISTS trg_launch_events_updated_at ON launch_events;
CREATE TRIGGER trg_launch_events_updated_at
  BEFORE UPDATE ON launch_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE launch_events IS 'L2 新发布事件流：来自 PH/HN/X/GitHub/arXiv/HF 等源的产品级事件';
COMMENT ON COLUMN launch_events.source IS '数据源枚举: producthunt | hackernews | github | x | xiaohongshu | arxiv | huggingface | rss';
COMMENT ON COLUMN launch_events.engagement IS 'JSONB: {upvotes, comments, stars, retweets, likes, forks, ...}';
COMMENT ON COLUMN launch_events.raw_data IS '原始 payload 全量备份（用于审计和重算）';

-- =====================================================================
-- Part 3: A 线 — trend_signals（L3 趋势信号）
-- =====================================================================

CREATE TABLE IF NOT EXISTS trend_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type     TEXT NOT NULL,
  scope           TEXT NOT NULL,
  title           TEXT,
  description     TEXT,
  evidence        JSONB NOT NULL DEFAULT '{}'::jsonb,
  strength        REAL NOT NULL DEFAULT 0 CHECK (strength >= 0 AND strength <= 100),
  velocity        REAL NOT NULL DEFAULT 0,
  novelty         REAL NOT NULL DEFAULT 0 CHECK (novelty >= 0 AND novelty <= 1),
  first_seen      TIMESTAMPTZ,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'emerging',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trend_signals_type_check
    CHECK (signal_type IN ('tag_emerging', 'category_growing', 'tech_stack_shift', 'cluster_new', 'funding_pattern')),
  CONSTRAINT trend_signals_status_check
    CHECK (status IN ('emerging', 'peaking', 'cooling', 'expired')),
  CONSTRAINT trend_signals_scope_unique UNIQUE (signal_type, scope)
);

-- 索引：2 个（按 PRD A-2 要求）
CREATE INDEX IF NOT EXISTS idx_trend_status_strength
  ON trend_signals (status, strength DESC);
CREATE INDEX IF NOT EXISTS idx_trend_signal_type
  ON trend_signals (signal_type);

-- scope 业务格式: 'tag:agent-orchestration' / 'category:video-gen' / 'stack:mamba'
COMMENT ON TABLE trend_signals IS 'L3 趋势信号：标签突发 / 品类升温 / 技术堆栈迁移 / 聚类新形态 / 融资模式';
COMMENT ON COLUMN trend_signals.scope IS '作用域 token: tag:<slug> | category:<slug> | stack:<name> | cluster:<id> | funding:<stage>';
COMMENT ON COLUMN trend_signals.evidence IS 'JSONB: {products:[ids], metrics:{...}, sources:[...]}';

-- =====================================================================
-- Part 4: A 线 — categories（分类字典）
-- =====================================================================

CREATE TABLE IF NOT EXISTS categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name_en         TEXT NOT NULL,
  name_zh         TEXT,
  description     TEXT,
  parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  product_count   INTEGER NOT NULL DEFAULT 0 CHECK (product_count >= 0),
  hot_score       REAL NOT NULL DEFAULT 0 CHECK (hot_score >= 0),
  display_order   INTEGER NOT NULL DEFAULT 0,
  icon            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories (display_order);
CREATE INDEX IF NOT EXISTS idx_categories_hot_score ON categories (hot_score DESC);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE categories IS 'L1 分类字典（取代 products.category 字符串枚举）';

-- 兼容老数据：保留 products.category 字符串字段，新老并存
-- 由前端 / 应用层负责渐进迁移（见 ADR-04）

-- =====================================================================
-- Part 5: A 线 — product_signals（产品-信号多对多关联）
-- =====================================================================

CREATE TABLE IF NOT EXISTS product_signals (
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  signal_id       UUID NOT NULL REFERENCES trend_signals(id) ON DELETE CASCADE,
  relevance       REAL NOT NULL DEFAULT 1.0 CHECK (relevance >= 0 AND relevance <= 1),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, signal_id)
);

-- 反向查询：给定 signal 找全部 products
CREATE INDEX IF NOT EXISTS idx_product_signals_signal_id
  ON product_signals (signal_id);
-- 按权重排序：信号详情页可按 relevance 排产品
CREATE INDEX IF NOT EXISTS idx_product_signals_relevance
  ON product_signals (signal_id, relevance DESC);

COMMENT ON TABLE product_signals IS '多对多关联：产品和趋势信号的关联 + 权重';
COMMENT ON COLUMN product_signals.relevance IS '0-1 相关度权重；前端按此排序';

-- =====================================================================
-- Part 6: B 线 — newsletter_subscriptions
-- =====================================================================

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT NOT NULL,
  frequency            TEXT NOT NULL DEFAULT 'daily',
  language             TEXT NOT NULL DEFAULT 'en',
  confirmed_at         TIMESTAMPTZ,
  unsubscribed_at      TIMESTAMPTZ,
  confirmation_token   TEXT UNIQUE,
  unsubscribe_token    TEXT UNIQUE,
  source               TEXT,
  ip_hash              TEXT,
  user_agent           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT newsletter_subscriptions_email_format
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT newsletter_subscriptions_frequency_check
    CHECK (frequency IN ('daily', 'weekly')),
  CONSTRAINT newsletter_subscriptions_language_check
    CHECK (language IN ('en', 'zh')),
  CONSTRAINT newsletter_subscriptions_email_unique
    UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_frequency_active
  ON newsletter_subscriptions (frequency)
  WHERE unsubscribed_at IS NULL AND confirmed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_newsletter_created_at
  ON newsletter_subscriptions (created_at DESC);

DROP TRIGGER IF EXISTS trg_newsletter_updated_at ON newsletter_subscriptions;
CREATE TRIGGER trg_newsletter_updated_at
  BEFORE UPDATE ON newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE newsletter_subscriptions IS 'Newsletter 订阅名单（与 push_channels 分离）';

-- =====================================================================
-- Part 7: 推送触发器 — launch_events INSERT → /webhook/launch
-- =====================================================================

-- 7.1 触发器函数：判断是否满足推送条件
--   条件: event_type='launch' AND source IN (PH, HN, GitHub) AND confidence >= 0.6
--   实现: pg_net.async_get 调用后端 /webhook/launch
--   注意: webhooks_base_url 通过 GUC 配置: SET app.webhooks_base_url = 'https://...';

CREATE OR REPLACE FUNCTION fn_launch_events_notify_push_worker()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook_url TEXT;
  v_should_notify BOOLEAN := FALSE;
  v_payload JSONB;
BEGIN
  -- 条件过滤
  IF NEW.event_type = 'launch'
     AND NEW.source IN ('producthunt', 'hackernews', 'github')
     AND NEW.confidence >= 0.6
     AND (OLD IS NULL)  -- 仅 INSERT 时触发，避免 UPDATE 重复通知
  THEN
    v_should_notify := TRUE;
  END IF;

  IF NOT v_should_notify THEN
    RETURN NEW;
  END IF;

  -- 从 GUC 取后端基础 URL（部署时通过 ALTER DATABASE / SET 设置）
  BEGIN
    v_webhook_url := current_setting('app.webhooks_base_url', TRUE)
                     || '/webhook/launch';
  EXCEPTION WHEN OTHERS THEN
    v_webhook_url := NULL;
  END;

  IF v_webhook_url IS NULL OR v_webhook_url = '/webhook/launch' THEN
    -- 兜底：本地开发使用 NEXT_PUBLIC_SITE_URL 或 envsubst
    v_webhook_url := COALESCE(
      current_setting('app.webhooks_base_url', TRUE),
      'http://localhost:3000'
    ) || '/webhook/launch';
  END IF;

  v_payload := jsonb_build_object(
    'event_id',      NEW.id,
    'product_id',    NEW.product_id,
    'source',        NEW.source,
    'source_url',    NEW.source_url,
    'event_type',    NEW.event_type,
    'title',         NEW.title,
    'body',          NEW.body,
    'engagement',    NEW.engagement,
    'detected_at',   NEW.detected_at,
    'event_at',      NEW.event_at,
    'confidence',    NEW.confidence
  );

  -- pg_net 异步调用（不阻塞 INSERT）
  BEGIN
    PERFORM net.http_post(
      url     := v_webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-AI-Radar-Source', 'launch_events_trigger',
        'X-AI-Radar-Event-Id', NEW.id::text
      ),
      body    := v_payload::text
    );
  EXCEPTION WHEN OTHERS THEN
    -- pg_net 未启用 / 不可用时静默降级（仅 RAISE NOTICE，不抛错）
    RAISE NOTICE 'pg_net not available, launch event % not pushed', NEW.id;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_launch_events_notify_push ON launch_events;
CREATE TRIGGER trg_launch_events_notify_push
  AFTER INSERT ON launch_events
  FOR EACH ROW
  EXECUTE FUNCTION fn_launch_events_notify_push_worker();

COMMENT ON FUNCTION fn_launch_events_notify_push_worker()
  IS 'launch_events INSERT → /webhook/launch 异步推送（pg_net）';

-- 7.2 trend_signals status 变更 → /webhook/trend（可选，P1 范围）
-- 由 push-worker 端用 supabase channel/realtime 监听，本表不额外加 trigger
-- 注释留档，避免后续重复实现

-- =====================================================================
-- Part 8: RLS 策略
-- 原则:
--   - launch_events / trend_signals / categories / product_signals: anon 可读
--   - authenticated 用户可 INSERT/UPDATE 自己的订阅
--   - service_role 全权（crawler 写入用 service_role key）
-- =====================================================================

ALTER TABLE launch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- launch_events: 公开只读
DROP POLICY IF EXISTS launch_events_select_all ON launch_events;
CREATE POLICY launch_events_select_all ON launch_events
  FOR SELECT USING (true);

-- launch_events: 写入仅 service_role（由 RLS 默认拒绝 anon/authenticated 实现）
-- 不显式 INSERT/UPDATE/DELETE policy → 默认拒绝
-- service_role 在 supabase-js 中以 Bypass RLS 角色运行，不受策略限制

-- trend_signals: 公开只读
DROP POLICY IF EXISTS trend_signals_select_all ON trend_signals;
CREATE POLICY trend_signals_select_all ON trend_signals
  FOR SELECT USING (true);

-- categories: 公开只读
DROP POLICY IF EXISTS categories_select_all ON categories;
CREATE POLICY categories_select_all ON categories
  FOR SELECT USING (true);

-- product_signals: 公开只读
DROP POLICY IF EXISTS product_signals_select_all ON product_signals;
CREATE POLICY product_signals_select_all ON product_signals
  FOR SELECT USING (true);

-- newsletter_subscriptions:
--   - INSERT: 允许 anon（公开订阅场景）
--   - SELECT/UPDATE/DELETE: 仅 service_role（用 token + 邮件链接二次校验）
DROP POLICY IF EXISTS newsletter_subscriptions_insert_anon ON newsletter_subscriptions;
CREATE POLICY newsletter_subscriptions_insert_anon ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- 注：anon 的 SELECT/UPDATE 拒绝（无 policy 匹配）
-- 取消订阅通过 service_role + unsubscribe_token 校验路径处理（应用层）

-- =====================================================================
-- Part 9: 视图（可选，简化前端查询）
-- =====================================================================

-- 9.1 v_launches_recent: 给 /launches 页面用
CREATE OR REPLACE VIEW v_launches_recent AS
SELECT
  le.id,
  le.product_id,
  p.slug            AS product_slug,
  p.name            AS product_name,
  p.logo_url        AS product_logo_url,
  le.source,
  le.source_url,
  le.event_type,
  le.title,
  le.body,
  le.author,
  le.engagement,
  le.detected_at,
  le.event_at,
  le.confidence
FROM launch_events le
LEFT JOIN products p ON p.id = le.product_id
WHERE le.event_at >= NOW() - INTERVAL '90 days'
ORDER BY le.event_at DESC NULLS LAST;

COMMENT ON VIEW v_launches_recent IS '/launches 页面 90 天滚动视图';

-- 9.2 v_trends_active: 给 /trends 页面用
CREATE OR REPLACE VIEW v_trends_active AS
SELECT
  ts.id,
  ts.signal_type,
  ts.scope,
  ts.title,
  ts.description,
  ts.evidence,
  ts.strength,
  ts.velocity,
  ts.novelty,
  ts.first_seen,
  ts.last_updated,
  ts.status,
  (SELECT COUNT(*) FROM product_signals ps WHERE ps.signal_id = ts.id) AS product_count
FROM trend_signals ts
WHERE ts.status IN ('emerging', 'peaking', 'cooling')
ORDER BY
  CASE ts.status
    WHEN 'emerging' THEN 1
    WHEN 'peaking'  THEN 2
    WHEN 'cooling'  THEN 3
  END,
  ts.strength DESC;

COMMENT ON VIEW v_trends_active IS '/trends 页面活跃信号视图（含关联产品数）';

-- =====================================================================
-- Part 10: 引导 seed 数据
-- 由 supabase/seed-phase-e-200.sql 负责（独立文件，避免污染本迁移）
-- =====================================================================

-- 验证迁移
DO $$
BEGIN
  RAISE NOTICE '=== Migration 002 完成 ===';
  RAISE NOTICE 'launch_events / trend_signals / categories / product_signals / newsletter_subscriptions 已建';
  RAISE NOTICE 'user_profiles.plan CHECK 已升级';
  RAISE NOTICE 'pg_net 推送触发器已挂载 (launch_events INSERT → /webhook/launch)';
END $$;
