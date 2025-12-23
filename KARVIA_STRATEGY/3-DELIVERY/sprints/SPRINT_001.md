# Sprint 1: MVP Stabilization

**Version**: 1.0.0
**Sprint Duration**: 2 weeks
**Start Date**: TBD
**Status**: Draft (T4)
**Theme**: Stabilize core functionality and address critical issues

---

## Sprint Goal

Ensure the MVP is production-ready by completing LLM integration, adding critical security measures, cleaning up debug code, and establishing baseline test coverage.

---

## Sprint Backlog

### From Initial Backlog

| ID | Type | Story | Priority | Estimate | Status |
|----|------|-------|----------|----------|--------|
| B001 | Tech Debt | Complete LLM integration for manifest endpoint | P0 | 2d | To Do |
| B002 | Testing | Add unit tests for critical paths (auth, tasks, goals) | P0 | 3d | To Do |
| B003 | Security | Add environment validation on startup | P0 | 0.5d | To Do |
| B004 | Cleanup | Remove DEBUG console.log statements from client | P1 | 1d | To Do |
| B010 | Security | Implement rate limiting on auth endpoints | P1 | 1d | To Do |

### Newly Discovered Items

| ID | Type | Story | Priority | Estimate | Status |
|----|------|-------|----------|----------|--------|
| B031 | Cleanup | Clean up 449 console.log statements in server code | P1 | 2d | To Do |
| B032 | Security | Add helmet security headers (already in deps, verify usage) | P1 | 0.5d | To Do |
| B033 | Quality | Replace console.log with proper winston/pino logger | P2 | 1d | To Do |

---

## Story Details

### B001: Complete LLM Integration for Manifest

**Description**: The manifest endpoint currently returns mock data. Integrate with the LLM service for real AI-generated content.

**Location**: [server/routes/manifest.js](../../server/routes/manifest.js)

**Acceptance Criteria**:
- [ ] Manifest endpoint calls llmService
- [ ] Fallback to mock data if LLM unavailable
- [ ] Add error handling for LLM failures
- [ ] Add request validation

**Technical Notes**:
- Use existing llmService.js pattern
- Consider caching manifest responses

---

### B002: Add Unit Tests for Critical Paths

**Description**: Current test coverage is minimal (3 files). Add tests for authentication, tasks, and goals - the core user flows.

**Location**: [server/api/*.test.js](../../server/api/)

**Acceptance Criteria**:
- [ ] Auth routes: register, login, user fetch (min 5 tests)
- [ ] Task routes: CRUD operations (min 6 tests)
- [ ] Goal routes: CRUD operations (min 6 tests)
- [ ] All tests pass in CI

**Technical Notes**:
- Use Jest + supertest (already in deps)
- Use mongodb-memory-server for isolated tests

---

### B003: Environment Validation on Startup

**Description**: Add validation that all required environment variables are present before server starts.

**Location**: [server/index.js](../../server/index.js)

**Acceptance Criteria**:
- [ ] Check for MONGO_URI, JWT_SECRET at minimum
- [ ] Validate OPENAI_API_KEY when LLM_PROVIDER=openai
- [ ] Clear error messages for missing vars
- [ ] Exit gracefully with code 1 on failure

---

### B004: Remove DEBUG Console Statements from Client

**Description**: journey_progress.js has 17+ DEBUG console.log statements that should be removed for production.

**Location**: [client/pages/scripts/journey_progress.js](../../client/pages/scripts/journey_progress.js)

**Acceptance Criteria**:
- [ ] Remove all `console.log('🔍 DEBUG:` statements
- [ ] Keep error logging (console.error) as appropriate
- [ ] Test journey progress page still works

---

### B010: Rate Limiting on Auth Endpoints

**Description**: Protect auth endpoints from brute force attacks with rate limiting.

**Location**: [server/routes/auth.js](../../server/routes/auth.js)

**Acceptance Criteria**:
- [ ] Add rate limiting middleware to /login
- [ ] Add rate limiting middleware to /register
- [ ] Max 5 login attempts per 15 minutes per IP
- [ ] Max 3 registrations per hour per IP
- [ ] Return 429 with clear message when limited

**Technical Notes**:
- express-rate-limit already in package.json
- Configure separate limiters for login vs register

---

### B031: Clean Up Server Console Logging

**Description**: 449 console.log/error/warn statements across 49 server files need cleanup.

**Acceptance Criteria**:
- [ ] Remove non-essential console.log statements
- [ ] Keep error logging but route through logger
- [ ] Prioritize: routes > services > utils
- [ ] No console.log in production code paths

---

### B032: Verify Helmet Security Headers

**Description**: Helmet is in dependencies but verify it's properly configured.

**Location**: [server/index.js](../../server/index.js)

**Acceptance Criteria**:
- [ ] Helmet middleware is applied
- [ ] CSP headers configured appropriately
- [ ] HSTS enabled for production
- [ ] X-Frame-Options set

---

### B033: Implement Proper Logging

**Description**: Replace ad-hoc console.log with structured logging using existing winston/pino dependency.

**Location**: [server/utils/logger.js](../../server/utils/logger.js)

**Acceptance Criteria**:
- [ ] Configure logger with appropriate levels
- [ ] Different log levels for dev vs production
- [ ] Request logging middleware
- [ ] Error logging with stack traces

---

## Sprint Metrics

| Metric | Target |
|--------|--------|
| Story Points | ~11 days effort |
| Test Coverage Increase | +15% minimum |
| Bug Count | 0 P0 bugs at sprint end |
| Code Review | 100% of PRs reviewed |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM integration complexity | Medium | High | Start early, have mock fallback |
| Test writing takes longer | Medium | Medium | Focus on critical paths first |
| Breaking changes | Low | High | Test in staging before deploy |

---

## Definition of Done

- [ ] All code reviewed and approved
- [ ] Unit tests passing
- [ ] No console errors in browser
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Deployed to staging
- [ ] QA sign-off

---

## Dependencies

- MongoDB test database available
- OpenAI API key for LLM testing
- Staging environment configured

---

**Session Seal**
- **Created**: December 22, 2025
- **Sprint**: 1 of 3
- **Theme**: MVP Stabilization
