#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Checking file organization compliance..."

# Define allowed files in repository root
ALLOWED_ROOT="^(README\.md|package\.json|package-lock\.json|render\.yaml|\.gitignore|LICENSE|\.editorconfig|\.prettierrc.*|\.eslintrc.*|CODEOWNERS|tsconfig\.json|\.nvmrc|\.tool-versions|SITEMAP\.md|start-all-engines\.sh|stop-all-engines\.sh|start-bramhi\.js|vercel\.json|mcp\.json)$"

# Check for disallowed files in root
echo "📁 Validating root directory..."
ROOT_BAD=$(git ls-files -- ':/*' | awk -F/ 'NF==1' | grep -Ev "$ALLOWED_ROOT" || true)

if [ -n "$ROOT_BAD" ]; then
  echo "❌ Disallowed files in repository root:"
  echo "$ROOT_BAD"
  echo ""
  echo "🔧 Allowed root files:"
  echo "  - README.md, package.json, package-lock.json"  
  echo "  - render.yaml, .gitignore, LICENSE"
  echo "  - .editorconfig, .prettierrc*, .eslintrc*"
  echo "  - CODEOWNERS, tsconfig.json, .nvmrc"
  echo "  - SITEMAP.md, mcp.json"
  echo "  - start-all-engines.sh, stop-all-engines.sh"
  echo ""
  echo "📖 See SITEMAP.md for proper file placement"
  exit 1
fi

# Check for runtime code in docs
echo "📚 Validating no runtime code in docs..."
RUNTIME_IN_DOCS=$(find docs/ -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v node_modules || true)

if [ -n "$RUNTIME_IN_DOCS" ]; then
  echo "❌ Runtime code found in docs/ directory:"
  echo "$RUNTIME_IN_DOCS"
  echo ""
  echo "🔧 Move runtime code to appropriate locations:"
  echo "  - server/ for backend code"
  echo "  - client/ for frontend code"
  echo "  - scripts/ for utility scripts"
  exit 1
fi

# Check for common misplaced patterns
echo "🔍 Checking for common misplaced patterns..."

# Check for test files outside qa/
MISPLACED_TESTS=$(find . -name "*.test.js" -o -name "*.spec.js" | grep -v qa/ | grep -v node_modules || true)
if [ -n "$MISPLACED_TESTS" ]; then
  echo "⚠️ Test files found outside qa/ directory:"
  echo "$MISPLACED_TESTS"
  echo "💡 Consider moving to qa/automation/tests/"
fi

# Check for docs scattered in other folders
SCATTERED_DOCS=$(find . -name "*.md" | grep -E "/(docs|documentation|readme)" | grep -v "^./docs/" | grep -v node_modules || true)
if [ -n "$SCATTERED_DOCS" ]; then
  echo "⚠️ Documentation files found outside docs/ directory:"
  echo "$SCATTERED_DOCS"
  echo "💡 Consider moving to docs/ or archive/"
fi

echo "✅ Root layout compliance check passed"
echo "📋 File organization validation complete"