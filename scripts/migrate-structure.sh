#!/bin/bash
# 🏗️ Repository Structure Migration Script
# Unifies directory structures across goaltracker_test, goal_tracking, and iBrain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Repository paths
GOAL_TRACKING="/Users/sagarrs/Desktop/official_dev/goal_tracking"
IBRAIN="/Users/sagarrs/Desktop/official_dev/iBrain"

migrate_goal_tracking() {
    log_info "Migrating goal_tracking repository structure..."
    
    cd "$GOAL_TRACKING"
    
    # Create unified directory structure
    mkdir -p docs/bootloader
    mkdir -p docs/architecture
    mkdir -p pm/active-features
    mkdir -p pm/customer-features
    mkdir -p architect/active-designs
    mkdir -p architect/frontend-systems
    mkdir -p developer/active-implementations
    mkdir -p qa/active-testing
    mkdir -p ops/active-deployments
    mkdir -p scripts
    
    # Migrate js/ to pages/scripts/ for consistency with master
    if [ -d "client/js" ] && [ ! -d "client/pages/scripts" ]; then
        log_info "Migrating js/ to pages/scripts/ structure..."
        mkdir -p client/pages/scripts
        
        # Move all JS files
        if [ "$(ls -A client/js 2>/dev/null)" ]; then
            mv client/js/* client/pages/scripts/
            rmdir client/js
            log_success "Migrated JavaScript files to pages/scripts/"
        fi
    fi
    
    # Update HTML file references from js/ to pages/scripts/
    log_info "Updating script references in HTML files..."
    find client -name "*.html" -type f -exec sed -i.bak 's|src="js/|src="pages/scripts/|g' {} \;
    find client -name "*.html.bak" -delete
    
    log_success "goal_tracking structure migration completed"
}

migrate_iBrain() {
    log_info "Migrating iBrain repository structure..."
    
    cd "$IBRAIN"
    
    # Create unified directory structure
    mkdir -p docs/bootloader
    mkdir -p docs/architecture
    mkdir -p pm/active-features
    mkdir -p pm/intelligence-products
    mkdir -p architect/active-designs
    mkdir -p architect/backend-systems
    mkdir -p developer/active-implementations
    mkdir -p qa/active-testing
    mkdir -p ops/active-deployments
    mkdir -p scripts
    mkdir -p shared/models
    mkdir -p shared/utilities
    
    # Create routes directory if it doesn't exist
    mkdir -p routes
    
    log_success "iBrain structure migration completed"
}

create_associate_role_files() {
    log_info "Creating Associate role files..."
    
    # Create Associate PM file for goal_tracking
    cat > "$GOAL_TRACKING/pm/ASSOCIATE_PM_CUSTOMER_FOCUS.md" << 'EOF'
# Associate PM - Customer Focus
## Domain: Customer Applications & Experience

### Responsibilities
- Customer journey optimization
- UI/UX requirement analysis  
- Customer feedback collection and analysis
- Frontend feature prioritization
- Customer-specific customization requests

### Reporting
- **Reports To**: Master PM (goaltracker_test)
- **Frequency**: Weekly status updates
- **Escalation**: <24 hours for critical customer issues

### Current Focus Areas
- [ ] Customer onboarding optimization
- [ ] User interface improvements
- [ ] Customer satisfaction metrics
- [ ] Frontend performance optimization
EOF

    # Create Associate Architect file for goal_tracking
    cat > "$GOAL_TRACKING/architect/ASSOCIATE_ARCHITECT_FRONTEND.md" << 'EOF'
# Associate Architect - Frontend Systems  
## Domain: Customer-Facing Architecture

### Responsibilities
- Frontend architecture and performance
- Customer-facing API design
- UI component system design
- Frontend security and authentication
- Mobile and responsive design architecture

### Reporting
- **Reports To**: Master Architect (goaltracker_test)
- **Frequency**: Weekly technical reviews
- **Escalation**: <4 hours for critical technical issues

### Current Focus Areas
- [ ] Component system optimization
- [ ] Frontend API design
- [ ] Performance monitoring
- [ ] Security implementation
EOF

    # Create Associate PM file for iBrain
    cat > "$IBRAIN/pm/ASSOCIATE_PM_INTELLIGENCE.md" << 'EOF'
# Associate PM - Intelligence Products
## Domain: AI/ML & Intelligence Services

### Responsibilities  
- AI/ML feature development roadmap
- Engine performance optimization
- Intelligence service integrations
- Data analytics and insights
- Algorithm improvement prioritization

### Reporting
- **Reports To**: Master PM (goaltracker_test)
- **Frequency**: Weekly status updates
- **Escalation**: <24 hours for critical service issues

### Current Focus Areas
- [ ] AI algorithm optimization
- [ ] Engine performance metrics
- [ ] Intelligence service scaling
- [ ] Data analytics improvements
EOF

    # Create Associate Architect file for iBrain
    cat > "$IBRAIN/architect/ASSOCIATE_ARCHITECT_BACKEND.md" << 'EOF'
# Associate Architect - Backend Systems
## Domain: Intelligence Platform Architecture

### Responsibilities
- Engine architecture and scalability
- AI/ML pipeline design  
- Database optimization for intelligence services
- Microservice communication protocols
- Performance and monitoring systems

### Reporting
- **Reports To**: Master Architect (goaltracker_test)
- **Frequency**: Weekly technical reviews
- **Escalation**: <4 hours for critical system issues

### Current Focus Areas
- [ ] Microservice architecture
- [ ] Database optimization
- [ ] AI pipeline efficiency
- [ ] System monitoring
EOF

    log_success "Associate role files created"
}

main() {
    log_info "🚀 Starting repository structure migration..."
    
    migrate_goal_tracking
    migrate_iBrain
    create_associate_role_files
    
    log_success "🎉 Repository structure migration completed successfully!"
    log_info "Next steps:"
    log_info "1. Review migrated structures in both repositories"
    log_info "2. Run sync-repos.sh to synchronize all repositories"
    log_info "3. Test functionality after structure changes"
}

# Execute migration
main "$@"