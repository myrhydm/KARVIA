#!/bin/bash

# 🏷️ GitHub Labels Seed Script
# Creates all required labels for 3-repo streamlining automation
# Run this script in each repository directory

set -e

echo "🏷️ GitHub Labels Seed Script"
echo "============================="

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is required but not installed."
    echo "   Install from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated."
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"
echo ""

# Function to create label with error handling
create_label() {
    local name="$1"
    local color="$2"
    local description="$3"
    
    if gh label create "$name" --color "$color" --description "$description" 2>/dev/null; then
        echo "✅ Created: $name"
    else
        echo "⚠️  Exists: $name"
    fi
}

echo "🏗️ Creating Process Stage Labels..."
create_label "stage:requirements" "FF6B6B" "Requirements gathering phase"
create_label "stage:architecture" "4ECDC4" "Architecture design phase"
create_label "stage:design" "45B7D1" "UI/UX design phase"
create_label "stage:development" "96CEB4" "Development implementation phase"
create_label "stage:qa" "FFEAA7" "Quality assurance testing phase"
create_label "stage:release" "DDA0DD" "Release preparation phase"

echo ""
echo "🎯 Creating Scope Indicator Labels..."
create_label "scope:ibrain" "FF7675" "Requires iBrain intelligence platform changes"
create_label "scope:goal-tracking" "74B9FF" "Requires goal tracking app changes"
create_label "scope:integration" "A29BFE" "Requires integration hub changes"
create_label "needs-development" "00B894" "Trigger for cross-repo automation"

echo ""
echo "👥 Creating Role Assignment Labels..."
create_label "role:pm" "E17055" "Product Manager assignment"
create_label "role:architect" "81ECEC" "Technical Architect assignment"
create_label "role:designer" "FAB1A0" "UI/UX Designer assignment"
create_label "role:developer" "00CEC9" "Developer assignment"
create_label "role:qa" "FDCB6E" "Quality Assurance assignment"

echo ""
echo "⚙️ Creating Pipeline Control Labels..."
create_label "tracking" "636E72" "Cross-repo tracking issue"
create_label "cross-repo" "2D3436" "Multi-repository coordination required"
create_label "triage:needed" "D73A49" "Needs initial triage and priority assignment"

echo ""
echo "🎉 Label creation complete!"
echo ""
echo "📊 Summary:"
echo "   • 6 Process stage labels"
echo "   • 4 Scope indicator labels"
echo "   • 5 Role assignment labels"
echo "   • 3 Pipeline control labels"
echo "   • Total: 18 labels created"
echo ""
echo "🚀 Repository is now ready for streamlined automation!"
echo ""
echo "💡 Next steps:"
echo "   1. Run this script in iBrain and goal_tracking repositories"
echo "   2. Configure GitHub secrets (RENDER_DEPLOY_HOOK_URL, CROSS_REPO_TOKEN)"
echo "   3. Set up Render deploy hooks"
echo "   4. Test the automation with a sample issue"
echo ""
echo "📖 For detailed setup instructions, see:"
echo "   docs/SETUP_GUIDE.md"