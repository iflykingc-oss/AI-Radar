#!/usr/bin/env bash
# W1 smoke-extended: 11 new endpoints (cases 12-22)
# Usage: BASE=http://localhost:3000 bash w1-smoke-extended.sh
set -u
BASE="${BASE:-http://localhost:3000}"
PASS=0; FAIL=0

check() {
  local id="$1" desc="$2" method="$3" url="$4" body="${5:-}" expect="${6:-200}" field="${7-code}"
  if [ -n "$body" ]; then
    local r=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$body")
  else
    local r=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
  fi
  local code=$(echo "$r" | tail -1)
  local json=$(echo "$r" | head -n -1)
  if [ "$code" != "$expect" ]; then
    echo "[FAIL] $id: $desc — expect $expect got $code | $(echo "$json" | head -c 150)"
    FAIL=$((FAIL+1)); return
  fi
  if [ -n "$field" ]; then
    # Two check modes:
    #   1. JSON mode (default): field must appear in body as "<field>":0<not-digit>"
    #   2. HTML mode (prefix `contains:`): plain substring match in body
    if [[ "$field" == contains:* ]]; then
      local needle="${field#contains:}"
      if echo "$json" | grep -qF -- "$needle"; then
        : # found
      else
        echo "[FAIL] $id: $desc — missing '$needle' in HTML body"
        FAIL=$((FAIL+1)); return
      fi
    else
      if echo "$json" | grep -q "\"$field\":0[^0-9]"; then
        : # code=0 means success
      else
        echo "[FAIL] $id: $desc — $field != 0 in response"
        FAIL=$((FAIL+1)); return
      fi
    fi
  fi
  echo "[PASS] $id: $desc"
  PASS=$((PASS+1))
}

# --- Cases 12-22 ---
# Use a unique email per run to avoid carryover state from prior smoke runs.
SMOKE_EMAIL="smoke-$(date +%s)-$$@example.com"
# Resolve a real launch UUID (case 14 needs a real id, not integer).
LAUNCH_UUID=$(curl -s "$BASE/api/launches?range=all&limit=1" \
  | grep -oE '"id":"[a-f0-9-]{36}"' | head -1 | sed -E 's/"id":"([a-f0-9-]+)"/\1/')
if [ -z "$LAUNCH_UUID" ]; then
  echo "[WARN] no launch uuid resolved; case 14 will fail"
  LAUNCH_UUID="00000000-0000-0000-0000-000000000000"
fi

check 12 "launches 24h"           GET  "$BASE/api/launches?range=24h&page=1&limit=5"        ""   200 code
check 13 "launches by category"   GET  "$BASE/api/launches?category=writing&limit=3"        ""   200 code
check 14 "launch detail"          GET  "$BASE/api/launches/$LAUNCH_UUID"                    ""   200 code
check 15 "trends emerging"        GET  "$BASE/api/trends?status=emerging&limit=5"            ""   200 code
check 16 "categories tree"        GET  "$BASE/api/categories?lang=en"                       ""   200 code
check 17 "product signals"        GET  "$BASE/api/products/synthesia/signals"             ""   200 code
check 18 "newsletter subscribe"   POST "$BASE/api/newsletter/subscribe" "{\"email\":\"$SMOKE_EMAIL\",\"frequency\":\"daily\",\"categories\":[\"writing\"]}" 201 code
check 19 "newsletter duplicate"   POST "$BASE/api/newsletter/subscribe" "{\"email\":\"$SMOKE_EMAIL\",\"frequency\":\"daily\",\"categories\":[\"writing\"]}" 200 code
check 20 "newsletter unsubscribe" POST "$BASE/api/newsletter/unsubscribe" "{\"email\":\"$SMOKE_EMAIL\"}" 200 code
check 21 "pricing plans"          GET  "$BASE/api/pricing"                                 ""   200 code
check 22 "pricing page"           GET  "$BASE/pricing"                                     ""   200 "contains:Simple, transparent pricing"

echo "---"
echo "PASS: $PASS  FAIL: $FAIL"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
