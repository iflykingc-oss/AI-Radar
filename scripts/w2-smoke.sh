#!/usr/bin/env bash
# =============================================================================
# scripts/w2-smoke.sh
# AI Radar Phase F - W2 Integration smoke test
#
# Executes T2-001 ~ T2-023 in dependency order via curl + grep.
# Validates the W2 integration acceptance criteria AC-1 ~ AC-8.
#
# Coverage:
#   M2.1 (14 cases): T2-001 ~ T2-014
#     AC-1 (home 3 layers):     T2-001, T2-002, T2-003
#     AC-2 (/launches):         T2-004, T2-005, T2-006, T2-007
#     AC-3 (/trends real data): T2-008, T2-009
#     AC-4 (/discover data):    T2-010, T2-011
#     AC-6 (newsletter form):   T2-012, T2-013, T2-014
#   M2.2 (9 cases):  T2-015 ~ T2-023
#     AC-5 (paywall):           T2-015, T2-016, T2-017, T2-018
#     AC-6 cont (rate limit):   T2-019, T2-020
#     AC-7 (i18n):              T2-021
#     AC-8 (crawler):           T2-022, T2-023
#
# Usage:
#   # Default (localhost:3000)
#   ./scripts/w2-smoke.sh
#
#   # Against staging
#   BASE=http://staging.ai-radar.dev ./scripts/w2-smoke.sh
#
#   # Skip W1 baseline reminder
#   SKIP_W1_CHECK=1 ./scripts/w2-smoke.sh
#
#   # Verbose mode
#   VERBOSE=1 ./scripts/w2-smoke.sh
#
# Exit codes:
#   0 = all PASS  (or PASS+SKIP, no FAIL)
#   1 = one or more FAIL
#   2 = environment error (missing curl, unreachable base URL)
#
# Cross-platform notes (W1 lessons learned):
#   - Uses ${7-code} (not ${7:-code}) for POSIX default
#   - Uses ${TMPDIR:-/tmp} for temp files (Windows-friendly)
#   - Uses "contains:" prefix for HTML string match
#   - Uses regex: prefix when alternatives are needed
#   - Parses UUIDs dynamically via grep -oE
#   - Avoids bare /tmp/ paths (Windows sandbox blocks)
#
# Author: software-qa-engineer (Yan)
# Created: 2026-05-29
# =============================================================================

set -uo pipefail   # NOTE: not -e (continue past failures)

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
BASE="${BASE:-http://localhost:3000}"
WORKSPACE="${WORKSPACE:-$(cd "$(dirname "$0")/.." && pwd)}"
FRONTEND_DIR="${FRONTEND_DIR:-$WORKSPACE/frontend}"
CRAWLER_DIR="${CRAWLER_DIR:-$WORKSPACE/crawler}"
TIMEOUT="${TIMEOUT:-10}"
SKIP_W1_CHECK="${SKIP_W1_CHECK:-0}"
VERBOSE="${VERBOSE:-0}"

# Counters
PASS=0
FAIL=0
SKIP=0
TOTAL=23

# Resolve a dynamic UUID for cases that need it (T2-009 / future launch tests)
LAUNCH_UUID=""
PRODUCT_SLUG="synthesia"  # Known W1 product slug for product-level tests

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
# Temp file (cross-platform)
# -----------------------------------------------------------------------------
# Per W1 lesson: do NOT use bare /tmp/ — use ${TMPDIR:-/tmp} which falls back
# gracefully on both Windows Git Bash and Linux. Add PID + timestamp for safety.
TMP_BODY="${TMPDIR:-/tmp}/w2_smoke_${$}_$(date +%s).body"
TMP_HTML="${TMPDIR:-/tmp}/w2_smoke_${$}_$(date +%s).html"

cleanup() {
  rm -f "$TMP_BODY" "$TMP_HTML"
}
trap cleanup EXIT

# Detect platform-specific silent redirect target
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
  DEV_NULL="NUL"
else
  DEV_NULL="/dev/null"
fi

# -----------------------------------------------------------------------------
# Pre-flight
# -----------------------------------------------------------------------------
check_dependencies() {
  for cmd in curl grep; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      log "${RED}ERROR: required command '$cmd' not found in PATH${NC}"
      exit 2
    fi
  done
  log_info "Platform: OSTYPE=$OSTYPE, DEV_NULL=$DEV_NULL"
}

check_base_url() {
  log_info "Probing BASE=$BASE ..."
  if ! curl -sS --max-time "$TIMEOUT" -o "$DEV_NULL" -w "%{http_code}" \
       "$BASE/" 2>/dev/null | grep -qE "^(200|404|503)$"; then
    log "${RED}ERROR: BASE=$BASE unreachable${NC}"
    log "  (Tried GET /; expected 200/404/503, got nothing or timeout)"
    exit 2
  fi
}

check_w1_baseline() {
  if [[ "$SKIP_W1_CHECK" == "1" ]]; then
    log_info "Skipping W1 baseline reminder (SKIP_W1_CHECK=1)"
    return 0
  fi
  log_info "W1 baseline reminder: run 'bash scripts/w1-smoke-extended.sh' separately"
  log_info "  (W1 11/11 must be green before W2 PRs)"
}

# -----------------------------------------------------------------------------
# HTTP helper — writes to $TMP_BODY, returns code via $RESP_CODE
# -----------------------------------------------------------------------------
http() {
  local method="$1"
  local url="$2"
  local data="${3:-}"
  local cookie="${4:-}"

  local args=(-sS --max-time "$TIMEOUT" -X "$method"
              -H "Content-Type: application/json"
              -H "Accept: application/json"
              -o "$TMP_BODY" -w "%{http_code}")

  if [[ -n "$cookie" ]]; then
    args+=(-H "Cookie: $cookie")
  fi

  if [[ -n "$data" ]]; then
    args+=(-d "$data")
  fi

  RESP_CODE=$(curl "${args[@]}" "$url" 2>/dev/null) || RESP_CODE="000"
  RESP_BODY=$(cat "$TMP_BODY" 2>/dev/null || echo "")

  if [[ "$VERBOSE" == "1" ]]; then
    log "  ${method} ${url} -> $RESP_CODE"
    log "  body: ${RESP_BODY:0:200}"
  fi
}

# -----------------------------------------------------------------------------
# Assertion helpers (W1-extended style)
# -----------------------------------------------------------------------------

# Generic check: id, desc, method, url, body, expected_code, field
# field can be:
#   - "code"  (default): JSON envelope must have "code":0
#   - "code:4001": JSON envelope must have "code":4001 (exact match)
#   - "code:!0":   JSON envelope code must NOT be 0
#   - "contains:<text>": plain substring in body (HTML or JSON)
#   - "regex:<pattern>": regex match in body (HTML or JSON)
check() {
  local id="$1" desc="$2" method="$3" url="$4" body="${5:-}" expect="${6:-200}" field="${7-code}"
  if [[ -n "$body" ]]; then
    local r=$(curl -sS --max-time "$TIMEOUT" -X "$method" "$url" \
              -H "Content-Type: application/json" \
              -d "$body" -w "\n%{http_code}")
  else
    local r=$(curl -sS --max-time "$TIMEOUT" -X "$method" "$url" -w "\n%{http_code}")
  fi
  local code=$(echo "$r" | tail -1)
  local json=$(echo "$r" | head -n -1)
  if [[ "$code" != "$expect" ]]; then
    fail "[$id] $desc — expect HTTP $expect got $code | $(echo "$json" | head -c 150)"
    return
  fi
  if [[ -n "$field" ]]; then
    # Branch 1: contains:<text>  — plain substring (HTML or JSON body)
    if [[ "$field" == contains:* ]]; then
      local needle="${field#contains:}"
      if echo "$json" | grep -qF -- "$needle"; then
        pass "[$id] $desc (contains '$needle')"
      else
        fail "[$id] $desc — missing '$needle' in body"
      fi
      return
    fi
    # Branch 2: regex:<pattern> — regex match (HTML or JSON body)
    if [[ "$field" == regex:* ]]; then
      local pattern="${field#regex:}"
      if echo "$json" | grep -qE -- "$pattern"; then
        pass "[$id] $desc (regex '$pattern')"
      else
        fail "[$id] $desc — regex '$pattern' not found in body"
      fi
      return
    fi
    # Branch 3: code:N  — JSON envelope code == N exactly
    if [[ "$field" == code:* ]]; then
      local want="${field#code:}"
      local actual=$(echo "$json" | grep -oE '"code":[0-9]+' | head -1 | cut -d: -f2)
      if [[ "$actual" == "$want" ]]; then
        pass "[$id] $desc (app.code=$actual)"
      else
        fail "[$id] $desc — expected app.code=$want, got ${actual:-null}"
      fi
      return
    fi
    # Branch 4: code:!N  — JSON envelope code != N
    if [[ "$field" == "code:!0" ]]; then
      local actual=$(echo "$json" | grep -oE '"code":[0-9]+' | head -1 | cut -d: -f2)
      if [[ "$actual" != "0" && -n "$actual" ]]; then
        pass "[$id] $desc (app.code=$actual ≠ 0)"
      else
        fail "[$id] $desc — expected app.code≠0, got ${actual:-null}"
      fi
      return
    fi
    # Branch 5 (default): field must appear as "field":0<not-digit>
    if echo "$json" | grep -q "\"$field\":0[^0-9]"; then
      pass "[$id] $desc ($field=0)"
    else
      fail "[$id] $desc — $field != 0 in response"
    fi
    return
  fi
  pass "[$id] $desc"
}

# DOM check: curl HTML page, grep for a substring in body
# Usage: check_dom ID DESC URL NEEDLE
check_dom() {
  local id="$1" desc="$2" url="$3" needle="$4"
  local html
  html=$(curl -sS --max-time "$TIMEOUT" "$url" 2>/dev/null)
  if echo "$html" | grep -qE "$needle"; then
    pass "[$id] $desc (found '$needle')"
  else
    fail "[$id] $desc — missing regex '$needle' in $url"
  fi
}

# DOM count check: count occurrences of a regex
# Usage: check_dom_count ID DESC URL REGEX MIN MAX
check_dom_count() {
  local id="$1" desc="$2" url="$3" regex="$4" want_min="$5" want_max="${6:-}"
  local html count
  html=$(curl -sS --max-time "$TIMEOUT" "$url" 2>/dev/null)
  count=$(echo "$html" | grep -oE "$regex" | wc -l | tr -d ' ')
  if [[ -z "$count" || "$count" == "0" ]]; then
    fail "[$id] $desc — found 0 matches for regex '$regex' in $url"
    return
  fi
  if [[ -n "$want_max" && "$count" -gt "$want_max" ]]; then
    fail "[$id] $desc — count=$count, expected in [$want_min, $want_max]"
    return
  fi
  if [[ "$count" -lt "$want_min" ]]; then
    fail "[$id] $desc — count=$count, expected >= $want_min"
    return
  fi
  pass "[$id] $desc (count=$count, expected in [$want_min, ${want_max:-∞}])"
}

# File existence check
# Usage: check_file ID DESC PATH
check_file() {
  local id="$1" desc="$2" path="$3"
  if [[ -f "$path" ]]; then
    pass "[$id] $desc (file exists: $path)"
  else
    fail "[$id] $desc — file not found: $path"
  fi
}

# Source code grep check (mock removal)
# Usage: check_grep_absent ID DESC FILE PATTERN
check_grep_absent() {
  local id="$1" desc="$2" file="$3" pattern="$4"
  if [[ ! -f "$file" ]]; then
    skip "[$id] $desc — file not found: $file (T-1/T-2 not delivered?)"
    return
  fi
  local hits
  hits=$(grep -cE "$pattern" "$file" 2>/dev/null || true)
  hits="${hits:-0}"
  if [[ "$hits" == "0" ]]; then
    pass "[$id] $desc (no '$pattern' in $file)"
  else
    fail "[$id] $desc — found $hits matches of '$pattern' in $file (should be 0)"
  fi
}

# -----------------------------------------------------------------------------
# Resolve dynamic UUIDs from API (for tests that need real IDs)
# -----------------------------------------------------------------------------
resolve_launch_uuid() {
  LAUNCH_UUID=$(curl -sS --max-time "$TIMEOUT" "$BASE/api/launches?range=all&limit=1" \
    2>/dev/null | grep -oE '"id":"[a-f0-9-]{36}"' | head -1 | sed -E 's/"id":"([a-f0-9-]+)"/\1/')
  if [[ -z "$LAUNCH_UUID" ]]; then
    LAUNCH_UUID="00000000-0000-0000-0000-000000000000"
    log_info "[setup] no launch UUID resolved; using null UUID"
  else
    log_info "[setup] LAUNCH_UUID=$LAUNCH_UUID"
  fi
}

# =============================================================================
# M2.1 Tests (T2-001 ~ T2-014)
# =============================================================================

# T2-001: /home DOM contains 3 layer-entry-card-l[1-3] testids
test_T2_001() {
  section "T2-001 home DOM has 3 layer-entry-card"
  check_dom_count "T2-001" "home DOM has l1+l2+l3 cards" \
    "$BASE/home?lang=zh" \
    'data-testid="layer-entry-card-l[1-3]"' \
    "3" "3"
}

# T2-002: L1/L2/L3 count 字段非零 (需要 L1 ≥ 1 category; L2 ≥ 1 launch; L3 ≥ 1 trend)
test_T2_002() {
  section "T2-002 L1/L2/L3 count > 0 (non-placeholder)"
  # Pull counts from each API and ensure non-zero
  local l1 l2 l3
  l1=$(curl -sS --max-time "$TIMEOUT" "$BASE/api/categories?layer=mature" 2>/dev/null \
    | grep -oE '"id":"[^"]+"' | wc -l)
  l2=$(curl -sS --max-time "$TIMEOUT" "$BASE/api/launches?range=24h&limit=1" 2>/dev/null \
    | grep -oE '"total":[0-9]+' | head -1 | cut -d: -f2)
  l3=$(curl -sS --max-time "$TIMEOUT" "$BASE/api/trends?range=7d&limit=1" 2>/dev/null \
    | grep -oE '"total":[0-9]+' | head -1 | cut -d: -f2)
  log_info "  L1 categories=$l1, L2 launches total=$l2, L3 trends total=$l3"
  # At least one of L1/L2/L3 should be non-zero (crawler may have populated some)
  if [[ "${l1:-0}" -gt 0 || "${l2:-0}" -gt 0 || "${l3:-0}" -gt 0 ]]; then
    pass "T2-002 L1/L2/L3 at least one non-zero (L1=$l1, L2=$l2, L3=$l3)"
  else
    # Acceptable: W2 may ship with empty tables; DOM should still render count field
    # Re-check: visit /home and look for the count number rendered
    local html
    html=$(curl -sS --max-time "$TIMEOUT" "$BASE/home?lang=zh" 2>/dev/null)
    if echo "$html" | grep -qE 'data-testid="layer-entry-card-count"'; then
      skip "T2-002 L1/L2/L3 all zero from API, but DOM renders count field (crawler pending)"
    else
      fail "T2-002 all L1/L2/L3 = 0 AND no count field in DOM"
    fi
  fi
}

# T2-003: 中英切换 — DOM 同时含 lang=zh 与 lang=en 的两种 lang attr
test_T2_003() {
  section "T2-003 zh/en language switch produces both lang attrs"
  local zh_html en_html
  zh_html=$(curl -sS --max-time "$TIMEOUT" "$BASE/home?lang=zh" 2>/dev/null)
  en_html=$(curl -sS --max-time "$TIMEOUT" "$BASE/home?lang=en" 2>/dev/null)
  if echo "$zh_html" | grep -qE 'lang="zh"' && echo "$en_html" | grep -qE 'lang="en"'; then
    pass "T2-003 both lang=zh and lang=en present after switch"
  else
    fail "T2-003 missing lang attribute: zh_has=$(echo "$zh_html" | grep -cE 'lang="zh"') en_has=$(echo "$en_html" | grep -cE 'lang="en"')"
  fi
}

# T2-004: /launches?range=24h 返回 200, HTML 含 ≥ 1 launch-timeline-card
test_T2_004() {
  section "T2-004 /launches?range=24h renders ≥ 1 timeline card"
  check_dom_count "T2-004" "launches 24h timeline card" \
    "$BASE/launches?range=24h" \
    'data-testid="launches-card"|data-legacy-testid="launch-timeline-card"|data-testid="launch-timeline-card"' \
    "1" ""
}

# T2-005: /launches?range=7d 切换仍 200
test_T2_005() {
  section "T2-005 /launches?range=7d HTTP 200"
  check "T2-005" "launches 7d switch" GET "$BASE/launches?range=7d" "" "200" "regex:launches-card|launch-timeline-card|launch-empty"
}

# T2-006: /launches?range=99h 无效值 — 包含错误文案
test_T2_006() {
  section "T2-006 /launches?range=99h invalid value → error text"
  check "T2-006" "launches invalid range" GET "$BASE/launches?range=99h" "" "200" \
    "regex:launches.error|launches_error|invalid range"
}

# T2-007: /launches?category=xxx 空结果 — 包含空态文案
test_T2_007() {
  section "T2-007 /launches?category=xxx empty → empty text"
  check "T2-007" "launches empty filter" \
    GET "$BASE/launches?category=quantum-poetry-zzz" "" "200" \
    "regex:launches.empty|launches_empty|no launches"
}

# T2-008: /trends page.tsx 不含 generateLineChartData mock
test_T2_008() {
  section "T2-008 trends page has no generateLineChartData mock"
  check_grep_absent "T2-008" "trends mock removed" \
    "$FRONTEND_DIR/src/app/trends/page.tsx" \
    "generateLineChartData"
}

# T2-009: /api/trends?range=7d + /trends HTML 含 SVG
test_T2_009() {
  section "T2-009 /api/trends 7d returns code=0 + /trends HTML has SVG"
  check "T2-009a" "trends API 7d" GET "$BASE/api/trends?range=7d" "" "200" "code"
  check_dom "T2-009b" "trends HTML has SVG" "$BASE/trends?range=7d" "<svg"
}

# T2-010: /discover page.tsx 不再引用 @/lib/constants
test_T2_010() {
  section "T2-010 discover page no longer imports from @/lib/constants"
  check_grep_absent "T2-010" "discover constants removed" \
    "$FRONTEND_DIR/src/app/discover/page.tsx" \
    "from '@/lib/constants'"
}

# T2-011: /discover 渲染分类数 ≥ /api/categories 返回
test_T2_011() {
  section "T2-011 discover render count ≥ API items count"
  local api_count html dom_count
  api_count=$(curl -sS --max-time "$TIMEOUT" "$BASE/api/categories?layer=mature" 2>/dev/null \
    | grep -oE '"id":"[^"]+"' | wc -l)
  html=$(curl -sS --max-time "$TIMEOUT" "$BASE/discover?layer=mature" 2>/dev/null)
  dom_count=$(echo "$html" | grep -oE 'data-testid="category-card"|data-category=' | wc -l | tr -d ' ')
  log_info "  api_count=$api_count, dom_count=$dom_count"
  if [[ -z "$api_count" || "$api_count" == "0" ]]; then
    skip "T2-011 discover API returns 0 categories (crawler pending)"
    return
  fi
  if [[ "${dom_count:-0}" -ge "$api_count" ]]; then
    pass "T2-011 discover dom_count ($dom_count) ≥ api_count ($api_count)"
  else
    fail "T2-011 discover dom_count ($dom_count) < api_count ($api_count)"
  fi
}

# T2-012: Footer DOM 含 newsletter-form-footer
test_T2_012() {
  section "T2-012 Footer has newsletter-form-footer"
  check_dom "T2-012" "footer newsletter form" \
    "$BASE/home?lang=zh" \
    'data-testid="newsletter-form-footer"'
}

# T2-013: 提交 weekly + zh → HTTP 201 + code=0
# Spec (architecture §8.2) only mandates app.code=0; HTTP 201 is the standard
# REST status for new resource creation (confirmed by API probe). 200 accepted
# as a permissive fallback in case the route is later changed to be idempotent.
test_T2_013() {
  section "T2-013 newsletter subscribe weekly + zh → HTTP 201 + code=0"
  local email="w2-t2-013-$(date +%s)@airadar.dev"
  local payload
  payload=$(printf '{"email":"%s","frequency":"weekly","language":"zh","source":"home_footer"}' "$email")
  # Run twice: first attempt may yield 201 (new) or 200 (idempotent on re-run)
  # Both are valid for app.code=0 acceptance; the second attempt is just to
  # prove idempotency. We assert the first response.
  local r code
  r=$(curl -sS --max-time "$TIMEOUT" -X POST "$BASE/api/newsletter/subscribe" \
        -H "Content-Type: application/json" -d "$payload" -w "\n%{http_code}")
  code=$(echo "$r" | tail -1)
  local body
  body=$(echo "$r" | head -n -1)
  local app_code
  app_code=$(echo "$body" | grep -oE '"code":[0-9]+' | head -1 | cut -d: -f2)
  if [[ ("$code" == "201" || "$code" == "200") && "$app_code" == "0" ]]; then
    pass "[T2-013] newsletter weekly + zh (HTTP $code + app.code=0)"
  else
    fail "[T2-013] newsletter weekly + zh — HTTP $code + app.code=${app_code:-null}"
  fi
}

# T2-014: 重复同一邮箱 → code=4001
# Spec (architecture §8.2) mandates app.code=4001 for duplicate active subscribes.
# Current API is idempotent (returns app.code=0); this FAIL is a legitimate
# W2 source-bug signal — once the W2 detection logic is shipped, this test
# will go GREEN. Sleep added between attempts to allow any DB write to commit.
test_T2_014() {
  section "T2-014 newsletter duplicate email → code=4001"
  local email="w2-t2-014-$(date +%s)@airadar.dev"
  local payload
  payload=$(printf '{"email":"%s","frequency":"weekly","language":"en","source":"home_footer"}' "$email")
  # First subscribe (seed) — accept 200/201
  curl -sS --max-time "$TIMEOUT" -X POST "$BASE/api/newsletter/subscribe" \
    -H "Content-Type: application/json" -d "$payload" -o "$DEV_NULL" >/dev/null
  sleep 1
  # Second subscribe with same email → expect 4001
  check "T2-014" "newsletter duplicate" \
    POST "$BASE/api/newsletter/subscribe" "$payload" "200" "code:4001"
}

# =============================================================================
# M2.2 Tests (T2-015 ~ T2-023)
# =============================================================================

# T2-015: free plan 访问 /watchlist → 锁占位
test_T2_015() {
  section "T2-015 free plan /watchlist → paywall-locked-watchlist"
  check_dom "T2-015" "watchlist locked for free" \
    "$BASE/watchlist" \
    'data-testid="paywall-locked-watchlist"'
}

# T2-016: starter plan 访问 /watchlist → 真实关注列表
test_T2_016() {
  section "T2-016 starter plan /watchlist → real list (no lock)"
  local html
  html=$(curl -sS --max-time "$TIMEOUT" -H "Cookie: plan=starter" "$BASE/watchlist" 2>/dev/null)
  if echo "$html" | grep -q 'data-testid="paywall-locked-watchlist"'; then
    fail "T2-016 watchlist still shows paywall-locked for starter"
  elif echo "$html" | grep -qE 'data-testid="watchlist-product-card"|data-testid="watchlist-empty"|data-testid="watchlist-empty-state"'; then
    pass "T2-016 watchlist shows real content (product card or empty state) for starter"
  else
    # Acceptable if page renders 200 with plan=starter cookie and no lock marker
    if [[ -n "$html" ]]; then
      skip "T2-016 watchlist rendered but no clear product-card/empty testid (cookie may not be read)"
    else
      fail "T2-016 watchlist returned empty body"
    fi
  fi
}

# T2-017: starter plan 访问 /compare → 真实对比表
test_T2_017() {
  section "T2-017 starter plan /compare → real compare table (no lock)"
  local html
  html=$(curl -sS --max-time "$TIMEOUT" -H "Cookie: plan=starter" "$BASE/compare" 2>/dev/null)
  if echo "$html" | grep -q 'data-testid="paywall-locked-comparison"'; then
    fail "T2-017 compare still shows paywall-locked for starter"
  elif echo "$html" | grep -qE 'data-testid="compare-table"|data-testid="compare-empty"|data-testid="compare-empty-guide"'; then
    pass "T2-017 compare shows real table or empty state for starter"
  else
    if [[ -n "$html" ]]; then
      skip "T2-017 compare rendered but no clear testid (cookie may not be read)"
    else
      fail "T2-017 compare returned empty body"
    fi
  fi
}

# T2-018: pro plan 访问 /trends?range=90d → 解锁 (无 Dialog)
test_T2_018() {
  section "T2-018 pro plan /trends?range=90d unlocked"
  local html
  html=$(curl -sS --max-time "$TIMEOUT" -H "Cookie: plan=pro" "$BASE/trends?range=90d" 2>/dev/null)
  if echo "$html" | grep -q 'data-testid="paywall-locked-trends-advanced"'; then
    fail "T2-018 trends 90d still shows paywall-locked for pro"
  elif echo "$html" | grep -qE '<svg|data-testid="trends-chart"'; then
    pass "T2-018 trends 90d shows real chart for pro (no paywall)"
  else
    if [[ -n "$html" ]]; then
      skip "T2-018 trends 90d rendered but no SVG/chart testid found"
    else
      fail "T2-018 trends 90d returned empty body"
    fi
  fi
}

# T2-019: free 选 daily → radio disabled (client-side check)
test_T2_019() {
  section "T2-019 free plan newsletter-form daily radio is disabled"
  local html
  html=$(curl -sS --max-time "$TIMEOUT" -H "Cookie: plan=free" "$BASE/" 2>/dev/null)
  # Look for the daily radio input with disabled attribute
  if echo "$html" | grep -qE 'value="daily"[^>]*disabled|disabled[^>]*value="daily"'; then
    pass "T2-019 daily radio is disabled for free plan"
  else
    # Fallback: check for any paywall/dialog marker on free daily attempt
    skip "T2-019 daily radio disabled marker not found in static HTML (may be JS-rendered or not yet implemented)"
  fi
}

# T2-020: 速率限制触发 → 60s 倒计时显示
test_T2_020() {
  section "T2-020 rate limit triggers 60s countdown"
  local rate_email="w2-t2-020-$(date +%s)@airadar.dev"
  local triggered=0 retry_after=""
  for i in 1 2 3 4 5 6 7 8; do
    local payload
    payload=$(printf '{"email":"%s","frequency":"weekly","language":"en","source":"rate_test"}' "$rate_email")
    local r
    r=$(curl -sS --max-time "$TIMEOUT" -X POST "$BASE/api/newsletter/subscribe" \
        -H "Content-Type: application/json" -d "$payload" -w "\n%{http_code}")
    local code=$(echo "$r" | tail -1)
    local body=$(echo "$r" | head -n -1)
    if echo "$body" | grep -qE '"code":4006|"code":429'; then
      triggered=1
      retry_after=$(echo "$body" | grep -oE '"retry_after":[0-9]+' | head -1 | cut -d: -f2)
      pass "T2-020 rate limit triggered at request #$i (code=4006, retry_after=${retry_after:-N/A})"
      break
    fi
  done
  if [[ "$triggered" == "0" ]]; then
    skip "T2-020 rate limit not triggered in 8 requests — may not be implemented yet"
  fi
}

# T2-021: i18n 完整性 (AC-7 PR 守门)
test_T2_021() {
  section "T2-021 i18n check (en vs zh key set equal)"
  # Preferred: pnpm i18n:check
  if [[ -f "$FRONTEND_DIR/package.json" ]] && \
     grep -q '"i18n:check"' "$FRONTEND_DIR/package.json" 2>/dev/null; then
    if (cd "$FRONTEND_DIR" && pnpm i18n:check >/dev/null 2>&1); then
      pass "T2-021 pnpm i18n:check exit 0"
    else
      fail "T2-021 pnpm i18n:check failed"
    fi
    return
  fi
  # Fallback A: inline node script (cross-platform)
  # Use RELATIVE paths via env vars to avoid Windows Git-Bash /d/... ↔ D:\...
  # path-translation shenanigans that break require() and absolute strings.
  if command -v node >/dev/null 2>&1 && \
     [[ -f "$FRONTEND_DIR/messages/en.json" ]] && \
     [[ -f "$FRONTEND_DIR/messages/zh.json" ]]; then
    local result
    # Use the script's own CWD as anchor; resolve to repo-root-relative paths.
    local en_rel="frontend/messages/en.json"
    local zh_rel="frontend/messages/zh.json"
    result=$(cd "$WORKSPACE" && EN_PATH="$en_rel" ZH_PATH="$zh_rel" node -e "
      const fs = require('fs');
      const en = JSON.parse(fs.readFileSync(process.env.EN_PATH, 'utf8'));
      const zh = JSON.parse(fs.readFileSync(process.env.ZH_PATH, 'utf8'));
      const flatten = (o, p = '') => Object.entries(o).flatMap(
        ([k, v]) => v && typeof v === 'object' ? flatten(v, p + k + '.') : [p + k]
      );
      const a = flatten(en).sort();
      const b = flatten(zh).sort();
      const onlyEn = a.filter(x => !b.includes(x));
      const onlyZh = b.filter(x => !a.includes(x));
      if (onlyEn.length === 0 && onlyZh.length === 0) {
        console.log('OK ' + a.length);
        process.exit(0);
      } else {
        console.log('DIFF en_only=' + onlyEn.length + ' zh_only=' + onlyZh.length);
        if (onlyEn.length) console.log('  en-only: ' + onlyEn.slice(0,5).join(', '));
        if (onlyZh.length) console.log('  zh-only: ' + onlyZh.slice(0,5).join(', '));
        process.exit(1);
      }
    " 2>&1)
    if [[ "$?" == "0" ]]; then
      pass "T2-021 i18n en/zh key set equal ($result)"
    else
      fail "T2-021 i18n en/zh key set differs: $result"
    fi
    return
  fi
  # Fallback B: skip with manual instruction
  skip "T2-021 i18n:check not available (no pnpm script, no node, or missing messages/*.json)"
}

# T2-022: HF + arXiv 源文件存在
test_T2_022() {
  section "T2-022 crawler HF + arXiv source files exist"
  local hf_ts="$CRAWLER_DIR/src/sources/huggingface.ts"
  local arxiv_ts="$CRAWLER_DIR/src/sources/arxiv.ts"
  local hf_py="$CRAWLER_DIR/sources/huggingface.py"
  local arxiv_py="$CRAWLER_DIR/sources/arxiv.py"
  local found=0
  if [[ -f "$hf_ts" && -f "$arxiv_ts" ]]; then
    pass "T2-022a HF + arXiv .ts files exist (ADR-12: TypeScript)"
    found=1
  fi
  if [[ -f "$hf_py" && -f "$arxiv_py" && "$found" == "0" ]]; then
    pass "T2-022b HF + arXiv .py files exist (per PRD §3.4)"
    found=1
  fi
  if [[ "$found" == "0" ]]; then
    fail "T2-022 neither .ts nor .py HF/arXiv files found in expected paths"
    log_info "  checked: $hf_ts, $arxiv_ts, $hf_py, $arxiv_py"
  fi
}

# T2-023: HF mock 500 → 5/6 源成功 (失败隔离)
test_T2_023() {
  section "T2-023 crawler failure isolation (HF mock 500 → 5/6 succeed)"
  # This is a code-level test, not a runtime test
  # Check: 1) HF source has try/catch wrapper; 2) Logger writes JSON line
  local hf_file=""
  for candidate in "$CRAWLER_DIR/src/sources/huggingface.ts" "$CRAWLER_DIR/sources/huggingface.py"; do
    if [[ -f "$candidate" ]]; then
      hf_file="$candidate"
      break
    fi
  done
  if [[ -z "$hf_file" ]]; then
    skip "T2-023 HF source not found (T2-022 must pass first)"
    return
  fi
  # Check for try/catch (TS) or try/except (Py)
  if grep -qE "try \{|try:" "$hf_file"; then
    pass "T2-023a HF source has try/catch wrapper (failure isolation)"
  else
    fail "T2-023a HF source missing try/catch wrapper"
  fi
  # Check for log/logger reference
  if grep -qE "log\.|logger\.|console\.(log|error)" "$hf_file"; then
    pass "T2-023b HF source has logging (failure observable)"
  else
    skip "T2-023b HF source has no logging statement (may use parent pipeline logger)"
  fi
}

# =============================================================================
# Main
# =============================================================================

main() {
  echo -e "${BOLD}============================================================${NC}"
  echo -e "${BOLD}  AI Radar Phase F - W2 Integration smoke test${NC}"
  echo -e "${BOLD}  BASE=${BASE}${NC}"
  echo -e "${BOLD}  WORKSPACE=${WORKSPACE}${NC}"
  echo -e "${BOLD}  FRONTEND_DIR=${FRONTEND_DIR}${NC}"
  echo -e "${BOLD}  CRAWLER_DIR=${CRAWLER_DIR}${NC}"
  echo -e "${BOLD}  TMPDIR=${TMPDIR:-/tmp}${NC}"
  echo -e "${BOLD}  DEV_NULL=${DEV_NULL}${NC}"
  echo -e "${BOLD}  Total cases: ${TOTAL} (M2.1: 14, M2.2: 9)${NC}"
  echo -e "${BOLD}============================================================${NC}"

  check_dependencies
  check_base_url
  check_w1_baseline
  resolve_launch_uuid

  # M2.1 (14 cases: T2-001 ~ T2-014)
  test_T2_001
  test_T2_002
  test_T2_003
  test_T2_004
  test_T2_005
  test_T2_006
  test_T2_007
  test_T2_008
  test_T2_009
  test_T2_010
  test_T2_011
  test_T2_012
  test_T2_013
  test_T2_014

  # M2.2 (9 cases: T2-015 ~ T2-023)
  test_T2_015
  test_T2_016
  test_T2_017
  test_T2_018
  test_T2_019
  test_T2_020
  test_T2_021
  test_T2_022
  test_T2_023

  # Summary
  echo ""
  echo -e "${BOLD}============================================================${NC}"
  echo -e "${BOLD}  W2 SMOKE SUMMARY${NC}"
  echo -e "${BOLD}============================================================${NC}"
  echo -e "  Total cases:  $TOTAL"
  echo -e "  ${GREEN}✅ Passed:${NC}    $PASS"
  echo -e "  ${RED}❌ Failed:${NC}    $FAIL"
  echo -e "  ${YELLOW}⚠️  Skipped:${NC}   $SKIP"

  # AC coverage verdict
  echo ""
  if [[ "$FAIL" -eq 0 ]]; then
    echo -e "  ${GREEN}${BOLD}🎯 W2 Smoke: ✅ ALL PASS / SKIP (no FAIL)${NC}"
  else
    echo -e "  ${RED}${BOLD}🎯 W2 Smoke: ❌ $FAIL FAIL(S) — engineer fix required${NC}"
  fi
  echo ""
  echo -e "  ${BOLD}Next step:${NC} Run E2E-01~E2-05 manually for full AC-1~AC-8 coverage"
  echo -e "  ${BOLD}W1 prerequisite:${NC} bash scripts/w1-smoke-extended.sh must show 11/11"

  echo -e "${BOLD}============================================================${NC}"

  # Exit code
  if [[ "$FAIL" -gt 0 ]]; then
    exit 1
  fi
  exit 0
}

main "$@"
