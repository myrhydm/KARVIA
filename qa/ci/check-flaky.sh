#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"

FOUND_IDS_FILE="$(mktemp)"
KNOWN_JSON="${ROOT}/qa/flaky.json"

echo "🔍 Scanning for @flaky tests..."

# 1) Discover all tests marked @flaky (Jest/Playwright/Cypress titles)
#    Captures: it('<title>'), test('<title>'), describe('<title>') etc.
find "${ROOT}" -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | \
  grep -E "(test|spec)" | \
  xargs grep -nE "(\bit|\btest|\bdescribe)\s*\(\s*['\"][^'\"]*@flaky[^'\"]*['\"]" 2>/dev/null | \
  while IFS= read -r line; do
    file="${line%%:*}"
    # Make path relative to project root
    rel_file=$(realpath --relative-to="${ROOT}" "$file")
    # Extract the quoted title text
    title=$(echo "$line" | sed -E "s/.*(it|test|describe)\s*\(\s*['\"]([^'\"]+)['\"].*/\2/")
    echo "${rel_file}::${title}" >> "$FOUND_IDS_FILE"
  done || true

FOUND_COUNT=$(wc -l < "$FOUND_IDS_FILE" 2>/dev/null || echo "0")
echo "📊 Found @flaky tests: $FOUND_COUNT"

if [[ "$FOUND_COUNT" -gt 0 ]]; then
  echo "Found flaky test IDs:"
  cat "$FOUND_IDS_FILE" | sed 's/^/  - /'
fi

# 2) Load known registry
KNOWN_IDS=""
if [[ -f "$KNOWN_JSON" ]]; then
  KNOWN_IDS=$(jq -r '.[].id // empty' "$KNOWN_JSON" 2>/dev/null || echo "")
  KNOWN_COUNT=$(echo "$KNOWN_IDS" | grep -c . || echo "0")
  echo "📋 Known quarantined tests: $KNOWN_COUNT"
else
  echo "⚠️ No qa/flaky.json found - creating empty registry"
  echo "[]" > "$KNOWN_JSON"
  KNOWN_COUNT=0
fi

# 3) Detect new flakies (present in tree, not in registry)
NEW_FLAKIES=()
if [[ -s "$FOUND_IDS_FILE" ]]; then
  while IFS= read -r id; do
    if [[ -z "$KNOWN_IDS" ]] || ! echo "$KNOWN_IDS" | grep -qxF "$id"; then
      echo "❌ New flaky test detected (not in qa/flaky.json): $id"
      NEW_FLAKIES+=("$id")
    fi
  done < "$FOUND_IDS_FILE"
fi

# 4) Enforce SLA: any expired entries fail the build
EXPIRED_FLAKIES=()
if [[ -f "$KNOWN_JSON" ]] && [[ "$(jq 'length' "$KNOWN_JSON")" -gt 0 ]]; then
  NOW=$(date -u +%FT%TZ)
  EXPIRED_JSON=$(jq -r --arg now "$NOW" '.[] | select(.expires != null and .expires < $now) | .id' "$KNOWN_JSON" 2>/dev/null || echo "")
  
  if [[ -n "$EXPIRED_JSON" ]]; then
    echo "⏰ Expired quarantines found:"
    while IFS= read -r expired_id; do
      if [[ -n "$expired_id" ]]; then
        EXPIRED_FLAKIES+=("$expired_id")
        # Get additional details about the expired test
        EXPIRED_DETAILS=$(jq -r --arg id "$expired_id" '.[] | select(.id == $id) | "Owner: \(.owner), Impact: \(.impact), Expired: \(.expires)"' "$KNOWN_JSON")
        echo "  ❌ $expired_id"
        echo "     $EXPIRED_DETAILS"
      fi
    done <<< "$EXPIRED_JSON"
  fi
fi

# 5) Validate flaky.json schema
if [[ -f "$KNOWN_JSON" ]]; then
  if ! jq -e 'all(.[]; has("id") and has("owner") and has("expires"))' "$KNOWN_JSON" >/dev/null 2>&1; then
    echo "❌ qa/flaky.json entries must include required fields: id, owner, expires"
    echo "Example entry:"
    cat << 'EOF'
{
  "id": "path/to/test.js::@flaky test description",
  "path": "path/to/test.js", 
  "title": "@flaky test description",
  "owner": "@dev-handle",
  "impact": "high|medium|low",
  "first_seen": "2025-01-10T00:00:00Z",
  "expires": "2025-01-17T00:00:00Z",
  "notes": "Brief description or issue link"
}
EOF
    exit 1
  fi
fi

# 6) Report results and exit with appropriate code
TOTAL_ISSUES=$((${#NEW_FLAKIES[@]} + ${#EXPIRED_FLAKIES[@]}))

if [[ "$TOTAL_ISSUES" -gt 0 ]]; then
  echo ""
  echo "💥 Flaky test guard FAILED ($TOTAL_ISSUES issues)"
  
  if [[ ${#NEW_FLAKIES[@]} -gt 0 ]]; then
    echo ""
    echo "🆕 New flaky tests (${#NEW_FLAKIES[@]}):"
    printf '  - %s\n' "${NEW_FLAKIES[@]}"
    echo ""
    echo "Action required: Add entries to qa/flaky.json with owner, impact, and expiry date"
    echo "OR remove @flaky markers if tests are now stable"
  fi
  
  if [[ ${#EXPIRED_FLAKIES[@]} -gt 0 ]]; then
    echo ""
    echo "⏰ Expired quarantines (${#EXPIRED_FLAKIES[@]}):"
    printf '  - %s\n' "${EXPIRED_FLAKIES[@]}"
    echo ""
    echo "Action required: Either fix/remove these tests OR extend expiry with justification"
  fi
  
  echo ""
  echo "📚 See qa/FLAKY.md for detailed policy and procedures"
  exit 1
fi

# Success!
echo ""
echo "✅ Flaky guard passed"
echo "   - No new @flaky tests detected"
echo "   - No expired quarantines"
echo "   - Schema validation passed"

# Cleanup
rm -f "$FOUND_IDS_FILE"