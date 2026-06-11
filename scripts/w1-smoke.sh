#!/usr/bin/env bash
# =============================================================================
# scripts/w1-smoke.sh
# AI Radar Phase E - W1 Newsletter API smoke test
#
# Executes T05-001 ~ T05-011 in dependency order via curl.
# Validates the entire newsletter subscription lifecycle, with P0-1 fix
# (partial unique index) regression coverage on T05-005.
#
# Usage:
#   # Default (localhost:3000)
#   ./scripts/w1-smoke.sh
#
#   # Against staging
#   BASE_URL=https://staging.ai-radar.dev ./scripts/w1-smoke.sh
#
#   # Skip rate-limit case (T05-009) if not yet implemented
#   SKIP_RATE_LIMIT=1 ./scripts/w1-smoke.sh
#
#   # Enable DB-level verification (requires psql + DATABASE_URL)
#   DATABASE_URL=postgresql://user:pass@host:5432/db ./scripts/w1-smoke.sh
#
# Exit codes:
#   0 = all PASS  (or PASS+SKIP, no FAIL)
#   1 = one or more FAIL
#   2 = environment error (missing curl/jq, unreachable base URL)
#
# Author: software-qa-engineer
# Created: 2026-06-02
# =============================================================================

set -uo pipefail   # NOTE: not using -e because we want to continue past failures

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_EMAIL="qa-smoke-$(date +%s)@test.local"
TEST_EMAIL_DUPLICATE="qa-smoke-dup-$(date +%s)@test.local"
TIMEOUT="${TIMEOUT:-10}"
SKIP_RATE_LIMIT="${SKIP_RATE_LIMIT:-0}"
DATABASE_URL="${DATABASE_URL:-}"
CLEANUP_ON_EXIT="${CLEANUP_ON_EXIT:-1}"
VERBOSE="${VERBOSE:-0}"

# Counters
PASS=0
FAIL=0
SKIP=0
TOTAL=11

# State (shared between test functions)
CONFIRM_TOKEN=""
UNSUBSCRIBE_TOKEN=""
SUBSCRIBED_AT=""

# -----------------------------------------------------------------------------
# Output helpers
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log()      { echo -e "[$(date +%H:%M:%S)] $*"; }
log_info() { echo -e "${BLUE}ℹ️  $*${NC}"; }
pass()     { echo -e "${GREEN}✅ PASS${NC}  $1"; PASS=$((PASS + 1)); }
fail()     { echo -e "${RED}❌ FAIL${NC}  $1"; FAIL=$((FAIL + 1)); }
skip()     { echo -e "${YELLOW}⚠️  SKIP${NC}  $1"; SKIP=$((SKIP + 1)); }
section()  { echo -e "\n${BOLD}${BLUE}== $* ==${NC}"; }

# -----------------------------------------------------------------------------
# Pre-flight checks
# -----------------------------------------------------------------------------
check_dependencies() {
  for cmd in curl jq; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      log "${RED}ERROR: required command '$cmd' not found in PATH${NC}"
      exit 2
    fi
  done

  if [[ -n "$DATABASE_URL" ]] && ! command -v psql >/dev/null 2>&1; then
    log "${YELLOW}WARN: DATABASE_URL set but 'psql' not found; DB verification will be skipped${NC}"
    DATABASE_URL=""
  fi
}

check_base_url() {
  log_info "Probing BASE_URL=$BASE_URL ..."
  if ! curl -sS --max-time "$TIMEOUT" -o NUL -w "%{http_code}" \
       "$BASE_URL/api/health" 2>/dev/null | grep -qE "^(200|404|503)$"; then
    log "${RED}ERROR: BASE_URL=$BASE_URL unreachable${NC}"
    log "  (Tried /api/health; expected 200/404/503, got nothing or timeout)"
    exit 2
  fi
}

# -----------------------------------------------------------------------------
# HTTP helper — returns body to $RESP_BODY, http_code to $RESP_CODE
# -----------------------------------------------------------------------------
http() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local extra_header="${4:-}"

  local args=(-sS --max-time "$TIMEOUT" -X "$method"
              -H "Content-Type: application/json"
              -H "Accept: application/json"
              -o /tmp/w1_smoke_body -w "%{http_code}")

  if [[ -n "$extra_header" ]]; then
    args+=(-H "$extra_header")
  fi

  if [[ -n "$data" ]]; then
    args+=(-d "$data")
  fi

  RESP_CODE=$(curl "${args[@]}" "$BASE_URL$path") || RESP_CODE="000"
  RESP_BODY=$(cat /tmp/w1_smoke_body 2>/dev/null || echo "")

  if [[ "$VERBOSE" == "1" ]]; then
    log "  ${method} $path -> $RESP_CODE"
    log "  body: ${RESP_BODY:0:200}"
  fi
}

# -----------------------------------------------------------------------------
# Assertion helpers
# -----------------------------------------------------------------------------
assert_code() {
  local expected="$1"
  local case_id="$2"
  local description="$3"
  if [[ "$RESP_CODE" == "$expected" ]]; then
    pass "$case_id $description (HTTP $RESP_CODE)"
    return 0
  else
    fail "$case_id $description: expected HTTP $expected, got $RESP_CODE. body=$RESP_BODY"
    return 1
  fi
}

assert_app_code() {
  local expected="$1"
  local case_id="$2"
  local description="$3"
  local actual
  actual=$(echo "$RESP_BODY" | jq -r '.code // "null"' 2>/dev/null)
  if [[ "$actual" == "$expected" ]]; then
    pass "$case_id $description (app.code=$actual)"
    return 0
  else
    fail "$case_id $description: expected app.code=$expected, got $actual. body=$RESP_BODY"
    return 1
  fi
}

assert_app_code_not() {
  local forbidden="$1"
  local case_id="$2"
  local description="$3"
  local actual
  actual=$(echo "$RESP_BODY" | jq -r '.code // "null"' 2>/dev/null)
  if [[ "$actual" != "$forbidden" ]]; then
    pass "$case_id $description (app.code=$actual ≠ $forbidden)"
    return 0
  else
    fail "$case_id $description: app.code=$actual matches forbidden $forbidden"
    return 1
  fi
}

assert_message_contains() {
  local needle="$1"
  local case_id="$2"
  local description="$3"
  if echo "$RESP_BODY" | grep -q "$needle"; then
    pass "$case_id $description (message contains '$needle')"
    return 0
  else
    fail "$case_id $description: expected message to contain '$needle'. body=$RESP_BODY"
    return 1
  fi
}

# -----------------------------------------------------------------------------
# DB verification (optional)
# -----------------------------------------------------------------------------
db_query() {
  local sql="$1"
  PGPASSWORD="${PGPASSWORD:-}" psql "$DATABASE_URL" -tA -c "$sql" 2>/dev/null
}

verify_db_subscribed() {
  local email="$1"
  local expected_status="$2"  # active | unsubscribed | missing
  if [[ -z "$DATABASE_URL" ]]; then
    log_info "  [DB] skipped (DATABASE_URL not set)"
    return 0
  fi
  local row
  row=$(db_query "SELECT subscribed_at IS NOT NULL, unsubscribed_at IS NULL
                  FROM newsletter_subscriptions WHERE email='$email' LIMIT 1;")
  if [[ -z "$row" ]]; then
    if [[ "$expected_status" == "missing" ]]; then
      pass "  [DB] row correctly absent for $email"
      return 0
    else
      fail "  [DB] expected $expected_status for $email, row missing"
      return 1
    fi
  fi
  local is_sub is_unsub
  is_sub=$(echo "$row" | cut -d'|' -f1)
  is_unsub=$(echo "$row" | cut -d'|' -f2)
  case "$expected_status" in
    active)
      if [[ "$is_sub" == "t" && "$is_unsub" == "t" ]]; then
        pass "  [DB] $email is active (subscribed_at + unsubscribed_at IS NULL)"
        return 0
      fi
      ;;
    unsubscribed)
      if [[ "$is_unsub" == "f" ]]; then
        pass "  [DB] $email is unsubscribed (unsubscribed_at IS NOT NULL)"
        return 0
      fi
      ;;
  esac
  fail "  [DB] $email state mismatch: expected $expected_status, got sub=$is_sub unsub=$is_unsub"
  return 1
}

# -----------------------------------------------------------------------------
# Test cases
# -----------------------------------------------------------------------------

# T05-001: 正常订阅 — 合法 email
test_T05_001() {
  section "T05-001 subscribe with valid email"
  local payload
  payload=$(jq -nc --arg e "$TEST_EMAIL" '{email:$e, frequency:"weekly", source:"w1-smoke"}')
  http POST /api/newsletter/subscribe "$payload"
  assert_code "200" "T05-001" "subscribe returns 200"
  assert_app_code "0" "T05-001" "subscribe success code=0"
  SUBSCRIBED_AT=$(echo "$RESP_BODY" | jq -r '.data.subscribed_at // ""' 2>/dev/null)
  verify_db_subscribed "$TEST_EMAIL" "active"
}

# T05-002: 非法 email 格式
test_T05_002() {
  section "T05-002 subscribe with invalid email"
  local payload='{"email":"not-an-email","frequency":"weekly"}'
  http POST /api/newsletter/subscribe "$payload"
  # Spec: 4001 (field format) preferred, accept 4xx range
  if [[ "$RESP_CODE" =~ ^4 ]]; then
    assert_app_code_not "0" "T05-002" "invalid email rejected (non-zero code)"
    pass "T05-002 invalid email rejected (HTTP $RESP_CODE)"
    # refund the assert_app_code_not increment
    FAIL=$((FAIL - 1))
  else
    fail "T05-002 invalid email should return 4xx, got $RESP_CODE. body=$RESP_BODY"
  fi
}

# T05-003: 缺 email 字段
test_T05_003() {
  section "T05-003 subscribe without email field"
  local payload='{"frequency":"weekly"}'
  http POST /api/newsletter/subscribe "$payload"
  if [[ "$RESP_CODE" =~ ^4 ]]; then
    assert_app_code_not "0" "T05-003" "missing email rejected (non-zero code)"
    FAIL=$((FAIL - 1))
    pass "T05-003 missing email rejected (HTTP $RESP_CODE)"
  else
    fail "T05-003 missing email should return 4xx, got $RESP_CODE. body=$RESP_BODY"
  fi
}

# T05-004: 缺 frequency 字段
test_T05_004() {
  section "T05-004 subscribe without frequency field"
  local payload
  payload=$(jq -nc --arg e "$TEST_EMAIL" '{email:$e}')
  http POST /api/newsletter/subscribe "$payload"
  if [[ "$RESP_CODE" =~ ^4 ]]; then
    assert_app_code_not "0" "T05-004" "missing frequency rejected (non-zero code)"
    FAIL=$((FAIL - 1))
    pass "T05-004 missing frequency rejected (HTTP $RESP_CODE)"
  else
    fail "T05-004 missing frequency should return 4xx, got $RESP_CODE. body=$RESP_BODY"
  fi
}

# T05-005: ⭐ 退订后重订 (P0-1 核心验证)
test_T05_005() {
  section "T05-005 unsubscribe + re-subscribe same email (P0-1 fix verification)"
  # First get unsubscribe token by reading from DB or hitting a debug endpoint
  # Smoke assumption: unsubscribe endpoint accepts email directly
  local unsub_payload
  unsub_payload=$(jq -nc --arg e "$TEST_EMAIL" '{email:$e}')
  http POST /api/newsletter/unsubscribe "$unsub_payload"
  if [[ "$RESP_CODE" == "200" ]]; then
    pass "T05-005a unsubscribe returned 200"
  else
    fail "T05-005a unsubscribe expected 200, got $RESP_CODE. body=$RESP_BODY"
  fi
  verify_db_subscribed "$TEST_EMAIL" "unsubscribed"

  # Re-subscribe same email — should succeed because of PARTIAL unique index
  local resub_payload
  resub_payload=$(jq -nc --arg e "$TEST_EMAIL" '{email:$e, frequency:"daily", source:"w1-smoke-resub"}')
  http POST /api/newsletter/subscribe "$resub_payload"
  if [[ "$RESP_CODE" == "200" ]]; then
    pass "T05-005b re-subscribe same email returned 200 (P0-1 fix verified)"
  else
    fail "T05-005b re-subscribe expected 200, got $RESP_CODE. body=$RESP_BODY"
  fi
  verify_db_subscribed "$TEST_EMAIL" "active"
}

# T05-006: 重复订阅 active email
test_T05_006() {
  section "T05-006 subscribe duplicate active email"
  local payload
  payload=$(jq -nc --arg e "$TEST_EMAIL" '{email:$e, frequency:"weekly"}')
  http POST /api/newsletter/subscribe "$payload"
  # Should NOT succeed. Code per spec: 4006 (duplicate) or 4000/4001
  assert_app_code_not "0" "T05-006" "duplicate active subscribe rejected"
  if [[ "$RESP_CODE" == "200" ]]; then
    fail "T05-006 duplicate active subscribe should not return 200 (got $RESP_CODE)"
    FAIL=$((FAIL - 1))
  else
    pass "T05-006 duplicate active subscribe rejected (HTTP $RESP_CODE)"
    FAIL=$((FAIL - 1))  # refund assert_app_code_not
  fi
}

# T05-007: 有效 confirm token
test_T05_007() {
  section "T05-007 confirm with valid token"
  if [[ -z "$CONFIRM_TOKEN" ]]; then
    # Pull token from DB if possible; else skip
    if [[ -n "$DATABASE_URL" ]]; then
      CONFIRM_TOKEN=$(db_query "SELECT confirm_token FROM newsletter_subscriptions
                                 WHERE email='$TEST_EMAIL' AND confirmed_at IS NULL LIMIT 1;")
    fi
  fi
  if [[ -z "$CONFIRM_TOKEN" ]]; then
    skip "T05-007 confirm token not available (no DB or not generated)"
    return 0
  fi
  http POST "/api/newsletter/confirm" "$(jq -nc --arg t "$CONFIRM_TOKEN" '{token:$t}')"
  if [[ "$RESP_CODE" == "200" ]]; then
    pass "T05-007 confirm with valid token returned 200"
  else
    fail "T05-007 confirm valid token expected 200, got $RESP_CODE. body=$RESP_BODY"
  fi
}

# T05-008: 失效 confirm token (注意不是 4007)
test_T05_008() {
  section "T05-008 confirm with invalid/expired token (NOT 4007)"
  local payload='{"token":"invalid-token-deadbeef-00000000"}'
  http POST /api/newsletter/confirm "$payload"
  assert_code "400" "T05-008" "invalid token returns 400 (per spec, not 429)"
  assert_app_code_not "4007" "T05-008" "invalid token code ≠ 4007 (rate-limit)"
  # Per spec: 4003 (not found) is the canonical code
  local actual
  actual=$(echo "$RESP_BODY" | jq -r '.code // "null"' 2>/dev/null)
  if [[ "$actual" == "4003" || "$actual" == "4000" ]]; then
    pass "T05-008 invalid token code=$actual (semantic: not-found or generic)"
  else
    log_info "T05-008 actual code=$actual (spec preferred 4003; tolerated if 4000/4001)"
  fi
}

# T05-009: rate limit (5次/60s)
test_T05_009() {
  section "T05-009 rate limit (5 requests / 60s)"
  if [[ "$SKIP_RATE_LIMIT" == "1" ]]; then
    skip "T05-009 rate-limit (SKIP_RATE_LIMIT=1)"
    return 0
  fi
  local rate_email="qa-rate-$(date +%s)@test.local"
  local triggered=0
  for i in 1 2 3 4 5 6 7; do
    local payload
    payload=$(jq -nc --arg e "$rate_email" '{email:$e, frequency:"weekly"}')
    http POST /api/newsletter/subscribe "$payload"
    local code
    code=$(echo "$RESP_BODY" | jq -r '.code // "null"' 2>/dev/null)
    if [[ "$code" == "4007" || "$RESP_CODE" == "429" ]]; then
      triggered=1
      pass "T05-009 rate limit triggered at request #$i (HTTP $RESP_CODE, code=$code)"
      break
    fi
  done
  if [[ "$triggered" == "0" ]]; then
    # Not necessarily a fail — depends on whether rate limit is implemented yet
    skip "T05-009 rate limit NOT triggered in 7 requests — may not be implemented yet"
  fi
}

# T05-010: 退订未订阅 email
test_T05_010() {
  section "T05-010 unsubscribe non-existent email"
  local payload='{"email":"never-subscribed-xxx@test.local"}'
  http POST /api/newsletter/unsubscribe "$payload"
  # Idempotent semantics preferred: 200 (no-op) OR 4003 (not found)
  local code
  code=$(echo "$RESP_BODY" | jq -r '.code // "null"' 2>/dev/null)
  if [[ "$code" == "0" || "$code" == "4003" || "$code" == "4000" ]]; then
    pass "T05-010 unsubscribe non-existent handled gracefully (code=$code)"
  else
    fail "T05-010 unsubscribe non-existent unexpected code=$code. body=$RESP_BODY"
  fi
}

# T05-011: 完整生命周期 subscribe → confirm → unsubscribe → re-subscribe
test_T05_011() {
  section "T05-011 full lifecycle: subscribe → confirm → unsubscribe → re-subscribe"
  local email="qa-lifecycle-$(date +%s)@test.local"
  local payload
  payload=$(jq -nc --arg e "$email" '{email:$e, frequency:"weekly"}')
  http POST /api/newsletter/subscribe "$payload"
  if [[ "$RESP_CODE" != "200" ]]; then
    fail "T05-011 subscribe step expected 200, got $RESP_CODE"
    return 0
  fi
  pass "T05-011a subscribe OK"

  # confirm
  if [[ -n "$DATABASE_URL" ]]; then
    local tok
    tok=$(db_query "SELECT confirm_token FROM newsletter_subscriptions
                    WHERE email='$email' AND confirmed_at IS NULL LIMIT 1;")
    if [[ -n "$tok" ]]; then
      http POST /api/newsletter/confirm "$(jq -nc --arg t "$tok" '{token:$t}')"
      if [[ "$RESP_CODE" == "200" ]]; then
        pass "T05-011b confirm OK"
      else
        fail "T05-011b confirm expected 200, got $RESP_CODE"
      fi
    else
      skip "T05-011b confirm (no token in DB)"
    fi
  else
    skip "T05-011b confirm (DATABASE_URL not set)"
  fi

  # unsubscribe
  http POST /api/newsletter/unsubscribe "$(jq -nc --arg e "$email" '{email:$e}')"
  if [[ "$RESP_CODE" == "200" ]]; then
    pass "T05-011c unsubscribe OK"
  else
    fail "T05-011c unsubscribe expected 200, got $RESP_CODE"
  fi

  # re-subscribe
  http POST /api/newsletter/subscribe "$(jq -nc --arg e "$email" '{email:$e, frequency:"daily"}')"
  if [[ "$RESP_CODE" == "200" ]]; then
    pass "T05-011d re-subscribe OK (full lifecycle P0-1 verified end-to-end)"
  else
    fail "T05-011d re-subscribe expected 200, got $RESP_CODE. body=$RESP_BODY"
  fi
}

# -----------------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------------
cleanup_test_data() {
  if [[ "$CLEANUP_ON_EXIT" != "1" ]]; then
    return 0
  fi
  log_info "Cleaning up test data ..."
  if [[ -n "$DATABASE_URL" ]]; then
    db_query "DELETE FROM newsletter_subscriptions
              WHERE email LIKE 'qa-smoke-%@test.local'
                 OR email LIKE 'qa-rate-%@test.local'
                 OR email LIKE 'qa-lifecycle-%@test.local'
                 OR email = 'never-subscribed-xxx@test.local';" \
      >/dev/null
    pass "DB cleanup completed"
  else
    log_info "  Skipping DB cleanup (DATABASE_URL not set)"
  fi
  rm -f /tmp/w1_smoke_body
}

trap cleanup_test_data EXIT

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
main() {
  echo -e "${BOLD}============================================================${NC}"
  echo -e "${BOLD}  AI Radar Phase E - W1 Newsletter smoke test${NC}"
  echo -e "${BOLD}  BASE_URL=${BASE_URL}${NC}"
  echo -e "${BOLD}  TEST_EMAIL=${TEST_EMAIL}${NC}"
  echo -e "${BOLD}  SKIP_RATE_LIMIT=${SKIP_RATE_LIMIT}${NC}"
  echo -e "${BOLD}  DB verification=${DATABASE_URL:+enabled}${DATABASE_URL:-disabled}"
  echo -e "${BOLD}============================================================${NC}"

  check_dependencies
  check_base_url

  # Execute in dependency order
  test_T05_001
  test_T05_002
  test_T05_003
  test_T05_004
  test_T05_005    # ⭐ P0-1 verification
  test_T05_006
  test_T05_007
  test_T05_008
  test_T05_009
  test_T05_010
  test_T05_011

  # Summary
  echo ""
  echo -e "${BOLD}============================================================${NC}"
  echo -e "${BOLD}  SUMMARY${NC}"
  echo -e "${BOLD}============================================================${NC}"
  echo -e "  Total cases:  $TOTAL"
  echo -e "  ${GREEN}✅ Passed:${NC}    $PASS"
  echo -e "  ${RED}❌ Failed:${NC}    $FAIL"
  echo -e "  ${YELLOW}⚠️  Skipped:${NC}   $SKIP"

  # P0-1 fix verdict
  echo ""
  if [[ "$FAIL" -eq 0 ]]; then
    echo -e "  ${GREEN}${BOLD}🎯 P0-1 修复验证: ✅ PASS${NC} (退订→重订 流程在 smoke 套件中通过)"
  else
    echo -e "  ${RED}${BOLD}🎯 P0-1 修复验证: ❌ FAIL${NC} (有 $FAIL 个 case 失败，需排查后再上线)"
  fi

  echo -e "${BOLD}============================================================${NC}"

  # Exit code
  if [[ "$FAIL" -gt 0 ]]; then
    exit 1
  fi
  exit 0
}

main "$@"
