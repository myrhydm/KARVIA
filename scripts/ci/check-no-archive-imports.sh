#!/usr/bin/env bash
set -euo pipefail

echo "🗃️ Checking for imports from archive directories..."

# Check for imports/requires from archive (excluding this script)
ARCHIVE_IMPORTS=$(git grep "import.*archive/" -- ':(exclude)archive/**' ':(exclude)**/node_modules/**' ':(exclude)scripts/ci/**' || true)
ARCHIVE_REQUIRES=$(git grep "require.*archive/" -- ':(exclude)archive/**' ':(exclude)**/node_modules/**' ':(exclude)scripts/ci/**' || true)

if [ -n "$ARCHIVE_IMPORTS" ]; then
  echo "❌ Imports from archive/ detected:"
  echo "$ARCHIVE_IMPORTS"
  echo ""
  echo "🔧 Fix: Remove imports from archived files or move needed files back to active structure"
  exit 1
fi

if [ -n "$ARCHIVE_REQUIRES" ]; then
  echo "❌ Requires from archive/ detected:"
  echo "$ARCHIVE_REQUIRES"
  echo ""
  echo "🔧 Fix: Remove requires from archived files or move needed files back to active structure"
  exit 1
fi

# Check for references to archived paths in documentation
ARCHIVE_REFS=$(git grep -r "archive/" docs/ | grep -v "This file is archived" | grep -v "moved to archive" || true)
if [ -n "$ARCHIVE_REFS" ]; then
  echo "⚠️ References to archive/ found in documentation:"
  echo "$ARCHIVE_REFS"
  echo "💡 Update documentation to reference current file locations"
fi

echo "✅ No imports from archive/ detected"
echo "🗃️ Archive import validation complete"