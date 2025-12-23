# Sprint Roadmap: Q1-Q2 2025

**Version**: 1.1.0
**Created**: December 22, 2025
**Updated**: December 22, 2025
**Status**: Draft (T4)
**Duration**: 8 weeks (4 sprints x 2 weeks)

---

## Overview

This roadmap covers the first 4 sprints of KARVIA development, taking the project from MVP to an interactive, AI-powered platform integrated with iBrain.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    SPRINT 1     │───▶│    SPRINT 2     │───▶│    SPRINT 3     │───▶│    SPRINT 4     │
│  Stabilization  │    │  Code Quality   │    │ Testing & Docs  │    │ iBrain Integration│
│    (2 weeks)    │    │    (2 weeks)    │    │    (2 weeks)    │    │    (2 weeks)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
        │                      │                      │                      │
        ▼                      ▼                      ▼                      ▼
   Security &            Consolidation &         Documentation &        Interactive
   Critical Fixes        Validation              Deployment Ready       Intelligence
```

---

## Sprint Summary

| Sprint | Theme | Items | New Items | Total Effort |
|--------|-------|-------|-----------|--------------|
| 1 | MVP Stabilization | 5 (B001-B004, B010) | 3 (B031-B033) | ~11 days |
| 2 | Code Quality | 8 (B005-B012, B017, B020) | 4 (B034-B037) | ~12 days |
| 3 | Testing & Docs | 6 (B008, B013-B016, B019) | 5 (B038-B042) | ~14 days |
| 4 | iBrain Integration | 10 (B043-B052) | 0 | ~14 days |
| **Total** | - | **29** | **12** | **~51 days** |

---

## Backlog Evolution

### Original Backlog: 30 items
### New Items Discovered: 12 items
### Total Items: 42 items

### New Items Added

| ID | Type | Description | Sprint |
|----|------|-------------|--------|
| B031 | Cleanup | Clean up 449 console.log statements in server | 1 |
| B032 | Security | Verify helmet security headers configuration | 1 |
| B033 | Quality | Replace console.log with proper logger | 1 |
| B034 | Quality | Add validation to 18 unvalidated routes | 2 |
| B035 | Tech Debt | Consolidate shared LLM config/policy | 2 |
| B036 | Quality | Add request ID to all API responses | 2 |
| B037 | Quality | Standardize error response format | 2 |
| B038 | Testing | Create test fixtures and factories | 3 |
| B039 | Documentation | Create architecture decision records | 3 |
| B040 | DevOps | Add docker-compose for development | 3 |
| B041 | Testing | Add API contract tests | 3 |
| B042 | Quality | Add pre-commit hooks | 3 |

---

## Sprint 1: MVP Stabilization (Weeks 1-2)

**Goal**: Production-ready MVP with security and critical fixes

### Deliverables
- [ ] LLM integration complete (B001)
- [ ] Critical unit tests added (B002)
- [ ] Environment validation (B003)
- [ ] Debug statements removed (B004, B031)
- [ ] Rate limiting on auth (B010)
- [ ] Security headers verified (B032)
- [ ] Proper logging implemented (B033)

### Success Metrics
| Metric | Target |
|--------|--------|
| Unit test files | 10+ |
| Console.log statements | < 50 (from 449) |
| Security headers | All configured |
| Rate limiting | Active on auth |

---

## Sprint 2: Code Quality (Weeks 3-4)

**Goal**: Clean, maintainable codebase with validation

### Deliverables
- [ ] Duplicate files consolidated (B005, B006, B017, B020)
- [ ] Naming standardized (B011, B012)
- [ ] API documentation started (B007)
- [ ] All routes validated (B009, B034)
- [ ] Error responses standardized (B037)
- [ ] Request IDs added (B036)

### Success Metrics
| Metric | Target |
|--------|--------|
| Duplicate files removed | 6+ |
| Routes with validation | 23/23 (100%) |
| Consistent naming | 100% |
| Error format | Standardized |

---

## Sprint 3: Testing & Documentation (Weeks 5-6)

**Goal**: Comprehensive testing and deployment readiness

### Deliverables
- [ ] Integration tests (B008)
- [ ] Scoring tests (B015)
- [ ] JSDoc comments (B014)
- [ ] OpenAPI spec (B019)
- [ ] Docker support (B013, B040)
- [ ] Password reset (B016)
- [ ] Test factories (B038)
- [ ] ADRs documented (B039)
- [ ] Contract tests (B041)
- [ ] Pre-commit hooks (B042)

### Success Metrics
| Metric | Target |
|--------|--------|
| Test coverage | 70%+ |
| Services documented | 33/33 |
| Swagger endpoints | 100% |
| Docker build | Working |

---

## Sprint 4: iBrain Integration (Weeks 7-8)

**Goal**: Transform KARVIA into an interactive, AI-powered platform

### Deliverables
- [ ] iBrain SDK client (B043)
- [ ] User identity registration (B044)
- [ ] Consent management UI (B045)
- [ ] 5 PM Dimension Dashboard (B046)
- [ ] Passion & Engagement display (B047)
- [ ] Assessment pipeline to iBrain (B048)
- [ ] Nudge display system (B049)
- [ ] Webhook handler (B050)
- [ ] Score caching layer (B051)
- [ ] Integration tests (B052)

### Success Metrics
| Metric | Target |
|--------|--------|
| Users with iBrain ID | 100% new users |
| Dimension dashboard views | 3x/week per user |
| Nudge display | Working |
| Webhook processing | <5s response |

### New Backlog Items (Sprint 4)

| ID | Type | Description | Priority |
|----|------|-------------|----------|
| B043 | Integration | Create iBrain SDK client | P0 |
| B044 | Integration | User identity registration with iBrain | P0 |
| B045 | Feature | Consent management UI | P0 |
| B046 | Feature | 5 PM Dimension Dashboard | P0 |
| B047 | Feature | Passion & Engagement display | P1 |
| B048 | Integration | Assessment pipeline to iBrain | P1 |
| B049 | Feature | Nudge display system | P1 |
| B050 | Integration | Webhook handler for iBrain | P1 |
| B051 | Quality | Score caching layer | P2 |
| B052 | Testing | Integration tests for iBrain | P1 |

---

## Post-Sprint 4: Remaining Backlog

### P2 Items (Next Quarter)
| ID | Description |
|----|-------------|
| B018 | Offline support / service worker |

### P3 Items (Backlog)
| ID | Description |
|----|-------------|
| B021 | WebSocket for real-time updates |
| B022 | Redis caching layer |
| B023 | Contribution guidelines |
| B024 | Mobile app (React Native/Flutter) |
| B025 | E2E tests with Playwright |
| B026 | Multi-language support (i18n) |
| B027 | Dark mode theme |
| B028 | GDPR data export |
| B029 | Lazy loading for client scripts |
| B030 | Push notification system |

---

## Dependencies & Blockers

```
Sprint 1                 Sprint 2                 Sprint 3
────────                 ────────                 ────────
B002 (tests) ──────────────────────────────────▶ B008 (integration tests)
                                                        │
B033 (logger) ─────────▶ B036 (request ID)              │
                                │                       ▼
                                └──────────────▶ B041 (contract tests)

B007 (API docs) ───────────────────────────────▶ B019 (OpenAPI)
```

---

## Resource Requirements

| Resource | Sprint 1 | Sprint 2 | Sprint 3 |
|----------|----------|----------|----------|
| Developer | 1 | 1 | 1 |
| Testing | Light | Medium | Heavy |
| Review | Standard | Standard | Heavy |
| Infrastructure | None | None | Docker, Email |

---

## Risk Register

| Risk | Sprints | Likelihood | Impact | Mitigation |
|------|---------|------------|--------|------------|
| LLM integration delays | 1 | Medium | High | Mock fallback ready |
| Breaking changes from consolidation | 2 | Medium | High | Feature flags, thorough testing |
| OpenAPI complexity | 3 | Medium | Medium | Start manual, automate later |
| Email service setup | 3 | Low | Medium | Use ethereal.email for dev |

---

## Exit Criteria for Sprint Roadmap

After completing all 3 sprints, KARVIA should have:

- [ ] **Security**: Rate limiting, helmet, env validation
- [ ] **Quality**: Validated inputs, standardized errors, no duplicates
- [ ] **Testing**: 70%+ coverage, integration tests, contract tests
- [ ] **Documentation**: OpenAPI, JSDoc, ADRs
- [ ] **DevOps**: Docker, pre-commit hooks, proper logging
- [ ] **Features**: Password reset complete

**Ready for**: Growth phase features (B021-B030)

---

## Quick Links

- [Sprint 1 Details](./SPRINT_001.md)
- [Sprint 2 Details](./SPRINT_002.md)
- [Sprint 3 Details](./SPRINT_003.md)
- [Sprint 4 Details](./SPRINT_004.md)
- [Sprint 4 Brainstorm](./SPRINT_004_BRAINSTORM.md)
- [Full Backlog](./INITIAL_BACKLOG.md)
- [MVG Governance](../../1-PRODUCT/strategy/00-constitutional/MVG_KARVIA.md)

### External References
- [iBrain MVP 1.0 Master Plan](file:///Users/sagarrs/Desktop/official_dev/iBrain/IBRAIN_STRATEGY/3-DELIVERY/sprints/MVP_1.0/MVP_1.0_MASTER_PLAN.md)

---

**Session Seal**
- **Created**: December 22, 2025
- **Purpose**: Sprint planning roadmap for Q1 2025
