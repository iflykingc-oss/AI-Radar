-- =============================================================
-- AI Radar — Phase E 003 Newsletter Migration 验证脚本
-- =============================================================
-- 作者: 严过关 (QA Engineer)
-- 日期: 2026-06-01
-- 用途: 验证 003_newsletter_partial_unique.sql 已正确应用
--       核心: PARTIAL UNIQUE 索引允许"退订后重订"
-- 执行: psql "$DATABASE_URL" -f scripts/verify-003-newsletter-migration.sql
--       或: pnpm db:verify-003
-- 期望: 4 个 query 全部满足 PASS 条件
-- =============================================================

\set ON_ERROR_STOP on
\timing on

\echo ''
\echo '========================================='
\echo '003 migration 验证 — 启动'
\echo '========================================='

-- -------------------------------------------------------------
-- Q1 [PASS] 验证 idx_newsletter_email_active 是 PARTIAL 索引
-- -------------------------------------------------------------
-- 期望: pg_get_indexdef 输出包含 'WHERE (unsubscribed_at IS NULL)'
--       类似: CREATE UNIQUE INDEX ... ON newsletter_subscriptions
--             USING btree (email) WHERE (unsubscribed_at IS NULL)
\echo ''
\echo '--- Q1: 索引定义 (应含 WHERE unsubscribed_at IS NULL) ---'
SELECT
  pg_get_indexdef('idx_newsletter_email_active'::regclass) AS index_def;

\echo ''
\echo '--- Q1b: 索引元信息 (应 indexdef LIKE %WHERE%) ---'
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname = 'idx_newsletter_email_active';

-- -------------------------------------------------------------
-- Q2 [COUNT] 确认 PARTIAL 索引存在且唯一
-- -------------------------------------------------------------
-- 期望: count = 1
\echo ''
\echo '--- Q2: 索引存在性 (应 1) ---'
SELECT
  count(*) AS idx_count
FROM pg_indexes
WHERE indexname = 'idx_newsletter_email_active';

-- -------------------------------------------------------------
-- Q3 [PASS] 老约束 newsletter_subscriptions_email_unique 已 DROP
-- -------------------------------------------------------------
-- 期望: count = 0 (老约束不存在)
\echo ''
\echo '--- Q3: 老约束残留检查 (应 0) ---'
SELECT
  count(*) AS old_constraint_count
FROM pg_constraint
WHERE conname = 'newsletter_subscriptions_email_unique';

-- -------------------------------------------------------------
-- Q4 [功能] 退订→重订场景的实际验证 (P0-1 修复核心)
-- -------------------------------------------------------------
-- 准备: 插入测试订阅 → 退订 → 再插入同 email → 应成功
-- 清理: 末尾删除测试数据
\echo ''
\echo '--- Q4: 退订→重订流程验证 (核心 P0-1 修复) ---'

BEGIN;

-- 4.1 准备测试邮箱 (使用 transaction 隔离, 不影响真实数据)
DO $$
DECLARE
  v_test_email TEXT := 'qa-verify-003-' || extract(epoch from now())::text || '@example.com';
  v_sub_id_1 UUID;
  v_sub_id_2 UUID;
BEGIN
  -- 4.1 首次插入 (应成功)
  INSERT INTO newsletter_subscriptions (email, frequency, language, source)
  VALUES (v_test_email, 'daily', 'en', 'qa-verify-003')
  RETURNING id INTO v_sub_id_1;
  RAISE NOTICE '4.1 首次订阅: id=%', v_sub_id_1;

  -- 4.2 标记退订
  UPDATE newsletter_subscriptions
  SET unsubscribed_at = NOW()
  WHERE id = v_sub_id_1;
  RAISE NOTICE '4.2 退订成功: id=%', v_sub_id_1;

  -- 4.3 再次插入同 email (PARTIAL 索引允许)
  INSERT INTO newsletter_subscriptions (email, frequency, language, source)
  VALUES (v_test_email, 'weekly', 'zh', 'qa-verify-003-resub')
  RETURNING id INTO v_sub_id_2;
  RAISE NOTICE '4.3 重新订阅: id=% (应与 4.1 id 不同)', v_sub_id_2;

  -- 4.4 验证: 两条记录共存
  IF v_sub_id_1 = v_sub_id_2 THEN
    RAISE EXCEPTION 'FAIL: 重新订阅返回了旧 id, PARTIAL 索引未生效';
  END IF;

  -- 4.5 验证: active (unsubscribed_at IS NULL) 记录只有 1 条
  IF (SELECT count(*) FROM newsletter_subscriptions
      WHERE email = v_test_email AND unsubscribed_at IS NULL) <> 1 THEN
    RAISE EXCEPTION 'FAIL: active 记录数 != 1, PARTIAL 索引未生效';
  END IF;
  RAISE NOTICE '4.4 PASS: 退订→重订流程正常, 部分唯一索引生效';

  -- 4.6 反例验证: 两条 active 同 email 应被拒
  BEGIN
    INSERT INTO newsletter_subscriptions (email, frequency, language, source)
    VALUES (v_test_email, 'daily', 'en', 'qa-verify-003-dup-active');
    RAISE EXCEPTION 'FAIL: 两条 active 同 email 都被允许, PARTIAL 索引未生效';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE '4.5 PASS: 两条 active 同 email 被拒 (unique_violation)';
  END;

  -- 4.7 清理测试数据
  DELETE FROM newsletter_subscriptions
  WHERE email = v_test_email;
  RAISE NOTICE '4.6 清理完成';
END $$;

ROLLBACK;  -- 整个 Q4 用 ROLLBACK 兜底, 不会污染真实数据

-- -------------------------------------------------------------
-- Q5 [补充] 验证 newsletter_subscriptions 表存在
-- -------------------------------------------------------------
\echo ''
\echo '--- Q5: 表存在性 (应 1) ---'
SELECT
  count(*) AS table_count
FROM information_schema.tables
WHERE table_name = 'newsletter_subscriptions';

-- -------------------------------------------------------------
-- Q6 [补充] 验证 source 列存在 (T07 NewsletterForm 依赖)
-- -------------------------------------------------------------
\echo ''
\echo '--- Q6: source 列存在 (T07 依赖) ---'
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'newsletter_subscriptions'
  AND column_name IN ('source', 'unsubscribed_at', 'confirmation_token', 'unsubscribe_token')
ORDER BY column_name;

\echo ''
\echo '========================================='
\echo '003 migration 验证 — 完成'
\echo ''
\echo 'PASS 标准:'
\echo '  Q1: indexdef 含 WHERE (unsubscribed_at IS NULL)'
\echo '  Q2: idx_count = 1'
\echo '  Q3: old_constraint_count = 0'
\echo '  Q4: 退订→重订流程全部 NOTICE 输出, 0 EXCEPTION'
\echo '  Q5: table_count = 1'
\echo '  Q6: 4 列齐全 (source/unsubscribed_at/confirmation_token/unsubscribe_token)'
\echo '========================================='
