-- ============================================================================
-- 003_newsletter_partial_unique.sql
--
-- P0 修复: 将 newsletter_subscriptions.email 的全局 UNIQUE 改为部分 UNIQUE
--
-- 背景:
--   002 创建时用 `CONSTRAINT ... UNIQUE (email)` 全局唯一, 与 ADR-04 R6 软退订
--   (unsubscribed_at 标记, 不物理删除) 策略冲突: 用户退订后, 旧记录仍占 UNIQUE,
--   重订阅时 INSERT 失败或被 4006 错误码误判为重复订阅。
--
-- 修复:
--   - DROP 原 constraint
--   - CREATE 部分 UNIQUE INDEX, 仅对未退订记录强制 UNIQUE
--   - 这样 unsubscribe → 旧记录 unsubscribed_at 置位, UNIQUE 释放该 email
--   - re-subscribe → 新记录可正常 INSERT
--
-- 幂等: 全部使用 IF EXISTS, 可重复执行
-- 兼容: 002 已使用 CREATE TABLE IF NOT EXISTS, 不会重跑; 此 003 是补丁
-- ============================================================================

-- 1. 卸掉老的全局 UNIQUE constraint
ALTER TABLE newsletter_subscriptions
  DROP CONSTRAINT IF EXISTS newsletter_subscriptions_email_unique;

-- 2. 卸掉旧的 email 普通索引 (如果存在), 避免与新的 partial UNIQUE 冲突
DROP INDEX IF EXISTS idx_newsletter_email;

-- 3. 新建 partial UNIQUE index: 仅对未退订记录强制 email 唯一
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_email_active
  ON newsletter_subscriptions (email)
  WHERE unsubscribed_at IS NULL;

-- 4. 添加注释 (方便 DBA 巡检时理解)
COMMENT ON INDEX idx_newsletter_email_active IS
  'Partial unique index: only enforce uniqueness on active (non-unsubscribed) subscriptions. Re-subscribe after unsubscribe is allowed.';

-- 5. 验证 (跑完应返回 1 行, 显示新索引存在)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'newsletter_subscriptions'
      AND indexname = 'idx_newsletter_email_active'
      AND indexdef LIKE '%WHERE%unsubscribed_at IS NULL%'
  ) THEN
    RAISE NOTICE 'OK: idx_newsletter_email_active (partial unique) 已生效';
  ELSE
    RAISE EXCEPTION 'FAIL: idx_newsletter_email_active 索引未生效, 请人工排查';
  END IF;
END $$;
