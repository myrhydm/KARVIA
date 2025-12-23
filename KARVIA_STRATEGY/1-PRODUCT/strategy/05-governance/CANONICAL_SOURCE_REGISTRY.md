# Canonical Source Registry

**Version**: 1.0.0
**Last Updated**: December 22, 2025
**Doc ID**: DOC-T2-GOV-001
**Status**: Canonical (T2)

---

## Document Genome

> **Quick Genome**: `META:GOVERNANCE:REGISTRY | T2:CANONICAL | GOVERNANCE | ACTIVE | WARM | R:0% | READ:SCAN`

---

## Purpose

This registry defines the single source of truth for each domain in the KARVIA project. When information conflicts between documents, the canonical source for that domain takes precedence.

---

## Domain Registry

### Core Domains

| Domain | Canonical Source | Location | Owner |
|--------|------------------|----------|-------|
| **GOVERNANCE** | MVG_KARVIA.md | KARVIA_STRATEGY/1-PRODUCT/strategy/00-constitutional/ | Product Owner |
| **ARCHITECTURE** | CODEBASE_STRUCTURE.md | .claude/ | Technical Lead |
| **API** | server/routes/*.js | server/routes/ | Technical Lead |
| **DATA_MODELS** | server/models/*.js | server/models/ | Technical Lead |

### Feature Domains

| Domain | Canonical Source | Location | Owner |
|--------|------------------|----------|-------|
| **JOURNEY** | journeyCore.js + Journey.js | server/routes/ + server/models/ | Technical Lead |
| **GOALS** | goals.js + WeeklyGoal.js | server/routes/ + server/models/ | Technical Lead |
| **TASKS** | tasks.js + Task.js | server/routes/ + server/models/ | Technical Lead |
| **VISION** | vision.js + VisionProfile.js | server/routes/ + server/models/ | Technical Lead |
| **DREAMS** | dreams.js + UserDream.js | server/routes/ + server/models/ | Technical Lead |
| **AI/LLM** | llmService.js | server/services/ | Technical Lead |
| **AUTH** | auth.js + User.js | server/routes/ + server/models/ | Technical Lead |

### Process Domains

| Domain | Canonical Source | Location | Owner |
|--------|------------------|----------|-------|
| **BACKLOG** | INITIAL_BACKLOG.md | KARVIA_STRATEGY/3-DELIVERY/sprints/ | Product Owner |
| **DEPLOYMENT** | render.yaml | Project root | Technical Lead |
| **CI/CD** | .github/workflows/*.yml | .github/workflows/ | Technical Lead |
| **TESTING** | Jest config in package.json | Project root | Technical Lead |

---

## Derived Document Rules

### Documents That Must Align

| Document | Aligns With | Check Frequency |
|----------|-------------|-----------------|
| README.md | CODEBASE_STRUCTURE.md | Per sprint |
| API documentation | server/routes/*.js | Per change |
| Test specs | server/models/*.js | Per change |

### Conflict Resolution

1. Check this registry for canonical source
2. Canonical source always wins
3. Update derived documents to match
4. Log conflicts in audit report

---

## Domain Ownership

### Technical Lead Responsibilities
- All code-based canonical sources
- Architecture decisions
- API specifications
- Deployment configuration

### Product Owner Responsibilities
- Governance documents
- Backlog prioritization
- Phase definitions
- Value decisions

---

## Related Documents

- [MVG_KARVIA.md](../00-constitutional/MVG_KARVIA.md) - Constitutional governance
- [DOCUMENT_REGISTRY.md](./DOCUMENT_REGISTRY.md) - All project documents
- [CODEBASE_STRUCTURE.md](../../../../.claude/CODEBASE_STRUCTURE.md) - Technical architecture

---

**Session Seal**
- **Generated**: December 22, 2025
- **Command**: /bootstrap
- **Purpose**: Establish canonical sources for all domains
