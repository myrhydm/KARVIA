# Testing Session Initialization

**Version**: 2.0.0
**Last Updated**: December 21, 2025
**Session Type**: TESTING
**Access Profile**: TESTING (from ACCESS_CONTROL.yaml)
**Token Budget**: 40-60K (20-30%)
**Purpose**: Test execution, bug detection, validation

---

## TIERED CONTEXT LOADING

### Step 1: ALWAYS Load (Constitutional)

```
READ:SKIM → IBRAIN_STRATEGY/1-PRODUCT/strategy/00-constitutional/
           └── MVG_MINIMUM_VIABLE_GOVERNANCE.md (T1 - Light skim for context)
```

**Why**: Understand governance rules that may affect testing requirements.

### Step 2: Load Based on Test Type

**Select your test type** (then load the corresponding documents):

#### Type A: Service/Integration Testing
```
READ:SKIM  → 02-master/MASTER_TECHNICAL_ARCHITECTURE.md
READ:SKIM  → 01-authoritative/API_CONTRACTS_SPECIFICATION.md
READ:REF   → contracts/openapi/ (for endpoint validation)
READ:REF   → services/[service]/ (codebase)
SKIP       → 04-vision/, 05-governance/
```

#### Type B: Engine Testing
```
READ:SKIM  → 02-master/MASTER_ENGINE_STRATEGY.md
READ:SKIM  → 03-engines/ENGINE_[NAME]_STRATEGY.md
READ:REF   → engines/[engine-name]/ (codebase)
SKIP       → 04-vision/, 05-governance/
```

#### Type C: Security Testing
```
READ:DEEP  → 01-authoritative/SECURITY_FRAMEWORK.md
READ:SKIM  → 01-authoritative/API_CONTRACTS_SPECIFICATION.md
READ:REF   → services/auth/ (codebase)
SKIP       → 03-engines/, 04-vision/
```

#### Type D: API Testing
```
READ:DEEP  → 01-authoritative/API_CONTRACTS_SPECIFICATION.md
READ:REF   → contracts/openapi/
READ:REF   → services/gateway/
SKIP       → 03-engines/, 04-vision/
```

---

## CONTEXT LOADING MATRIX

| Test Type | 00-const | 01-auth | 02-master | 03-engines | Code Ref |
|-----------|----------|---------|-----------|------------|----------|
| Service/Integration | SKIM | SKIM | SKIM | SKIP | services/ |
| Engine | SKIM | SKIP | SKIM | SKIM | engines/ |
| Security | SKIM | DEEP | SKIP | SKIP | auth/ |
| API | SKIM | DEEP | SKIP | SKIP | contracts/ |

**Legend**: DEEP = Full read | SKIM = Headers + key sections | SKIP = Don't load

---

## ACCESS CONTROL PROFILE: TESTING

From `.claude/ACCESS_CONTROL.yaml`:

```yaml
TESTING:
  can_read: ["DOC-*"]
  can_write: ["DOC-T3-TST-*", "DOC-T4-*"]
```

**Restrictions**:
- Can read ALL documents
- Can write T3 Testing domain documents
- Can write T4 (Working) documents
- Primary purpose is test execution and bug documentation

**Note**: Bug fixes should be addressed in a `/coding` session.

---

## Testing Scope

**What are you testing?** (Select scope):

- [ ] **Unit Tests** - Individual functions/modules
- [ ] **Integration Tests** - Service interactions
- [ ] **E2E Tests** - Full user flows
- [ ] **API Tests** - Endpoint validation
- [ ] **Regression Tests** - Existing functionality
- [ ] **Security Tests** - Vulnerability checks

**Services/Features to Test**:
1. [service/feature 1]
2. [service/feature 2]
3. [service/feature 3]

---

## Testing Checklist

### 1. API Endpoint Tests

```
For each endpoint:
[ ] Happy path (valid request)
[ ] Invalid input (400 errors)
[ ] Missing authentication (401)
[ ] Insufficient permissions (403)
[ ] Resource not found (404)
[ ] Server error handling (500)
[ ] Rate limiting (429)
```

### 2. Authentication Tests

```
[ ] Valid JWT accepted
[ ] Invalid JWT rejected
[ ] Expired token rejected
[ ] Missing token rejected
[ ] Role-based access enforced
[ ] Token refresh works
```

### 3. Business Logic Tests

```
[ ] Core functionality works
[ ] Edge cases handled
[ ] Boundary conditions
[ ] Error scenarios
[ ] Data validation
[ ] Calculations correct
```

### 4. Integration Tests

```
[ ] Gateway to services
[ ] Service to database
[ ] Service to engines
[ ] Cross-service communication
[ ] Mock fallbacks work
```

### 5. Multi-Tenant Tests

```
[ ] Data isolation verified
[ ] Cannot access other tenants' data
[ ] Business context enforced
[ ] No data leakage
```

---

## Test Execution Template

### Test Plan
```markdown
## Test Plan: [Feature/Service]

### Scope
- Services: [List]
- Endpoints: [List]
- Scenarios: [Count]

### Prerequisites
- [ ] Services running
- [ ] Test data available
- [ ] Environment configured

### Test Cases

| ID | Scenario | Expected | Actual | Status |
|----|----------|----------|--------|--------|
| T1 | [Description] | [Expected] | [Actual] | PASS/FAIL |
| T2 | [Description] | [Expected] | [Actual] | PASS/FAIL |
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/[filename].test.js

# Run with coverage
npm test -- --coverage

# Run integration tests
npm run test:integration
```

---

## Bug Report Template

```markdown
## Bug: [Title]

**Severity**: Critical/High/Medium/Low
**Service**: [Service name]
**Endpoint**: [If applicable]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots/Logs
[If applicable]

### Environment
- Node version: [X]
- Service version: [X]
- OS: [X]

### Files Involved
- [file:line]

### Suggested Fix
[If known]
```

---

## iBrain-Specific Test Scenarios

### Gateway Tests
```
[ ] Service discovery works
[ ] Proxy routing correct
[ ] Auth forwarding
[ ] Rate limiting
[ ] Health checks
```

### Intelligence Service Tests
```
[ ] Archetype calculation
[ ] Personality analysis
[ ] Motivation scoring
[ ] Data aggregation
```

### Analytics Service Tests
```
[ ] Progress tracking
[ ] Behavioral trends
[ ] User insights
[ ] Data visualization
```

### Auth Service Tests
```
[ ] User registration
[ ] Login flow
[ ] JWT generation
[ ] Profile management
[ ] Role assignment
```

### Engine Integration Tests
```
[ ] Assessment Engine responses
[ ] Observer Engine rules
[ ] Planner Engine plans
[ ] Mock fallbacks
```

---

## Test Results Summary

```markdown
## Test Results - [Date]

### Summary
- Total Tests: [N]
- Passed: [N] ([X]%)
- Failed: [N]
- Skipped: [N]

### Failed Tests
| Test ID | Scenario | Issue | Severity |
|---------|----------|-------|----------|
| T1 | [Scenario] | [Issue] | [Severity] |

### Bugs Found
1. BUG-001: [Title] - [Severity]
2. BUG-002: [Title] - [Severity]

### Coverage
- Statements: [X]%
- Branches: [X]%
- Functions: [X]%
- Lines: [X]%

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
```

---

## Rate This Session (1-10)

| Rating | Quality Level |
|--------|---------------|
| 10 | Comprehensive coverage, all bugs found |
| 9 | Thorough, minor gaps |
| 8 | Good coverage (MINIMUM TARGET) |
| 7 | Adequate but incomplete |
| <= 6 | Insufficient testing |

**My Rating**: [X/10]
**Test Coverage**: [X]%
**Bugs Found**: [N]

---

## Success Criteria

This testing session is successful when:
- [ ] All planned test cases executed
- [ ] Pass/fail results documented
- [ ] Bugs have reproduction steps
- [ ] Test report created
- [ ] Coverage targets met
- [ ] Session rating >= 8/10

---

**NOW BEGIN TESTING**

Be thorough. Find bugs before they reach production.
