#!/usr/bin/env bash
# pipeline-query.sh — quick queries & safe updates for logs/pipeline/*.json
# deps: jq (brew install jq or apt-get install -y jq)
set -euo pipefail

PIPELINE_DIR="${PIPELINE_DIR:-logs/pipeline}"
STAGES=("requirements" "architecture" "design" "development" "qa" "release" "completed" "cancelled")

usage() {
  cat <<EOF
Usage:
  $0 stats                         # count by stage & priority
  $0 blocked                       # list blocked features
  $0 overdue <days>                # dev > N days
  $0 stage <stage>                 # list features in stage
  $0 targets                       # distribution of targets
  $0 owner <@handle>               # features owned by handle (pm/architect/dev/qa)
  $0 update <FT-ID> [stage]        # advance FT to next stage, or to given stage
EOF
}

require_jq() { command -v jq >/dev/null || { echo "jq is required"; exit 1; }; }
ensure_dir() { [ -d "$PIPELINE_DIR" ] || { echo "No $PIPELINE_DIR"; exit 1; }; }

stats() {
  echo "📊 By stage:"
  jq -r '.currentStage' "$PIPELINE_DIR"/FT-*.json 2>/dev/null | sort | uniq -c || true
  echo; echo "🏷️ By priority:"
  jq -r '.priority' "$PIPELINE_DIR"/FT-*.json 2>/dev/null | sort | uniq -c || true
}

blocked() {
  jq -r '
    select(.blocked==true or ([.stageHistory[]?|select(.status=="blocked")]|length)>0) |
    "\(.featureId)\t\(.title)\t" + (.blockedReason // "blocked in stage")
  ' "$PIPELINE_DIR"/FT-*.json 2>/dev/null || true
}

overdue() {
  local days="${1:-7}"
  jq -r --argjson cutoff "$(date -u -v-"$days"d +%s 2>/dev/null || date -u -d "$days days ago" +%s)" '
    . as $f
    | select($f.currentStage=="development")
    | ([$f.stageHistory[]?|select(.stage=="development")]|last) as $dev
    | select(($dev.startedAt|fromdateiso8601) < $cutoff)
    | "\($f.featureId)\t\($f.title)\tdev since: \($dev.startedAt)"
  ' "$PIPELINE_DIR"/FT-*.json 2>/dev/null || true
}

stage_list() {
  local s="$1"
  jq -r --arg s "$s" 'select(.currentStage==$s) | "\(.featureId)\t\(.title)"' \
    "$PIPELINE_DIR"/FT-*.json 2>/dev/null || true
}

targets() {
  jq -r '.targets[]?' "$PIPELINE_DIR"/FT-*.json 2>/dev/null | sort | uniq -c || true
}

owner() {
  local h="$1"
  jq -r --arg h "$h" '
    select(.owners.pm==$h or .owners.architect==$h or .owners.dev==$h or .owners.qa==$h) |
    "\(.featureId)\t\(.title)\t(\(.owners.pm//""), \(.owners.architect//""), \(.owners.dev//""), \(.owners.qa//""))"
  ' "$PIPELINE_DIR"/FT-*.json 2>/dev/null || true
}

next_stage_of() {
  local s="$1"; local i
  for i in "${!STAGES[@]}"; do
    if [[ "${STAGES[$i]}" == "$s" ]]; then
      echo "${STAGES[$((i+1))]:-completed}"
      return
    fi
  done
  echo "completed"
}

update_stage() {
  local ft="$1"; local target="${2:-}"
  local file="$PIPELINE_DIR/$ft.json"
  [ -f "$file" ] || { echo "Not found: $file"; exit 1; }

  local current
  current="$(jq -r '.currentStage' "$file")"
  if [[ -z "$target" ]]; then
    target="$(next_stage_of "$current")"
  fi

  # atomic write
  tmp="$(mktemp)"
  jq --arg target "$target" '
    . as $f
    | .lastUpdated = (now|todate)
    # close any open stage as done
    | .stageHistory = ((.stageHistory // []) | map(if .completedAt==null then .completedAt=(now|todate) | .status="done" else . end))
    # move current
    | .currentStage = $target
    # append new stage entry (in_progress), except for completed/cancelled
    | if ($target=="completed" or $target=="cancelled") then
        .stageHistory += [{stage:$target,status:"done",startedAt:(now|todate),completedAt:(now|todate),assignee:(.owners.dev // "@dev")}]
      else
        .stageHistory += [{stage:$target,status:"in_progress",startedAt:(now|todate),completedAt:null,assignee:(.owners.dev // "@dev")}]
      end
  ' "$file" > "$tmp"

  mv "$tmp" "$file"
  echo "✔ $ft → stage:$target (updated $file)"
  echo "ℹ Remember to commit with [skip deploy]"
}

main() {
  require_jq; ensure_dir
  cmd="${1:-}"; shift || true
  case "$cmd" in
    stats) stats ;;
    blocked) blocked ;;
    overdue) overdue "${1:-7}" ;;
    stage) stage_list "${1:?stage name required}";;
    targets) targets ;;
    owner) owner "${1:?@handle required}";;
    update) update_stage "${1:?FT-ID required}" "${2:-}";;
    *) usage; exit 1 ;;
  esac
}
main "$@"