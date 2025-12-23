# Coding Session Initialization

**Version**: 2.0.0
**Last Updated**: December 21, 2025
**Session Type**: CODING
**Access Profile**: CODING (from ACCESS_CONTROL.yaml)
**Token Budget**: 80-120K (40-60%)
**Purpose**: Feature implementation, bug fixes, production code

---

## TIERED CONTEXT LOADING

### Step 1: ALWAYS Load (Constitutional)

```
READ:SKIM → IBRAIN_STRATEGY/1-PRODUCT/strategy/00-constitutional/
           └── MVG_MINIMUM_VIABLE_GOVERNANCE.md (T1 - Supreme Authority)
```

**Why**: Understand governance rules before modifying code.

### Step 2: Load Based on Work Type

**Select your work type** (then load the corresponding documents):

#### Type A: Engine Development
```
READ:DEEP  → 02-master/MASTER_ENGINE_STRATEGY.md
READ:DEEP  → 03-engines/ENGINE_[NAME]_STRATEGY.md
READ:SKIM  → 01-authoritative/RUNTIME_ORCHESTRATION.md
READ:REF   → engines/[engine-name]/ (codebase)
SKIP       → 04-vision/
```

#### Type B: Service Development
```
READ:DEEP  → 02-master/MASTER_TECHNICAL_ARCHITECTURE.md
READ:SKIM  → 01-authoritative/API_CONTRACTS_SPECIFICATION.md
READ:REF   → services/[service-name]/ (codebase)
READ:REF   → contracts/openapi/[service].yaml
SKIP       → 03-engines/, 04-vision/
```

#### Type C: API Development
```
READ:DEEP  → 01-authoritative/API_CONTRACTS_SPECIFICATION.md
READ:DEEP  → 01-authoritative/SECURITY_FRAMEWORK.md
READ:REF   → contracts/openapi/
READ:REF   → services/gateway/ (codebase)
SKIP       → 03-engines/, 04-vision/
```

#### Type D: SDK Development
```
READ:DEEP  → 01-authoritative/API_CONTRACTS_SPECIFICATION.md
READ:SKIM  → External_App_Integration/
READ:REF   → packages/sdk-js/ or packages/sdk-python/
READ:REF   → contracts/openapi/
SKIP       → 03-engines/, 04-vision/
```

#### Type E: Bug Fix
```
READ:SKIM  → Relevant strategy doc for affected area
READ:REF   → Affected files (codebase)
READ:REF   → Related tests
SKIP       → 04-vision/, 05-governance/
```

#### Type F: Infrastructure/Tooling
```
READ:SKIM  → 01-authoritative/RUNTIME_ORCHESTRATION.md
READ:REF   → docker-compose.yml, package.json
READ:REF   → scripts/, config files
SKIP       → 03-engines/, 04-vision/
```

---

## CONTEXT LOADING MATRIX

| Work Type | 00-const | 01-auth | 02-master | 03-engines | Code Ref |
|-----------|----------|---------|-----------|------------|----------|
| Engine Dev | SKIM | IF_RELEVANT | DEEP | DEEP | engines/ |
| Service Dev | SKIM | SKIM | DEEP | SKIP | services/ |
| API Dev | SKIM | DEEP | SKIM | SKIP | contracts/ |
| SDK Dev | SKIM | DEEP | SKIP | SKIP | packages/ |
| Bug Fix | SKIM | IF_RELEVANT | IF_RELEVANT | IF_RELEVANT | affected/ |
| Infrastructure | SKIM | SKIM | SKIP | SKIP | config/ |

**Legend**: DEEP = Full read | SKIM = Headers + key sections | IF_RELEVANT = Only if applicable | SKIP = Don't load

---

## ACCESS CONTROL PROFILE: CODING

From `.claude/ACCESS_CONTROL.yaml`:

```yaml
CODING:
  can_read: ["DOC-T1-*", "DOC-T2-*", "DOC-T3-*", "DOC-T4-*"]
  can_write: ["DOC-T3-*", "DOC-T4-*"]
  cannot_write: ["DOC-T1-*", "DOC-T2-*", "DOC-*-SEC-*", "DOC-*-GOV-*"]
```

**Restrictions**:
- Cannot modify T1 (Constitutional) documents
- Cannot modify T2 (Canonical) documents
- Cannot modify Security domain documents
- Cannot modify Governance domain documents
- Can modify T3 (Derived) and T4 (Working) docs

**Note**: If you need to update T2 docs, switch to `/strategy` session.

---

## ENGINE REFERENCE

| Engine | Port | Tech | Strategy Doc |
|--------|------|------|--------------|
| Scoring | 8080 | Go | `03-engines/ENGINE_SCORING_STRATEGY.md` |
| Tracking | 8081 | Node.js | `03-engines/ENGINE_TRACKING_STRATEGY.md` |
| Observer | 8082 | Node.js | `03-engines/ENGINE_OBSERVER_STRATEGY.md` |
| IAM | 8083 | Node.js | `03-engines/ENGINE_IAM_STRATEGY.md` |
| Assessment | 8084 | Node.js | `03-engines/ENGINE_ASSESSMENT_STRATEGY.md` |
| Planner | server/ | Node.js | `03-engines/ENGINE_PLANNER_STRATEGY.md` |

---

## SERVICE REFERENCE

| Service | Port | Code Location | OpenAPI |
|---------|------|---------------|---------|
| Gateway | 3000 | `services/gateway/` | `contracts/openapi/gateway.yaml` |
| Intelligence | 8080 | `services/intelligence/` | `contracts/openapi/intelligence.yaml` |
| Analytics | 8081 | `services/analytics/` | `contracts/openapi/analytics.yaml` |
| Auth | 8082 | `services/auth/` | `contracts/openapi/auth.yaml` |

---

## WHAT ARE YOU IMPLEMENTING?

**Work Type**: [ ] Engine | [ ] Service | [ ] API | [ ] SDK | [ ] Bug Fix | [ ] Infrastructure

**Feature/Task**: [Name]
**Priority**: [P0/P1/P2]
**Phase**: [Phase 4 - Developer Experience]

**Scope** (Check all that apply):
- [ ] Backend (models, routes, services, middleware)
- [ ] SDK Development (JavaScript, Python)
- [ ] API endpoints (new routes)
- [ ] Bug fixes (specify: [issue])
- [ ] Infrastructure (Docker, tooling)

**Files to Create**:
1. [file1.js] - [purpose]

**Files to Modify**:
1. [file1.js] - [changes needed]

---

## CODING QUALITY GATES

### Security Gate
```
[ ] Input Validation - All user input validated
[ ] Authentication - Protected routes use authenticateToken
[ ] Authorization - Role-based access with requireRole()
[ ] Multi-Tenant - Queries filter by business context
[ ] No Hardcoded Secrets - Use environment variables
[ ] Rate Limiting - Sensitive endpoints protected
```

### Architecture Gate
```
[ ] RESTful Conventions - Proper HTTP verbs
[ ] Error Handling - try/catch blocks, meaningful messages
[ ] Service Pattern - Business logic in services, not routes
[ ] Consistent Responses - { success: boolean, data/error }
[ ] Cross-Service Communication - Proper proxy patterns
[ ] Mock Fallbacks - Graceful degradation
```

### Documentation Gate
```
[ ] Code Comments - Complex logic explained
[ ] Session Log - Updated with progress
[ ] API Docs - New endpoints documented
[ ] OpenAPI - Specs updated if applicable
```

### Testing Gate
```
[ ] Manual Testing - Feature tested locally
[ ] Critical Paths - Core functionality validated
[ ] Error Scenarios - Error handling tested
[ ] Integration - Cross-service communication verified
```

---

## IMPLEMENTATION PROCESS

### 1. Backend / Service Changes

```
Step 1: Models
[ ] Create/update Mongoose models
[ ] Add validation rules
[ ] Create indexes for queries

Step 2: Services
[ ] Create service layer for business logic
[ ] Implement core functionality
[ ] Add error handling

Step 3: Routes
[ ] Create RESTful endpoints
[ ] Add authentication middleware
[ ] Add authorization middleware
[ ] Validate input with Joi/schemas

Step 4: Gateway Integration
[ ] Add proxy routes if cross-service
[ ] Update service discovery
[ ] Test end-to-end flow
```

### 2. Engine Development

```
Step 1: Read Strategy Doc
[ ] Load ENGINE_[NAME]_STRATEGY.md
[ ] Understand engine responsibilities
[ ] Review integration patterns

Step 2: Implementation
[ ] Follow existing patterns in engine folder
[ ] Implement required endpoints
[ ] Add error handling

Step 3: Integration
[ ] Connect to services
[ ] Test inter-engine communication
[ ] Verify mock fallbacks
```

### 3. SDK Development

```
Step 1: Project Structure
[ ] Initialize npm/pip project
[ ] Set up TypeScript/type hints
[ ] Configure build system

Step 2: Core Implementation
[ ] Authentication handling
[ ] API client wrapper
[ ] Method implementations

Step 3: Documentation
[ ] JSDoc/docstrings
[ ] README with examples
[ ] Type definitions
```

---

## TOKEN CHECKPOINTS

- At 60K (30%): Quick progress check
- At 90K (45%): Evaluate if task will fit in session
- At 120K (60%): **PREPARE SESSION HANDOFF**
- At 150K (75%): Plan to wrap up current file
- At 180K (90%): Begin session closure

---

## POST-IMPLEMENTATION CHECKLIST

### 1. Quality Verification
```
[ ] All security gates passed
[ ] All architecture gates passed
[ ] Code follows existing patterns
[ ] No console.log() or debug code left
```

### 2. Documentation Updates
```
[ ] Update SESSION_LOG.md
[ ] Create handoff via /close if >60% tokens
[ ] Update relevant documentation
```

### 3. Testing
```
[ ] Feature works as expected
[ ] Error handling works
[ ] Cross-service integration verified
```

---

## RATE THIS SESSION (1-10)

| Rating | Quality Level |
|--------|---------------|
| 10 | Exceptional - Production-ready, all gates passed |
| 9 | Excellent - Minor improvements possible |
| 8 | Good - Meets standards (MINIMUM TARGET) |
| 7 | Acceptable - Functional but needs improvement |
| <= 6 | Below Standard - Requires rework |

**My Rating**: [X/10]
**Reason**: [Why this rating]

---

## SUCCESS CRITERIA

This coding session is successful when:
- [ ] Context loaded per work type matrix
- [ ] Feature/task fully implemented
- [ ] All quality gates passed (100%)
- [ ] Access control profile respected (no T1/T2 doc modifications)
- [ ] Session log updated
- [ ] Session rating >= 8/10

---

**NOW BEGIN CODING**

1. Confirm your work type (A-F)
2. Load the appropriate context
3. Implement with quality gates in mind
4. Test thoroughly
5. Prepare for /close when done
