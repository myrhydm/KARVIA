# Operational Document Template

**Use For**: Sprint plans, release notes, bug reports, incident reports, test reports

---

## Templates by Type

### A. Sprint Plan Template

```markdown
# Sprint [N] Plan

**Sprint**: [Sprint Name/Number]
**Duration**: [Start Date] - [End Date]
**Status**: [Planning/Active/Complete]

---

## Sprint Goal

[One sentence sprint goal]

---

## Committed Work

| ID | Task | Owner | Points | Status |
|----|------|-------|--------|--------|
| [ID] | [Task description] | [Owner] | [N] | [TODO/WIP/Done] |

---

## Capacity

| Team Member | Available Days | Committed Points |
|-------------|----------------|------------------|
| [Name] | [N] | [N] |

**Total Capacity**: [N] points
**Committed**: [N] points
**Buffer**: [N] points

---

## Dependencies

| Dependency | Owner | Status | Risk |
|------------|-------|--------|------|
| [Dep] | [Owner] | [Status] | [Low/Med/High] |

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk] | [L/M/H] | [L/M/H] | [Plan] |

---

## Daily Standup Notes

### [Date]
- **Done**:
- **Today**:
- **Blockers**:

---

## Sprint Retrospective

**What went well**:
-

**What could improve**:
-

**Action items**:
-

---

**Sprint Status**: [Planning/Active/Complete]
```

---

### B. Release Notes Template

```markdown
# Release Notes - v[X.Y.Z]

**Release Date**: [DATE]
**Type**: [Major/Minor/Patch/Hotfix]
**Status**: [Planned/Released/Rolled Back]

---

## Summary

[1-2 sentence summary of this release]

---

## New Features

- **[Feature 1]**: [Description]
- **[Feature 2]**: [Description]

---

## Improvements

- [Improvement 1]
- [Improvement 2]

---

## Bug Fixes

- **[BUG-XXX]**: [Description of fix]
- **[BUG-XXX]**: [Description of fix]

---

## Breaking Changes

> **Warning**: The following changes may require action

- [Breaking change 1]
- [Breaking change 2]

---

## Migration Guide

[If applicable, steps to migrate from previous version]

---

## Known Issues

- [Known issue 1]
- [Known issue 2]

---

## Deployment Notes

- [ ] [Pre-deployment step]
- [ ] [Deployment step]
- [ ] [Post-deployment verification]

---

**Release Status**: [Planned/Released/Rolled Back]
```

---

### C. Bug Report Template

```markdown
# Bug Report - [BUG-XXX]

**Reported**: [DATE]
**Reporter**: [Name]
**Status**: [Open/In Progress/Resolved/Closed]
**Priority**: [P0/P1/P2/P3]
**Severity**: [Critical/High/Medium/Low]

---

## Summary

[One sentence bug description]

---

## Environment

- **Service**: [Service name]
- **Version**: [Version]
- **Environment**: [Dev/Staging/Prod]
- **Browser/Client**: [If applicable]

---

## Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

---

## Expected Behavior

[What should happen]

---

## Actual Behavior

[What actually happens]

---

## Evidence

- **Logs**: [Link or paste]
- **Screenshots**: [Link or paste]
- **Error Messages**: [Exact error]

---

## Root Cause Analysis

[Once identified]

---

## Fix

**PR/Commit**: [Link]
**Description**: [What was changed]

---

## Verification

- [ ] Fix verified in dev
- [ ] Fix verified in staging
- [ ] Fix deployed to prod
- [ ] Monitoring confirmed

---

**Bug Status**: [Open/In Progress/Resolved/Closed]
```

---

### D. Test Report Template

```markdown
# Test Report - [Test Suite/Feature]

**Date**: [DATE]
**Tester**: [Name]
**Environment**: [Dev/Staging/Prod]
**Status**: [Pass/Fail/Partial]

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | [N] |
| Passed | [N] |
| Failed | [N] |
| Skipped | [N] |
| Pass Rate | [X]% |

---

## Test Scope

[What was tested]

---

## Test Results

### Passed Tests

- [Test 1]
- [Test 2]

### Failed Tests

| Test | Expected | Actual | Notes |
|------|----------|--------|-------|
| [Test] | [Expected] | [Actual] | [Notes] |

### Skipped Tests

| Test | Reason |
|------|--------|
| [Test] | [Reason] |

---

## Issues Found

| Issue | Severity | Bug ID |
|-------|----------|--------|
| [Issue] | [Sev] | [BUG-XXX] |

---

## Recommendations

- [Recommendation 1]
- [Recommendation 2]

---

**Test Status**: [Pass/Fail/Partial]
```

---

## Operational Document Rules

### No Governance Overhead

Operational documents:
- Do NOT require Doc IDs
- Do NOT require Document Genomes
- Do NOT have Session Seals
- Have minimal header requirements
- Are scoped to their lifecycle

### Archive Rules

| Type | Archive After | Location |
|------|---------------|----------|
| Sprint Plan | +2 sprints | 3-DELIVERY/archive/sprints/ |
| Release Notes | +1 year | 3-DELIVERY/archive/releases/ |
| Bug Report | Closed +30 days | 3-DELIVERY/archive/bugs/ |
| Test Report | +90 days | 3-DELIVERY/archive/tests/ |

### Naming Convention

- Sprint: `SPRINT_[N]_PLAN.md`
- Release: `RELEASE_[VERSION].md`
- Bug: `BUG_[XXX]_[TITLE].md`
- Test: `TEST_REPORT_[DATE]_[SCOPE].md`

---

**Template Version**: 1.0.0
**Last Updated**: December 21, 2025
