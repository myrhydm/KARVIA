# Sprint 3: Testing & Documentation

**Version**: 1.0.0
**Sprint Duration**: 2 weeks
**Start Date**: TBD (after Sprint 2)
**Status**: Draft (T4)
**Theme**: Establish comprehensive testing and documentation for long-term maintainability

---

## Sprint Goal

Build robust test coverage for critical services, create OpenAPI documentation, add JSDoc comments throughout the codebase, and prepare for production deployment with Docker.

---

## Sprint Backlog

### From Initial Backlog

| ID | Type | Story | Priority | Estimate | Status |
|----|------|-------|----------|----------|--------|
| B008 | Testing | Add integration tests for journey flow | P1 | 2d | To Do |
| B014 | Documentation | Add JSDoc comments to service files | P2 | 2d | To Do |
| B015 | Testing | Add unit tests for scoring services | P2 | 2d | To Do |
| B019 | Documentation | Create OpenAPI/Swagger documentation | P2 | 2d | To Do |
| B013 | DevOps | Add Dockerfile for containerized deployment | P2 | 1d | To Do |
| B016 | Feature | Implement password reset flow | P2 | 1.5d | To Do |

### Newly Discovered Items

| ID | Type | Story | Priority | Estimate | Status |
|----|------|-------|----------|----------|--------|
| B038 | Testing | Add test fixtures and factories for consistent test data | P1 | 1d | To Do |
| B039 | Documentation | Create architecture decision records (ADRs) | P2 | 1d | To Do |
| B040 | DevOps | Add docker-compose for local development | P2 | 0.5d | To Do |
| B041 | Testing | Add API contract tests | P2 | 1d | To Do |
| B042 | Quality | Add pre-commit hooks (lint, test) | P2 | 0.5d | To Do |

---

## Story Details

### B008: Integration Tests for Journey Flow

**Description**: The user journey is the core feature. Add integration tests covering the complete flow.

**Test Scenarios**:
1. New user onboarding journey
2. Vision questionnaire completion
3. Dream parsing and goal creation
4. Journey stage progression
5. Task completion and progress tracking

**Location**: [qa/automation/](../../qa/automation/)

**Acceptance Criteria**:
- [ ] Test new user journey from registration to first goal
- [ ] Test vision questionnaire submission
- [ ] Test dream parsing with various inputs
- [ ] Test stage transitions
- [ ] All tests run in CI pipeline
- [ ] 80% path coverage for journey module

**Technical Notes**:
- Use supertest for API testing
- Use mongodb-memory-server for isolation
- Create test user factory

---

### B014: JSDoc Comments for Services

**Description**: Add comprehensive JSDoc comments to all 33 service files.

**Priority Order** (by complexity):
1. llmService.js (AI integration)
2. journeyService.js (core logic)
3. comprehensiveScoringEngine.js (complex algorithms)
4. visionAnalysisService.js (analysis logic)
5. All scoring services
6. Remaining services

**JSDoc Template**:
```javascript
/**
 * @module ServiceName
 * @description Brief description of service purpose
 */

/**
 * Function description
 * @param {Type} paramName - Parameter description
 * @returns {Type} Return description
 * @throws {ErrorType} Error description
 * @example
 * const result = await functionName(param);
 */
```

**Acceptance Criteria**:
- [ ] All exported functions have JSDoc
- [ ] Parameters typed and described
- [ ] Return values documented
- [ ] Examples for complex functions
- [ ] Types exported for TypeScript compatibility

---

### B015: Unit Tests for Scoring Services

**Description**: The scoring services are critical for user experience. Add comprehensive unit tests.

**Services to Test**:
- comprehensiveScoringEngine.js
- pmScoringEngine.js
- visionScoringService.js
- scoreCalculator.js
- scoreMapper.js
- DiscoveryStageScorer.js
- OnboardingStageScorer.js
- enhancedVisionScoring.js

**Acceptance Criteria**:
- [ ] Test each scoring function
- [ ] Test edge cases (null inputs, max values)
- [ ] Test score boundaries
- [ ] Test score consistency
- [ ] 90% coverage for scoring modules

---

### B019: OpenAPI/Swagger Documentation

**Description**: Create OpenAPI 3.0 specification for all API endpoints.

**Deliverables**:
1. OpenAPI YAML/JSON spec file
2. Swagger UI integration
3. API documentation page

**Acceptance Criteria**:
- [ ] All 23 route files documented
- [ ] Request/response schemas defined
- [ ] Authentication documented
- [ ] Error responses documented
- [ ] Swagger UI accessible at /api-docs
- [ ] Examples for each endpoint

**Technical Notes**:
- Use swagger-jsdoc to generate from JSDoc
- Use swagger-ui-express to serve
- Version API in spec

---

### B013: Dockerfile for Deployment

**Description**: Create production-ready Dockerfile for containerized deployment.

**Acceptance Criteria**:
- [ ] Multi-stage build (build + runtime)
- [ ] Non-root user for security
- [ ] Health check configured
- [ ] Environment variable handling
- [ ] Optimized layer caching
- [ ] .dockerignore created
- [ ] Image size < 200MB

**Dockerfile Template**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER nodejs
EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:5001/health || exit 1
CMD ["node", "server/index.js"]
```

---

### B016: Password Reset Flow

**Description**: Implement secure password reset via email.

**Flow**:
1. User requests reset with email
2. Generate secure token (expires in 1 hour)
3. Send email with reset link
4. User clicks link, enters new password
5. Token invalidated after use

**Acceptance Criteria**:
- [ ] POST /api/auth/forgot-password endpoint
- [ ] POST /api/auth/reset-password endpoint
- [ ] Secure token generation (crypto)
- [ ] Token expiration (1 hour)
- [ ] Email template created
- [ ] Rate limiting on forgot-password
- [ ] Tests for happy path and edge cases

**Security Requirements**:
- Token must be cryptographically secure
- One-time use only
- Clear error messages (don't reveal if email exists)

---

### B038: Test Fixtures and Factories

**Description**: Create reusable test data factories for consistent testing.

**Factories Needed**:
- UserFactory
- TaskFactory
- GoalFactory
- JourneyFactory
- VisionProfileFactory

**Acceptance Criteria**:
- [ ] Factory for each model
- [ ] Sensible defaults
- [ ] Override capability
- [ ] Sequence generation for unique values
- [ ] Relationship building

**Example**:
```javascript
const UserFactory = {
  build: (overrides = {}) => ({
    email: `user${Date.now()}@test.com`,
    password: 'TestPass123!',
    name: 'Test User',
    ...overrides
  }),
  create: async (overrides = {}) => {
    return await User.create(UserFactory.build(overrides));
  }
};
```

---

### B039: Architecture Decision Records

**Description**: Document key architectural decisions for future maintainers.

**ADRs to Create**:
1. ADR-001: MongoDB as primary database
2. ADR-002: Express.js framework choice
3. ADR-003: JWT for authentication
4. ADR-004: Dual LLM provider support (OpenAI/Ollama)
5. ADR-005: Vanilla JS frontend (vs framework)
6. ADR-006: Monolithic architecture (vs microservices)

**Location**: KARVIA_STRATEGY/2-TECHNICAL/architecture/

**Format**:
```markdown
# ADR-XXX: Title

## Status
Accepted/Deprecated/Superseded

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing?

## Consequences
What becomes easier or more difficult to do because of this change?
```

---

### B040: Docker Compose for Development

**Description**: Create docker-compose.yml for local development with all dependencies.

**Services**:
- app (KARVIA server)
- mongodb (database)
- ollama (optional local LLM)

**Acceptance Criteria**:
- [ ] Single command startup (docker-compose up)
- [ ] Volume mounts for hot reload
- [ ] Environment file support
- [ ] MongoDB data persistence
- [ ] Network configuration

---

### B041: API Contract Tests

**Description**: Add contract tests to ensure API stability.

**Approach**:
- Define API contracts in OpenAPI spec
- Generate tests from spec
- Run in CI to catch breaking changes

**Acceptance Criteria**:
- [ ] Contract tests for all public endpoints
- [ ] Tests verify request/response shapes
- [ ] Breaking changes detected in PR

---

### B042: Pre-commit Hooks

**Description**: Add git pre-commit hooks for code quality.

**Hooks**:
- ESLint check
- Prettier format
- Run affected tests
- Commit message format

**Acceptance Criteria**:
- [ ] husky configured
- [ ] lint-staged for efficiency
- [ ] Clear bypass instructions for emergencies

---

## Sprint Metrics

| Metric | Target |
|--------|--------|
| Story Points | ~14 days effort |
| Test Coverage | 70% overall |
| Services Documented | 33/33 |
| API Endpoints in Swagger | 100% |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenAPI generation complexity | Medium | Medium | Start with manual spec, automate later |
| Email service testing | Medium | Low | Use ethereal.email for testing |
| Docker build issues | Low | Medium | Test on multiple platforms |

---

## Definition of Done

- [ ] All tests passing
- [ ] Test coverage meets targets
- [ ] OpenAPI spec complete
- [ ] Swagger UI accessible
- [ ] JSDoc coverage complete
- [ ] Docker builds successfully
- [ ] Password reset working
- [ ] Pre-commit hooks active

---

## Post-Sprint Recommendations

After Sprint 3, consider:
1. **B025**: E2E tests with Playwright
2. **B023**: Contribution guidelines
3. **B028**: GDPR data export feature
4. **B021**: WebSocket for real-time updates
5. Move to Growth phase features

---

**Session Seal**
- **Created**: December 22, 2025
- **Sprint**: 3 of 3
- **Theme**: Testing & Documentation
