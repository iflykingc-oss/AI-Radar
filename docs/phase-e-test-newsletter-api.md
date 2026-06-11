# AI Radar — Phase E W1 Newsletter API 测试用例

> **作者**: 严过关 (QA Engineer)
> **日期**: 2026-06-01
> **优先级**: P0 (老板催上线)
> **状态**: v1 预写 (基于 API 契约 §5, T05 路由未就绪, 工程师报回后立即跑)
> **关联文档**:
> - `docs/phase-e-api-contracts.md` §5 (Newsletter API 契约)
> - `docs/phase-e-task-breakdown.md` T05 (W1 任务)
> - `docs/phase-e-prd-incremental.md` B-2 (Newsletter 订阅表单)
> - `scripts/verify-003-newsletter-migration.sql` (P0-1 验证)
> - `scripts/w1-smoke.sh` (本文件配套自动执行)

---

## 0. 概览

| 维度 | 数据 |
|------|------|
| 用例总数 | 11 (T05-001 ~ T05-011) |
| 正常路径 | 4 (T05-001/003/007/011) |
| 错误路径 | 5 (T05-002/004/006/008/009) |
| 业务流程 | 2 (T05-005 退订→重订, T05-010 unsubscribe) |
| 验证 P0-1 修复 | T05-005 + T05-011 (核心) |
| 自动化 | 11/11 (全部走 w1-smoke.sh) |

---

## 1. 错误码速查表 (用例引用)

| 业务码 | 含义 | 触发场景 | HTTP |
|--------|------|----------|------|
| 0 | 成功 | subscribe/confirm 成功 | 200/201 |
| 4000 | 通用参数错 | email 空 / token 缺失 | 400 |
| 4001 | 字段格式错 | email 格式非法 (xxx@yyy) | 400 |
| 4002 | 必填缺失 | email 未传 | 400 |
| 4003 | 资源不存在 | token 不存在/已使用 | 400 |
| 4004 | 鉴权失败 | (本 API 不触发) | 401 |
| 4006 | 重复订阅 | active 状态同 email 再次订阅 | 409 |
| 4007 | 限流触发 | 60s 内 ≥ 5 次同 email | 429 |
| 5000 | 服务端错 | 内部异常 | 500 |

---

## 2. 用例详情

---

### T05-001 [正常] 首次订阅 daily 频率

**目标**: 验证 happy path, 正常邮箱+频率+语言返回 201 + 记录入库

**优先级**: P0
**契约参考**: §5.1 POST /api/newsletter/subscribe

**预置**:
- 邮箱 `qa-t05-001-<timestamp>@example.com` (唯一)
- frequency='daily', language='en', source='w1-smoke'

**步骤**:
```bash
curl -X POST "$BASE_URL/api/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$EMAIL_001"'","frequency":"daily","language":"en","source":"w1-smoke"}'
```

**断言**:
| 字段 | 期望 |
|------|------|
| HTTP | 201 |
| code | 0 |
| data.subscription_id | UUID 格式 |
| data.email | 与输入一致 |
| data.frequency | "daily" |
| data.confirmation_required | true |
| data.mock_email_sent | true (Phase E) |
| message | "Please check your email to confirm subscription" |

**DB 验证**:
```sql
SELECT email, frequency, language, source, confirmation_token IS NOT NULL AS has_token
FROM newsletter_subscriptions
WHERE email = 'qa-t05-001-...@example.com';
-- 期望: 1 行, has_token=true, confirmed_at=NULL, unsubscribed_at=NULL
```

**通过条件**:
- HTTP 201 + code 0
- DB 记录入库, token 生成
- 响应时间 P95 < 500ms

---

### T05-002 [错误] 邮箱格式错 → 4001

**目标**: 验证 email 格式校验 (RFC 5322 简版)

**优先级**: P0
**契约参考**: §5.1 错误码 4000/4001/4002

**预置**:
- 测试邮箱 `invalid-no-at-sign` (无 @)

**步骤**:
```bash
curl -X POST "$BASE_URL/api/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-no-at-sign","frequency":"daily"}'
```

**断言**:
| 字段 | 期望 |
|------|------|
| HTTP | 400 |
| code | 4001 (字段格式错误) |
| data | null |
| message | 含 "Invalid email format" 或 "email format" |

**扩展场景** (一 case 多断言):
| 输入 | 期望 |
|------|------|
| `xxx@yyy` (无 TLD) | 4001 |
| `xxx@yyy.zz` | 201 (通过) |
| `@yyy.zz` (空本地) | 4001 |
| `xxx@.zz` (空域) | 4001 |
| 空字符串 `""` | 4002 (必填缺失) 或 4000 |
| 缺字段 | 4002 |

**通过条件**:
- 所有非法格式返回 4xx, 不入库
- 合法格式返回 201 (回归)

**盲点参考**: API §5.1 提到 "RFC 5322 简版", 简版的具体正则未明, 需在执行时确认工程师实现的正则严格度

---

### T05-003 [正常] 重复 email 首次 → 201

**目标**: 同邮箱首次订阅正常返回 201

**优先级**: P0
**契约参考**: §5.1 happy path

**预置**:
- 邮箱 `qa-t05-003-<timestamp>@example.com` (全新, 此前未订阅)

**步骤**:
```bash
curl -X POST "$BASE_URL/api/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$EMAIL_003"'","frequency":"weekly","language":"zh"}'
```

**断言**:
| 字段 | 期望 |
|------|------|
| HTTP | 201 |
| code | 0 |
| data.frequency | "weekly" (echo) |
| data.language | "zh" (echo) |

**通过条件**:
- 与 T05-001 类似, 但 frequency/language 不同, 验证 echo 正确

---

### T05-004 [错误] 重复 email 再次 → 4006

**目标**: 同 email 在 active 状态重复订阅返回 4006 + 重复订阅信息

**优先级**: P0 (P0-1 修复相关)
**契约参考**: §5.1 错误码 4006

**预置**:
- 复用 T05-003 的邮箱 (刚订阅, unsubscribed_at=NULL)

**步骤**:
```bash
# 第二次订阅同 email
curl -X POST "$BASE_URL/api/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$EMAIL_003"'","frequency":"daily","language":"en"}'
```

**断言**:
| 字段 | 期望 |
|------|------|
| HTTP | 409 (或 200, 视实现) |
| code | 4006 |
| data.subscription_id | UUID (已存在记录) |
| data.already_subscribed | true |
| data.frequency | "weekly" (已存在的频率, 非新值) |
| message | "Email already subscribed" |

**DB 验证**:
```sql
SELECT count(*) FROM newsletter_subscriptions
WHERE email = 'qa-t05-003-...' AND unsubscribed_at IS NULL;
-- 期望: 1 (仍是 T05-003 插入的, 没有新增)
```

**通过条件**:
- HTTP 4xx, code 4006
- 数据库 active 记录仍为 1 条 (无重复入库)
- 返回的 subscription_id 是已存在记录

**盲点参考**: HTTP Status: 契约文档没明说 4006 映射的 HTTP code, 可能是 409 (Conflict) 或 200 (视为成功但告知已存在), 工程师实现后确认

---

### T05-005 [P0-1 修复验证] 退订后重新订阅 → 201

**目标**: **P0-1 修复的核心验证** — PARTIAL UNIQUE 索引允许"退订后重订"

**优先级**: P0 (老板催, 关键回归)
**契约参考**: §5.1 + 架构 ADR (退订用 unsubscribed_at 软标记)
**修复关联**: `003_newsletter_partial_unique.sql`

**预置**:
- 邮箱 `qa-t05-005-<timestamp>@example.com`
- T05-003 之后, 该邮箱 active 状态

**步骤**:
```bash
# 5.1 首次订阅 (前置)
curl -X POST "$BASE_URL/api/newsletter/subscribe" -d '{"email":"'"$EMAIL_005"'","frequency":"daily"}'
# 期望 201

# 5.2 模拟退订 (直接 DB 更新, 模拟邮件退订链接点击)
psql -c "UPDATE newsletter_subscriptions SET unsubscribed_at = NOW() WHERE email = '$EMAIL_005';"

# 5.3 重新订阅同 email
curl -X POST "$BASE_URL/api/newsletter/subscribe" \
  -d '{"email":"'"$EMAIL_005"'","frequency":"weekly","language":"zh","source":"resub-test"}'
```

**断言** (5.3):
| 字段 | 期望 |
|------|------|
| HTTP | 201 |
| code | 0 |
| data.subscription_id | **新 UUID** (与 5.1 不同) |
| data.frequency | "weekly" (新值) |

**DB 验证**:
```sql
-- 5.4 验证: 两条记录共存
SELECT id, frequency, unsubscribed_at, source
FROM newsletter_subscriptions
WHERE email = '$EMAIL_005'
ORDER BY created_at;
-- 期望: 2 行
--   - row 1: frequency=daily, unsubscribed_at=<time>, source='w1-smoke'
--   - row 2: frequency=weekly, unsubscribed_at=NULL, source='resub-test'

-- 5.5 验证: active 记录只有 1 条
SELECT count(*) FROM newsletter_subscriptions
WHERE email = '$EMAIL_005' AND unsubscribed_at IS NULL;
-- 期望: 1 (row 2)

-- 5.6 反例: 再次 active 重复订阅应被拒
curl -X POST "$BASE_URL/api/newsletter/subscribe" -d '{"email":"'"$EMAIL_005"'","frequency":"daily"}'
-- 期望: 4006
```

**通过条件**:
- 5.1 返回 201
- 5.3 返回 201 且 subscription_id 与 5.1 不同 ← **P0-1 修复核心**
- DB 中 2 条记录 (1 unsubscribed + 1 active)
- 5.6 返回 4006 (PARTIAL 索引仍约束 active 唯一)

**失败诊断**:
- 若 5.3 返回 5001 或 4006 → 003 migration 未生效 (老 UNIQUE 约束还在)
- 若 5.6 返回 201 → PARTIAL 索引未生效 (退化到无 UNIQUE)

---

### T05-006 [错误] frequency=hourly 非法 → 4004

**目标**: 验证 frequency 枚举校验 (仅 daily/weekly 合法)

**优先级**: P0
**契约参考**: §5.1 frequency 枚举

**预置**:
- 邮箱 `qa-t05-006-<timestamp>@example.com`

**步骤**:
```bash
curl -X POST "$BASE_URL/api/newsletter/subscribe" \
  -d '{"email":"'"$EMAIL_006"'","frequency":"hourly"}'
```

**断言**:
| 字段 | 期望 |
|------|------|
| HTTP | 400 |
| code | 4000 (通用参数错) 或 4001 (字段格式) |
| message | 含 "frequency" 或 "Invalid frequency" |

**盲点参考**: 契约文档 §5.1 错误码列了 4001 (字段格式), 但 T05 用例任务说 "frequency=hourly 非法 → 4004" — 4004 在 API 契约是"鉴权失败", 这里疑似 typo, 应是 4000/4001。**测试时按实际工程师实现 code 断言, 兼容 4000 或 4001**

**扩展**: 同样测 `language='jp'` (非法, 枚举仅 en/zh) → 4000/4001

**通过条件**:
- 非法 frequency/language 返回 4xx
- 不入库

---

### T05-007 [正常] confirm token 有效 → 200 + confirmed_at 写入

**目标**: 邮箱中 confirm 链接点击, 标记 confirmed_at

**优先级**: P0
**契约参考**: §5.2 GET /api/newsletter/confirm

**预置**:
- T05-001 订阅后, 从 DB 取 confirmation_token

**步骤**:
```bash
TOKEN=$(psql -t -A -c "SELECT confirmation_token FROM newsletter_subscriptions WHERE email = '$EMAIL_001';")

curl -s "$BASE_URL/api/newsletter/confirm?token=$TOKEN"
```

**断言**:
| 字段 | 期望 |
|------|------|
| HTTP | 200 |
| code | 0 |
| data.subscription_id | 与 T05-001 一致 |
| data.email | 与 T05-001 一致 |
| data.frequency | "daily" |
| data.confirmed_at | ISO 8601 时间戳 |
| message | "Subscription confirmed" |

**DB 验证**:
```sql
SELECT confirmed_at FROM newsletter_subscriptions WHERE email = '$EMAIL_001';
-- 期望: confirmed_at IS NOT NULL, 等于响应中的值
```

**副作用** (契约 §5.2):
- push-worker 触发"欢迎订阅"邮件 (mock)

**通过条件**:
- 200 + code 0
- confirmed_at 写入
- 同一 token 再次 confirm → 幂等 (T05-008 测失效情况)

---

### T05-008 [错误] confirm token 失效 → 4000/4003

**目标**: 验证无效 token (不存在/已使用) 的错误码

**优先级**: P0
**契约参考**: §5.2 错误码 4000/4003

**预置**:
- 场景 A: 随机伪造 token `'fake-token-12345-xyz'`
- 场景 B: 已使用过的 token (T05-007 用了后, 再用一次)

**步骤**:
```bash
# 场景 A
curl -s "$BASE_URL/api/newsletter/confirm?token=fake-token-12345-xyz"

# 场景 B (复用 T05-007 的 token)
curl -s "$BASE_URL/api/newsletter/confirm?token=$TOKEN_007"
```

**断言**:
| 场景 | 字段 | 期望 |
|------|------|------|
| A | HTTP | 400 |
| A | code | 4003 (token 不存在) |
| A | message | 含 "token" 或 "not found" |
| B | HTTP | 400 |
| B | code | 4003 (token 已使用) **或 4000 (通用错)** |
| B | message | 含 "token" |

**盲点参考**:
- 任务 T05-008 写"4000/4003 (注意不是 4007)" — 4007 是限流错误码, 此处确认不会是 4007
- 工程师实现时需明确: 已使用的 token 是 4003 (视为不存在) 还是 4000 (视为参数错)
- 测试时按实际断言, 但**必须不是 4007**

**通过条件**:
- 两个场景都返回 4xx
- code ≠ 4007
- 不修改 DB (confirmed_at 仍为 T05-007 的值, 不重复更新)

---

### T05-009 [错误] 限流 5 次/60s → 第 5 次 4007

**目标**: 验证 rate limit (5 次/60s/IP 或 /user, 契约 §0.4)

**优先级**: P1
**契约参考**: §0.4 限流 + §5.1 错误码 4007

**预置**:
- 邮箱 `qa-t05-009-<timestamp>@example.com` (每次不同, 避免 4006 干扰)
- 准备 5 个不同邮箱

**步骤**:
```bash
for i in 1 2 3 4 5; do
  EMAIL="qa-t05-009-${i}-$(date +%s)@example.com"
  echo "Request $i: $EMAIL"
  curl -X POST "$BASE_URL/api/newsletter/subscribe" \
    -d "{\"email\":\"$EMAIL\",\"frequency\":\"daily\"}" \
    -w "\nHTTP=%{http_code}\n"
  sleep 0.5
done
```

**断言**:
| 第 N 次 | HTTP | code | 备注 |
|--------|------|------|------|
| 1 | 201 | 0 | OK |
| 2 | 201 | 0 | OK |
| 3 | 201 | 0 | OK |
| 4 | 201 | 0 | OK |
| 5 | 429 | 4007 | 限流触发 |
| 6 (额外) | 429 | 4007 | 持续触发 |

**盲点参考**: 契约 §0.4 写"留 `lib/rateLimit.ts` 占位, Phase E 注释 `// TODO: 接 Vercel KV` 不实际生效"。**若工程师按 TODO 不实现限流, 此用例 T05-009 跳过, 标记 P1 待 W2+ 实现**

**通过条件**:
- **如实现限流**: 5 次后 429 + 4007
- **如未实现**: 5 次都 201, 用例标记 PENDING, 不阻塞 W1 验收

---

### T05-010 [业务流程] confirm 后 unsubscribe → 200 + unsubscribed_at 写入

**目标**: 验证退订流程 (邮件中 unsubscribe 链接)

**优先级**: P0
**契约参考**: §5.2 副作用 (推"欢迎订阅"邮件) + 退订流程 (软标记 unsubscribed_at)

**预置**:
- T05-007 已 confirm 的订阅 (confirmed_at IS NOT NULL)
- 取 unsubscribe_token

**步骤**:
```bash
UNSUB_TOKEN=$(psql -t -A -c "SELECT unsubscribe_token FROM newsletter_subscriptions WHERE email = '$EMAIL_001';")

curl -s "$BASE_URL/api/newsletter/unsubscribe?token=$UNSUB_TOKEN" \
  -X POST
# 或 DELETE, 视 API 设计
```

**盲点参考**: 契约文档未明列 unsubscribe 端点, 推测为 `POST/GET /api/newsletter/unsubscribe?token=xxx`。**工程师实现时需确认端点路径和方法**

**断言**:
| 字段 | 期望 |
|------|------|
| HTTP | 200 |
| code | 0 |
| data.email | 与 T05-001 一致 |
| message | "Unsubscribed" 或 "已退订" |

**DB 验证**:
```sql
SELECT unsubscribed_at FROM newsletter_subscriptions WHERE email = '$EMAIL_001';
-- 期望: unsubscribed_at IS NOT NULL (即 T05-010 写入的时间)
```

**通过条件**:
- 200 + code 0
- unsubscribed_at 写入 (与 confirmed_at 不同的时间)
- 后续 T05-005 验证: 该 email 可被重新订阅

---

### T05-011 [P0-1 验证] 再 subscribe 同 email → 201 (部分唯一索引允许)

**目标**: 退订后重新订阅 (T05-010 之后), PARTIAL 索引允许

**优先级**: P0 (P0-1 修复验证)
**契约参考**: §5.1 + 架构 ADR
**修复关联**: 同 T05-005, 此为更完整链路

**预置**:
- T05-010 退订后的 email (unsubscribed_at IS NOT NULL)

**步骤**:
```bash
curl -X POST "$BASE_URL/api/newsletter/subscribe" \
  -d '{"email":"'"$EMAIL_001"'","frequency":"daily","language":"en","source":"after-unsub-resub"}'
```

**断言**:
| 字段 | 期望 |
|------|------|
| HTTP | 201 |
| code | 0 |
| data.subscription_id | **新 UUID** (与 T05-001 不同) |

**DB 验证**:
```sql
-- 验证: 2 条记录 (1 unsubscribed + 1 new active)
SELECT id, frequency, unsubscribed_at IS NOT NULL AS is_unsub
FROM newsletter_subscriptions
WHERE email = '$EMAIL_001'
ORDER BY created_at;
-- 期望: 2 行, 第一行 is_unsub=true, 第二行 is_unsub=false

-- 验证: 新 active 记录与 T05-001 频率可能不同 (允许重订时改 frequency)
SELECT frequency FROM newsletter_subscriptions
WHERE email = '$EMAIL_001' AND unsubscribed_at IS NULL;
-- 期望: 1 行, frequency='daily' (T05-011 传 daily, 与 T05-001 一致)
```

**通过条件**:
- 201 + 新 subscription_id
- DB 中存在 unsubscribed 旧记录 + active 新记录
- PARTIAL 索引工作: active 唯一, 已退订不阻塞

**与 T05-005 关系**:
- T05-005: 退订后重订 (基本场景, frequency 可能改变)
- T05-011: T05-007 confirm → T05-010 unsubscribe → 重订 (完整生命周期)
- 两者**都通过** = P0-1 修复 100% 验证

---

## 3. 执行顺序与依赖

```
[前置] 验证 003 migration 已应用
   ↓
T05-001  正常订阅 daily         ←── 用例 #1
   ↓
T05-002  邮箱格式错             ←── 用例 #2 (独立)
   ↓
T05-003  重复 email 首次        ←── 用例 #3 (独立)
   ↓
T05-004  重复 email 再次 → 4006 ←── 用例 #4 (依赖 T05-003)
   ↓
T05-005  退订后重订 (P0-1)     ←── 用例 #5 (依赖 T05-003 + DB 退订)
   ↓
T05-006  frequency=hourly 错   ←── 用例 #6 (独立)
   ↓
T05-007  confirm token 有效    ←── 用例 #7 (依赖 T05-001)
   ↓
T05-008  confirm token 失效    ←── 用例 #8 (依赖 T05-007 后复用 token)
   ↓
T05-009  限流 (5 次/60s)      ←── 用例 #9 (独立, 需 5 个不同邮箱)
   ↓
T05-010  unsubscribe           ←── 用例 #10 (依赖 T05-007 已 confirm)
   ↓
T05-011  再 subscribe 同 email ←── 用例 #11 (依赖 T05-010)
```

**总耗时预估**: 11 个 case × 平均 3s = 33s (无 sleep) / 60s (含 sleep 防限流)

---

## 4. P0-1 修复验证矩阵

> P0-1 修复的**所有**验证点必须在 T05-005 + T05-011 同时通过才算闭环

| 场景 | 期望 | 验证 case |
|------|------|-----------|
| 首次订阅 | 201 | T05-001 |
| 退订 (软标记 unsubscribed_at) | 200 | T05-010 |
| 退订后重订 (PARTIAL 索引允许) | 201 + 新 id | T05-005 + T05-011 |
| 两条 active 同 email (PARTIAL 约束) | 4006 | T05-005 的 5.6 反例 |
| 退订+重订+再退订 (3 态共存) | 201 | T05-011 之后可继续 T05-010 流程 |
| 老 UNIQUE 约束已 DROP | DB 验证 | `scripts/verify-003-newsletter-migration.sql` Q3 |

---

## 5. 自动化脚本

> 11 个用例**全部**由 `scripts/w1-smoke.sh` 自动执行
> 工程师 T05 路由 ready 后, 5 分钟内跑完整个 smoke, 输出 PASS/FAIL 报告

**调用**:
```bash
export BASE_URL=https://<vercel-deploy>.vercel.app
export DATABASE_URL=postgresql://...
bash scripts/w1-smoke.sh
```

**输出示例**:
```
[1/11] T05-001 正常订阅 daily         ... PASS (201, code 0)
[2/11] T05-002 邮箱格式错             ... PASS (400, code 4001)
[3/11] T05-003 重复 email 首次        ... PASS (201, code 0)
[4/11] T05-004 重复 email 再次 → 4006 ... PASS (409, code 4006)
[5/11] T05-005 退订后重订 (P0-1)      ... PASS (201, new subscription_id)
[6/11] T05-006 frequency=hourly 错   ... PASS (400, code 4000)
[7/11] T05-007 confirm token 有效    ... PASS (200, code 0)
[8/11] T05-008 confirm token 失效    ... PASS (400, code 4003)
[9/11] T05-009 限流 5 次/60s         ... SKIP (Phase E TODO 未实现)
[10/11] T05-010 unsubscribe           ... PASS (200, code 0)
[11/11] T05-011 再 subscribe 同 email ... PASS (201, new id)

Summary: 10 PASS / 0 FAIL / 1 SKIP
P0-1 修复验证: ✅ PASS
```

---

## 6. 已知盲点 (执行时关注)

| # | 盲点 | 备注 |
|---|------|------|
| **BL-N1** | HTTP Status 与 code 映射 | 契约文档没明说 4006 映射的 HTTP code, T05-004 实际可能是 200/409 |
| **BL-N2** | 限流实现 | 契约 §0.4 写 TODO 不实现, T05-009 需 SKIP 兼容 |
| **BL-N3** | unsubscribe 端点 | 契约未列, 推测 POST/GET /api/newsletter/unsubscribe, 工程师实现后确认 |
| **BL-N4** | email 正则严格度 | 简版 RFC 5322, 实际正则需测试边界 (xxx@yyy, xxx@yyy.zz) |
| **BL-N5** | T05-006 错误码 | 任务说 4004, 实际可能是 4000/4001 (4004 是鉴权失败, 语义不对) |
| **BL-N6** | 退订幂等 | 二次 unsubscribe 同 token 应 4003, 本测试不覆盖 (P2 边缘) |
| **BL-N7** | mock 邮件副作用 | T05-007 后 push-worker 触发 mock 邮件, 仅看日志, 不在 API 响应中体现 |

---

## 7. 不在测试范围

- ❌ push-worker 内部邮件模板渲染 (Phase E mock, 看日志)
- ❌ 退订邮件退订 (unsubscribe 邮件中的链接 → 二次退订)
- ❌ GDPR 数据导出 / 删除 (PM 排除)
- ❌ 国际化邮件模板 (Phase E 仅英文)
- ❌ 高并发压测 (Phase F+)

---

**W1 Newsletter API 测试就绪。等 T05 路由 ready, 5 分钟 smoke 出报告。**
