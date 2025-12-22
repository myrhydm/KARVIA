#!/usr/bin/env bash
# seed-labels.sh — Create consistent GitHub labels across all 3 repositories
# Requires: gh CLI tool (https://cli.github.com/)
set -euo pipefail

# Repository configuration
REPOS=(
  "myrhydm/goaltracker_test"
  "myrhydm/iBrain"
  "myrhydm/goal_tracking"
)

# Label definitions: name|color|description
LABELS=(
  # Workflow stages
  "stage:requirements|0e8a16|Requirements gathering and analysis"
  "stage:architecture|1d76db|Technical architecture and design"
  "stage:design|f9d71b|UI/UX design and prototyping"
  "stage:development|0052cc|Implementation and coding"
  "stage:qa|5319e7|Quality assurance and testing"
  "stage:release|b60205|Release preparation and deployment"
  "stage:completed|28a745|Feature completed and delivered"
  "stage:cancelled|6f42c1|Feature cancelled or discontinued"
  
  # Priority levels
  "priority:critical|b60205|Critical priority - immediate attention"
  "priority:high|d73a4a|High priority - next sprint"
  "priority:medium|fbca04|Medium priority - upcoming sprints"
  "priority:low|0e8a16|Low priority - future consideration"
  
  # Scope targeting
  "scope:ibrain|1d76db|Affects iBrain intelligence platform"
  "scope:goal-tracking|f9d71b|Affects goal_tracking customer app"
  "scope:integration|5319e7|Affects goaltracker_test integration hub"
  "scope:multi-repo|6f42c1|Affects multiple repositories"
  
  # Issue types
  "type:feature|0052cc|New feature or enhancement"
  "type:bug|b60205|Bug fix or error correction"
  "type:task|fbca04|Development task or maintenance"
  "type:docs|28a745|Documentation update"
  "type:infra|6f42c1|Infrastructure or tooling change"
  
  # Blocking and dependencies
  "blocked:true|b60205|Feature is currently blocked"
  "needs-review|fbca04|Requires review or approval"
  "needs-testing|f9d71b|Requires testing or validation"
  "dependencies|d73a4a|Has external dependencies"
  
  # Repository specific
  "engine:assessment|0e8a16|Assessment engine related"
  "engine:scoring|1d76db|Scoring engine related"  
  "engine:tracking|5319e7|Tracking engine related"
  "engine:observer|f9d71b|Observer engine related"
  "engine:planner|0052cc|Planner engine related"
  "engine:iam|b60205|IAM engine related"
  
  # Quality gates
  "qa:manual|fbca04|Requires manual testing"
  "qa:automated|28a745|Automated testing coverage"
  "security:review|b60205|Security review required"
  "performance:critical|d73a4a|Performance critical feature"
)

usage() {
  cat <<EOF
GitHub Labels Seeding Script

Usage:
  $0 setup                 # Create labels in all repositories
  $0 setup <repo>          # Create labels in specific repository
  $0 list                  # List all defined labels
  $0 check                 # Check current labels in all repos
  $0 cleanup               # Remove undefined labels (interactive)

Prerequisites:
  - gh CLI tool installed and authenticated
  - Access to all target repositories

Examples:
  $0 setup                 # Set up all labels in all repos
  $0 setup iBrain         # Set up labels only in iBrain repo
  $0 check                # Show current state of labels
EOF
}

require_gh() {
  command -v gh >/dev/null || {
    echo "❌ GitHub CLI (gh) is required"
    echo "Install: https://cli.github.com/"
    exit 1
  }
  
  gh auth status >/dev/null 2>&1 || {
    echo "❌ GitHub CLI not authenticated"
    echo "Run: gh auth login"
    exit 1
  }
}

list_labels() {
  echo "📋 Defined Labels:"
  echo "=================="
  for label in "${LABELS[@]}"; do
    IFS='|' read -r name color desc <<< "$label"
    printf "%-25s #%-6s %s\n" "$name" "$color" "$desc"
  done
}

create_label() {
  local repo="$1"
  local name="$2" 
  local color="$3"
  local desc="$4"
  
  if gh label list -R "$repo" --json name -q ".[].name" | grep -q "^$name$"; then
    echo "  ✓ $name (exists)"
    # Update existing label
    gh label edit -R "$repo" "$name" --color "$color" --description "$desc" 2>/dev/null || true
  else
    echo "  + $name"
    if ! gh label create -R "$repo" "$name" --color "$color" --description "$desc" 2>/dev/null; then
      echo "    ⚠️ Failed to create $name"
    fi
  fi
}

setup_repo() {
  local repo="$1"
  echo "🏗️ Setting up labels for $repo..."
  
  # Check if repo is accessible
  if ! gh repo view "$repo" >/dev/null 2>&1; then
    echo "❌ Cannot access repository: $repo"
    echo "   Check repository name and permissions"
    return 1
  fi
  
  # Create/update each label
  for label in "${LABELS[@]}"; do
    IFS='|' read -r name color desc <<< "$label"
    create_label "$repo" "$name" "$color" "$desc"
  done
  
  echo "✅ Labels setup complete for $repo"
}

setup_all() {
  echo "🚀 Setting up labels across all repositories..."
  echo "Repositories: ${REPOS[*]}"
  echo
  
  for repo in "${REPOS[@]}"; do
    setup_repo "$repo"
    echo
  done
  
  echo "🎉 All repositories configured!"
}

check_labels() {
  echo "🔍 Current label status:"
  echo "======================="
  
  for repo in "${REPOS[@]}"; do
    echo "📦 $repo:"
    if gh repo view "$repo" >/dev/null 2>&1; then
      local count
      count=$(gh label list -R "$repo" --json name -q ". | length")
      echo "  Labels: $count total"
      
      # Check for our defined labels
      local missing=0
      for label in "${LABELS[@]}"; do
        IFS='|' read -r name color desc <<< "$label"
        if ! gh label list -R "$repo" --json name -q ".[].name" | grep -q "^$name$"; then
          if [ $missing -eq 0 ]; then
            echo "  Missing:"
          fi
          echo "    - $name"
          ((missing++))
        fi
      done
      
      if [ $missing -eq 0 ]; then
        echo "  ✅ All required labels present"
      else
        echo "  ⚠️  $missing labels missing"
      fi
    else
      echo "  ❌ Cannot access repository"
    fi
    echo
  done
}

cleanup_labels() {
  echo "🧹 Label cleanup (interactive mode)..."
  echo "This will show labels that exist but aren't in our definition"
  echo
  
  # Define our label names for comparison
  local defined_labels=()
  for label in "${LABELS[@]}"; do
    IFS='|' read -r name color desc <<< "$label"
    defined_labels+=("$name")
  done
  
  for repo in "${REPOS[@]}"; do
    echo "📦 Checking $repo..."
    
    if ! gh repo view "$repo" >/dev/null 2>&1; then
      echo "  ❌ Cannot access repository"
      continue
    fi
    
    # Get current labels
    local current_labels
    mapfile -t current_labels < <(gh label list -R "$repo" --json name -q ".[].name")
    
    local undefined_labels=()
    for current in "${current_labels[@]}"; do
      local found=false
      for defined in "${defined_labels[@]}"; do
        if [[ "$current" == "$defined" ]]; then
          found=true
          break
        fi
      done
      
      if [[ "$found" == "false" ]]; then
        undefined_labels+=("$current")
      fi
    done
    
    if [ ${#undefined_labels[@]} -eq 0 ]; then
      echo "  ✅ No undefined labels"
    else
      echo "  ⚠️  Undefined labels found:"
      for undefined in "${undefined_labels[@]}"; do
        echo "    - $undefined"
      done
      
      read -p "  Delete undefined labels in $repo? (y/N): " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        for undefined in "${undefined_labels[@]}"; do
          echo "    🗑️  Deleting: $undefined"
          gh label delete -R "$repo" "$undefined" --yes
        done
      fi
    fi
    echo
  done
}

main() {
  require_gh
  
  case "${1:-}" in
    "setup")
      if [ -n "${2:-}" ]; then
        setup_repo "$2"
      else
        setup_all
      fi
      ;;
    "list")
      list_labels
      ;;
    "check")
      check_labels
      ;;
    "cleanup")
      cleanup_labels
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"