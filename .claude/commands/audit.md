# Audit Session Initialization

**Version**: 2.1.0
**Last Updated**: December 21, 2025
**Session Type**: AUDIT
**Access Profile**: AUDIT (from ACCESS_CONTROL.yaml)
**Token Budget**: 50-70K (25-35%)
**Purpose**: Code review, quality validation, issue identification, **document health check**

---

## TIERED CONTEXT LOADING

### Step 1: ALWAYS Load (Constitutional + Governance)

```
READ:DEEP → IBRAIN_STRATEGY/1-PRODUCT/strategy/00-constitutional/
           └── MVG_MINIMUM_VIABLE_GOVERNANCE.md (T1 - Supreme Authority)

READ:DEEP → IBRAIN_STRATEGY/1-PRODUCT/strategy/05-governance/
           └── DOCUMENT_GENOME_SPECIFICATION.md
           └── CANONICAL_SOURCE_REGISTRY.md
```

**Why**: Audits need governance context to validate document health.

### Step 2: Load Based on Audit Type

**Select your audit type** (then load the corresponding documents):

#### Type A: Code/Security Audit
```
READ:DEEP  → 01-authoritative/SECURITY_FRAMEWORK.md
READ:SKIM  → 01-authoritative/API_CONTRACTS_SPECIFICATION.md
READ:REF   → .claude/BEST_PRACTICES.md
SKIP       → 03-engines/, 04-vision/
```

#### Type B: Architecture Audit
```
READ:DEEP  → 02-master/MASTER_TECHNICAL_ARCHITECTURE.md
READ:SKIM  → 01-authoritative/RUNTIME_ORCHESTRATION.md
READ:REF   → .claude/CODEBASE_STRUCTURE.md
SKIP       → 04-vision/
```

#### Type C: Document Health Audit
```
READ:DEEP  → 05-governance/DOCUMENT_REGISTRY.md
READ:DEEP  → 05-governance/CANONICAL_SOURCE_REGISTRY.md
READ:REF   → All documents in scope
SKIP       → 04-vision/
```

#### Type D: .claude Folder Audit
```
READ:DEEP  → .claude/DOCUMENT_REGISTRY.md
READ:DEEP  → .claude/project.yaml
READ:REF   → .claude/commands/*.md
READ:REF   → .claude/templates/*.md
SKIP       → strategy/ (unless referenced)
```

---

## CONTEXT LOADING MATRIX

| Audit Type | 00-const | 01-auth | 02-master | 05-gov | Code Ref |
|------------|----------|---------|-----------|--------|----------|
| Code/Security | DEEP | DEEP | SKIP | SKIM | code files |
| Architecture | DEEP | SKIM | DEEP | SKIP | services/ |
| Doc Health | DEEP | SKIP | SKIP | DEEP | strategy/ |
| .claude Folder | SKIM | SKIP | SKIP | SKIP | .claude/ |

**Legend**: DEEP = Full read | SKIM = Headers + key sections | SKIP = Don't load

---

## ACCESS CONTROL PROFILE: AUDIT

From `.claude/ACCESS_CONTROL.yaml`:

```yaml
AUDIT:
  can_read: ["DOC-*"]
  can_write: ["DOC-T4-*"]
  cannot_write: ["DOC-T1-*", "DOC-T2-*", "DOC-T3-*"]
  notes: "Read-heavy profile, minimal writes"
```

**Restrictions**:
- Can read ALL documents (full visibility for auditing)
- Can only write T4 (Working) documents
- Cannot modify T1, T2, or T3 documents
- Primary purpose is validation, not modification

**Note**: Audit findings that require T2/T3 changes should be documented and addressed in a `/strategy` or `/coding` session.

---

## Audit Scope

**What are you auditing?** (Select scope):

- [ ] **Full Service Audit** - Review entire service
- [ ] **Feature Audit** - Review specific feature
- [ ] **Partial Audit** - Review specific files
- [ ] **Security Audit** - Focus on vulnerabilities
- [ ] **Architecture Audit** - Focus on design patterns
- [ ] **Documentation Audit** - Focus on docs completeness
- [ ] **Document Health Audit** - Redundancy check, genome verification
- [ ] **.claude Folder Audit** - **NEW!** Command versions, templates, registry

**Files/Areas to Review**:
1. [file/area 1]
2. [file/area 2]
3. [file/area 3]

---

## Audit Categories & Checklists

### 1. Security Audit

```
Authentication/Authorization:
[ ] All protected routes have authenticateToken
[ ] Role-based routes use requireRole()
[ ] JWT validation implemented correctly
[ ] No auth bypass vulnerabilities

Input Validation:
[ ] All user input validated
[ ] Joi schemas or validators present
[ ] No SQL/NoSQL injection vulnerabilities
[ ] File uploads validated (if applicable)

Secrets & Configuration:
[ ] No hardcoded API keys or secrets
[ ] Environment variables used properly
[ ] No secrets in git history
[ ] .env.example updated (without real secrets)

Multi-Tenancy:
[ ] All queries filter by business context
[ ] No cross-tenant data leakage possible
[ ] Tenant isolation verified in all endpoints
```

### 2. Architecture Audit

```
RESTful Design:
[ ] Proper HTTP verbs (GET/POST/PUT/DELETE/PATCH)
[ ] Resource-based URLs
[ ] Consistent naming conventions
[ ] Proper status codes (200, 201, 400, 404, 500)

Error Handling:
[ ] try/catch blocks present
[ ] Error middleware used
[ ] Meaningful error messages
[ ] Error logging implemented
[ ] No exposed stack traces in production

Service Pattern:
[ ] Business logic in services, not routes
[ ] Services are reusable
[ ] Proper separation of concerns
[ ] DRY principle followed

Cross-Service Communication:
[ ] Gateway proxy patterns followed
[ ] Service discovery used correctly
[ ] Timeout handling implemented
[ ] Fallback strategies in place
```

### 3. Code Quality Audit

```
Readability:
[ ] Code is self-documenting
[ ] Meaningful variable/function names
[ ] Proper indentation and formatting
[ ] No overly complex functions (>50 lines)

Code Smells:
[ ] No code duplication
[ ] No dead/unreachable code
[ ] No console.log() in production code
[ ] No commented-out code blocks
[ ] No magic numbers (use constants)

Technical Debt:
[ ] No TODOs without tickets
[ ] No FIXME without explanation
[ ] No obvious hacks or workarounds
```

### 4. Documentation Audit

```
Code Documentation:
[ ] README updated (if project-level changes)
[ ] API endpoints documented
[ ] Complex functions explained
[ ] Model schemas documented

API Documentation:
[ ] OpenAPI specs current
[ ] Examples provided
[ ] Error responses documented
```

### 5. Document Health Audit (NEW!)

> **Reference**: See [DOCUMENT_GENOME_SPECIFICATION.md](../IBRAIN_STRATEGY/1-PRODUCT/strategy/DOCUMENT_GENOME_SPECIFICATION.md)
> **Reference**: See [CANONICAL_SOURCE_REGISTRY.md](../IBRAIN_STRATEGY/1-PRODUCT/strategy/CANONICAL_SOURCE_REGISTRY.md)

#### 5.1 Scan Documents

```bash
# Get all META_DATA documents in IBRAIN_STRATEGY
find IBRAIN_STRATEGY -name "*.md" -type f | wc -l

# Check for missing genomes
grep -L "Document Genome" IBRAIN_STRATEGY/**/*.md 2>/dev/null
```

#### 5.2 Genome Verification Checklist

```
Document Genome Presence:
[ ] All strategy docs have Document Genome section
[ ] All genomes have Quick Genome one-liner
[ ] All genomes have complete dimension table

Genome Accuracy:
[ ] Class matches document content
[ ] Topic Domain correctly assigned
[ ] Authority Tier is appropriate
[ ] Canonical Source correctly linked
[ ] Lifecycle state reflects reality
[ ] Freshness calculated correctly
```

#### 5.3 Redundancy Analysis

**For each document, calculate overlap:**

```
1. Extract key concepts:
   - All H2/H3 headings
   - All **bold** terms
   - All `code` terms

2. Compare with canonical source for same domain:
   - Shared concepts / Total unique concepts = Overlap %

3. Flag documents:
   - >80% overlap → REDUNDANT candidate
   - 60-80% overlap → SUPPLEMENTARY
   - 40-60% overlap → Review needed
   - <40% overlap → ESSENTIAL/VALUABLE
```

#### 5.4 Health Status Categories

| Status | Criteria | Count |
|--------|----------|-------|
| 🟢 **Healthy** | Active, Fresh, <40% redundancy | [N] |
| 🟡 **Stale** | Freshness = COLD or FROZEN | [N] |
| 🟠 **Redundant** | Overlap >60% with canonical | [N] |
| 🔴 **Broken** | Missing links, missing genome | [N] |
| ⚫ **Archived** | Lifecycle = ARCHIVED | [N] |

#### 5.5 Canonical Alignment Check

```
For each Topic Domain:
[ ] Canonical source exists and is documented
[ ] All derived docs reference canonical correctly
[ ] No conflicts between canonical and derived
[ ] CANONICAL_SOURCE_REGISTRY.md is up to date
```

#### 5.6 Document Health Report Template

```markdown
## Document Health Report

**Audit Date**: [Date]
**Documents Scanned**: [N]
**Auditor**: Claude

### Summary by Status

| Status | Count | % of Total |
|--------|-------|------------|
| 🟢 Healthy | [N] | [X]% |
| 🟡 Stale | [N] | [X]% |
| 🟠 Redundant | [N] | [X]% |
| 🔴 Broken | [N] | [X]% |
| ⚫ Archived | [N] | [X]% |

### Redundancy Candidates

| Document | Overlaps With | Score | Recommendation |
|----------|---------------|-------|----------------|
| [doc.md] | [canonical.md] | [X]% | Archive/Merge/Keep |

### Missing Genomes

| Document | Action Needed |
|----------|---------------|
| [doc.md] | Add genome section |

### Stale Documents (COLD/FROZEN)

| Document | Days Since Update | Action |
|----------|-------------------|--------|
| [doc.md] | [N] days | Review/Update/Archive |

### Broken Links Found

| Document | Broken Link | Suggested Fix |
|----------|-------------|---------------|
| [doc.md] | [link] | [fix] |

### Recommended Actions

1. **ARCHIVE**: [docs to archive]
2. **MERGE**: [docs to merge into canonical]
3. **UPDATE**: [docs needing content refresh]
4. **FIX**: [docs with broken links/genomes]

### Updated Genomes This Audit

| Document | Fields Updated |
|----------|----------------|
| [doc.md] | Redundancy, Lifecycle, Directive |

---

**Health Score**: [X/10]
**Next Audit Recommended**: [date]
```

---

### 6. .claude Folder Audit

> **Reference**: See [DOCUMENT_REGISTRY.md](../DOCUMENT_REGISTRY.md)
> **Reference**: See [project.yaml](../project.yaml)

#### 6.1 Scan .claude Structure

```bash
# List all files in .claude folder
find .claude -type f -name "*.md" | wc -l

# Check for expected structure
ls -la .claude/
ls -la .claude/commands/
ls -la .claude/templates/
```

#### 6.2 Command File Verification

```
Command Presence:
[ ] init.md exists and is current version
[ ] close.md exists and is current version
[ ] audit.md exists and is current version
[ ] setup.md exists and is current version
[ ] coding.md exists
[ ] testing.md exists
[ ] strategy.md exists
[ ] general.md exists

Command Quality:
[ ] All commands have version headers
[ ] All commands have Required Reading section
[ ] All commands have Success Criteria
[ ] No broken internal links
[ ] Workflows are actionable
```

#### 6.3 Template Verification

```
Template Presence:
[ ] templates/README_TEMPLATE.md exists
[ ] templates/MVG_TEMPLATE.md exists
[ ] templates/GENOME_TEMPLATE.md exists
[ ] templates/SESSION_SEAL_TEMPLATE.md exists

Template Quality:
[ ] Placeholders use [BRACKET] format
[ ] Examples are accurate
[ ] Templates match current standards
[ ] No outdated references
```

#### 6.4 Core Document Verification

```
Core Documents:
[ ] README.md exists with Session Seal
[ ] MASTER_GUIDE.md exists
[ ] BEST_PRACTICES.md exists with version
[ ] SESSION_LOG.md exists
[ ] CHANGE_LOG.md exists
[ ] CODEBASE_STRUCTURE.md exists
[ ] DATA_STRUCTURE.md exists
[ ] DOCUMENT_REGISTRY.md exists
[ ] project.yaml exists

Document Quality:
[ ] All docs have version numbers
[ ] Versions match DOCUMENT_REGISTRY.md
[ ] No orphaned files (not in registry)
[ ] No missing files (in registry but not exist)
```

#### 6.5 Registry Accuracy Check

```
For each file in .claude/:
[ ] File is listed in DOCUMENT_REGISTRY.md
[ ] Version in file matches registry
[ ] Last Updated date is accurate
[ ] Status reflects reality (Active/Deprecated/Archived)
```

#### 6.6 .claude Health Report Template

```markdown
## .claude Folder Health Report

**Audit Date**: [Date]
**Files Scanned**: [N]
**Auditor**: Claude

### Structure Check

| Component | Expected | Found | Status |
|-----------|----------|-------|--------|
| Command files | 8 | [N] | ✅/❌ |
| Templates | 4 | [N] | ✅/❌ |
| Core documents | 9 | [N] | ✅/❌ |

### Version Discrepancies

| File | Registry Version | Actual Version | Action |
|------|------------------|----------------|--------|
| [file.md] | [X] | [Y] | Update registry |

### Missing Required Components

| Component | Status | Action |
|-----------|--------|--------|
| [component] | Missing | Create |

### Quality Issues

| File | Issue | Severity | Fix |
|------|-------|----------|-----|
| [file.md] | [issue] | [sev] | [fix] |

### Portability Status

| Category | Count | Portable |
|----------|-------|----------|
| Universal files | [N] | ✅ |
| Project-specific files | [N] | 🔄 |

### Recommended Actions

1. **FIX**: [files to fix]
2. **UPDATE**: [files to update]
3. **CREATE**: [files to create]

---

**Health Score**: [X/10]
**Next Audit Recommended**: [date]
```

---

## Issue Severity Classification

| Severity | Action | Description |
|----------|--------|-------------|
| **CRITICAL** | Fix immediately | Security vulnerability, data loss risk |
| **HIGH** | Fix before sprint end | Major functionality broken, architectural violation |
| **MEDIUM** | Fix in current/next sprint | Minor bugs, inconsistent patterns |
| **LOW** | Backlog | Code style, minor improvements |

---

## Audit Report Template

```markdown
# Audit Report - [Service/Feature]

**Date**: [Date]
**Auditor**: Claude Code
**Scope**: [Full/Partial/Security/etc.]
**Files Reviewed**: [N]

## Executive Summary
- Critical Issues: [N]
- High Priority: [N]
- Medium Priority: [N]
- Low Priority: [N]
- **Overall Quality Rating**: [X/10]

## Critical Issues (MUST FIX IMMEDIATELY)

### 1. [Issue Title]
- **Severity**: CRITICAL
- **Category**: [Security/Data Loss/etc.]
- **Location**: [file.js:line]
- **Impact**: [Description]
- **Current Code**:
  ```javascript
  [problematic code]
  ```
- **Fix Required**:
  ```javascript
  [corrected code]
  ```

## High Priority Issues
[Same format]

## Medium Priority Issues
[Same format]

## Low Priority Issues
[Brief list]

## Positive Findings
- [What was done well]

## Quality Scorecard

| Category | Score (1-10) | Notes |
|----------|--------------|-------|
| Security | [X] | [Notes] |
| Architecture | [X] | [Notes] |
| Code Quality | [X] | [Notes] |
| Documentation | [X] | [Notes] |
| **Overall** | **[X]** | [Summary] |

## Next Steps
- [ ] Fix critical issues immediately
- [ ] Schedule high priority fixes
- [ ] Create tickets for medium/low issues
```

---

## Post-Audit Actions

### If CRITICAL issues found:
1. **STOP** - Do not proceed with new features
2. Document fix instructions in detail
3. Recommend immediate coding session to fix
4. Update session log with blocker status

### If only High/Medium/Low issues:
1. Document in audit report
2. Prioritize in backlog
3. Continue with planned work

---

## Rate This Session (1-10)

| Rating | Quality Level |
|--------|---------------|
| 10 | Comprehensive, all issues found, actionable recommendations |
| 9 | Thorough, minor issues may have been missed |
| 8 | Adequate coverage (MINIMUM TARGET) |
| 7 | Basic review completed |
| <= 6 | Incomplete or inaccurate |

**My Rating**: [X/10]
**Coverage**: [X]% of scope reviewed

---

## Success Criteria

This audit session is successful when:
- [ ] All files in scope reviewed
- [ ] Issues categorized by severity
- [ ] Audit report created and comprehensive
- [ ] Fix instructions provided for all issues
- [ ] Quality scorecard completed
- [ ] Session rating >= 8/10

---

**NOW BEGIN AUDIT**

Be thorough and critical. The goal is to find issues NOW, not in production.
