# Sprint 2: Code Quality & Consolidation

**Version**: 1.0.0
**Sprint Duration**: 2 weeks
**Start Date**: TBD (after Sprint 1)
**Status**: Draft (T4)
**Theme**: Reduce technical debt and improve code maintainability

---

## Sprint Goal

Consolidate duplicate code, standardize naming conventions, add input validation across all routes, and begin API documentation.

---

## Sprint Backlog

### From Initial Backlog

| ID | Type | Story | Priority | Estimate | Status |
|----|------|-------|----------|----------|--------|
| B005 | Tech Debt | Consolidate journey route files (journeyCore.js, journeySimple.js) | P1 | 1d | To Do |
| B006 | Tech Debt | Consolidate dream parser files (dreamParser.js, dreamParserSimple.js) | P1 | 1d | To Do |
| B007 | Documentation | Document API endpoints with request/response schemas | P1 | 2d | To Do |
| B009 | Quality | Add input validation to all API routes | P1 | 2d | To Do |
| B011 | Tech Debt | Standardize service naming conventions | P2 | 1d | To Do |
| B012 | Tech Debt | Fix typo: comprhensiveAnalysis.js → comprehensiveAnalysis.js | P2 | 0.5d | To Do |
| B017 | Tech Debt | Consolidate tracking clients (tracking-client.js, trackingClient.js) | P2 | 0.5d | To Do |
| B020 | Tech Debt | Remove duplicate journey HTML files | P2 | 0.5d | To Do |

### Newly Discovered Items

| ID | Type | Story | Priority | Estimate | Status |
|----|------|-------|----------|----------|--------|
| B034 | Quality | Add validation to 18 routes missing it (only 5 have validation) | P1 | 2d | To Do |
| B035 | Tech Debt | Consolidate shared LLM config/policy into single module | P2 | 0.5d | To Do |
| B036 | Quality | Add request ID to all API responses for debugging | P2 | 0.5d | To Do |
| B037 | Quality | Standardize error response format across all routes | P2 | 1d | To Do |

---

## Story Details

### B005: Consolidate Journey Routes

**Description**: Two journey route files exist (journeyCore.js, journeySimple.js). Merge into single authoritative file.

**Location**: [server/routes/](../../server/routes/)

**Analysis Needed**:
- Compare endpoints in both files
- Identify which is primary vs deprecated
- Check for conflicting implementations

**Acceptance Criteria**:
- [ ] Single journey route file
- [ ] All existing functionality preserved
- [ ] Old file removed or deprecated
- [ ] Index.js updated to use consolidated file
- [ ] No breaking changes to API

---

### B006: Consolidate Dream Parser Routes

**Description**: Two dream parser files exist (dreamParser.js, dreamParserSimple.js). Merge into single file.

**Location**: [server/routes/](../../server/routes/)

**Acceptance Criteria**:
- [ ] Single dream parser route file
- [ ] All parsing functionality preserved
- [ ] Service layer cleaned up if needed
- [ ] Index.js updated

---

### B007: API Endpoint Documentation

**Description**: Create inline documentation for all API endpoints including request/response schemas.

**Location**: All files in [server/routes/](../../server/routes/)

**Acceptance Criteria**:
- [ ] Each route has JSDoc comment block
- [ ] Request parameters documented
- [ ] Response schema documented
- [ ] Error responses documented
- [ ] Authentication requirements noted

**Example Format**:
```javascript
/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 * @body {email: string, password: string}
 * @returns {token: string, user: UserObject}
 * @error 400 - Invalid credentials
 * @error 429 - Rate limited
 */
```

---

### B009 & B034: Complete Input Validation

**Description**: Only 5 of 23 route files have input validation. Add validation to remaining 18.

**Current Coverage**:
- ✅ auth.js
- ✅ tasks.js
- ✅ goals.js
- ✅ dreamParser.js
- ✅ dreams.js
- ❌ 18 others need validation

**Acceptance Criteria**:
- [ ] All POST/PUT routes have body validation
- [ ] All routes with params have param validation
- [ ] Consistent error messages for validation failures
- [ ] Use Joi or express-validator consistently

**Priority Order**:
1. vision.js (user data)
2. pmAssessment.js (assessment data)
3. journeyCore.js (journey updates)
4. llm.js (AI requests)
5. users.js (user management)
6. Remaining routes

---

### B011: Standardize Service Naming

**Description**: Services use mixed conventions - some camelCase, some PascalCase. Standardize to one pattern.

**Current State**:
- PascalCase: DataFlowOptimizer, DiscoveryStageScorer, OnboardingStageScorer, ScoringConsentService
- camelCase: adaptationEngine, dreamParser, emailService, etc.

**Decision**: Use camelCase for all services (Node.js convention)

**Acceptance Criteria**:
- [ ] Rename PascalCase files to camelCase
- [ ] Update all imports
- [ ] Verify no broken references
- [ ] Update CODEBASE_STRUCTURE.md

---

### B012: Fix Filename Typo

**Description**: comprhensiveAnalysis.js has a typo (missing 'e').

**Location**: [server/services/comprhensiveAnalysis.js](../../server/services/comprhensiveAnalysis.js)

**Acceptance Criteria**:
- [ ] Rename to comprehensiveAnalysis.js
- [ ] Update all imports
- [ ] Verify functionality

---

### B017: Consolidate Tracking Clients

**Description**: Two tracking client files with similar names (tracking-client.js, trackingClient.js).

**Location**: [client/pages/scripts/](../../client/pages/scripts/)

**Acceptance Criteria**:
- [ ] Analyze both files for overlap
- [ ] Merge into single file
- [ ] Update HTML imports
- [ ] Test tracking functionality

---

### B020: Remove Duplicate Journey HTML Files

**Description**: Multiple journey-related HTML files may have overlap:
- journey.html
- journey-progress.html
- journey_progress.html
- journey_progress_minimal.html
- my_journey.html

**Acceptance Criteria**:
- [ ] Identify primary journey page
- [ ] Document purpose of each
- [ ] Remove or consolidate redundant files
- [ ] Update navigation links

---

### B035: Consolidate Shared LLM Configuration

**Description**: LLM config is spread across server/shared/config and server/shared/policy.

**Location**: [server/shared/](../../server/shared/)

**Acceptance Criteria**:
- [ ] Single configuration source
- [ ] Policy clearly separated from config
- [ ] Well-documented exports

---

### B036: Add Request IDs

**Description**: Add unique request ID to all API responses for debugging and log correlation.

**Acceptance Criteria**:
- [ ] Generate UUID for each request
- [ ] Include in response headers (X-Request-ID)
- [ ] Include in error responses
- [ ] Log with each request

---

### B037: Standardize Error Responses

**Description**: Error responses should have consistent format across all routes.

**Proposed Format**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  },
  "requestId": "uuid"
}
```

**Acceptance Criteria**:
- [ ] Error response helper function created
- [ ] All routes use standard format
- [ ] Error codes documented

---

## Sprint Metrics

| Metric | Target |
|--------|--------|
| Story Points | ~12 days effort |
| Files Removed/Consolidated | 6+ |
| Routes with Validation | 23/23 (100%) |
| API Endpoints Documented | 100% |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality | Medium | High | Thorough testing, feature flags |
| Import path changes cause issues | Medium | Medium | Global search/replace, test all |
| Consolidation loses features | Low | High | Document all features first |

---

## Definition of Done

- [ ] All code reviewed
- [ ] No duplicate route files
- [ ] Consistent naming conventions
- [ ] All routes have validation
- [ ] API documentation complete
- [ ] All tests passing
- [ ] No regression bugs

---

**Session Seal**
- **Created**: December 22, 2025
- **Sprint**: 2 of 3
- **Theme**: Code Quality & Consolidation
