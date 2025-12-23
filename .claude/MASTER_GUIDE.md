# iBrain Master Guide - File Placement Rules

**Version**: 1.1.0
**Last Updated**: December 8, 2025
**Status**: MANDATORY
**Purpose**: Define where every new .md file MUST be saved

---

## CRITICAL: File Placement Rules

**NEVER create files in:**
- Root folder (`/`)
- Random folders
- `IBRAIN_STRATEGY/` root (use subfolders)
- `IBRAIN_IMPLEMENTATION/` root (use subfolders)

---

## Directory Structure & File Placement

### 1. Session Management (`.claude/`)

```
.claude/
├── README.md              # Claude guide (exists)
├── MASTER_GUIDE.md        # THIS FILE - file placement rules
├── BEST_PRACTICES.md      # Quality standards (exists)
├── SESSION_LOG.md         # Session tracking (exists)
├── CHANGE_LOG.md          # Change tracking (exists)
├── CODEBASE_STRUCTURE.md  # Code map (exists)
├── DATA_STRUCTURE.md      # Docs map (exists)
├── commands/              # Slash commands
│   └── *.md               # Command files
└── sessions/              # Session archives
    └── *.md               # Break notes
```

**Save here if**: Session management, Claude-specific guides, slash commands

---

### 2. Strategy Documents (`IBRAIN_STRATEGY/1-PRODUCT/strategy/`)

```
IBRAIN_STRATEGY/1-PRODUCT/strategy/
├── MASTER_PRODUCT_STRATEGY.md         # Product vision & roadmap
├── MASTER_TECHNICAL_ARCHITECTURE.md   # System architecture
├── MASTER_ENGINE_STRATEGY.md          # 6-engine overview
├── ENGINE_SCORING_STRATEGY.md         # Scoring engine
├── ENGINE_TRACKING_STRATEGY.md        # Tracking engine
├── ENGINE_OBSERVER_STRATEGY.md        # Observer engine
├── ENGINE_IAM_STRATEGY.md             # IAM engine
├── ENGINE_ASSESSMENT_STRATEGY.md      # Assessment engine
├── ENGINE_PLANNER_STRATEGY.md         # Planner engine
├── DOCUMENT_REGISTRY.md               # Document tracking
└── [NEW_STRATEGY_*.md]                # Future strategy docs
```

**Save here if**: Strategy documents, master plans, engine strategies, product roadmaps

---

### 3. Product Documentation (`IBRAIN_STRATEGY/1-PRODUCT/`)

```
IBRAIN_STRATEGY/1-PRODUCT/
├── README.md              # Product folder overview
├── strategy/              # Strategy docs (see above)
├── user-journeys/         # User persona journeys
│   ├── DEVELOPER_JOURNEY.md
│   ├── ADMIN_JOURNEY.md
│   └── USER_JOURNEY.md
└── user-stories/          # Product requirements
    └── USER_STORIES_MASTER.md
```

**Save here if**: User journeys, user stories, product requirements

---

### 4. Technical Documentation (`IBRAIN_STRATEGY/2-TECHNICAL/`)

```
IBRAIN_STRATEGY/2-TECHNICAL/
├── README.md              # Technical folder overview
├── architecture/          # System architecture
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── MICROSERVICES.md
│   └── ENGINE_INTEGRATION.md
├── api-specs/             # API specifications
│   ├── GATEWAY_API.md
│   ├── INTELLIGENCE_API.md
│   ├── ANALYTICS_API.md
│   └── AUTH_API.md
└── data-models/           # Database schemas
    ├── USER_MODELS.md
    ├── ASSESSMENT_MODELS.md
    └── ANALYTICS_MODELS.md
```

**Save here if**: Architecture docs, API specs, data models, technical design

---

### 5. Delivery Documentation (`IBRAIN_STRATEGY/3-DELIVERY/`)

```
IBRAIN_STRATEGY/3-DELIVERY/
├── README.md              # Delivery folder overview
├── sprints/               # Sprint plans
│   ├── CURRENT_SPRINT.md
│   └── SPRINT_HISTORY.md
├── releases/              # Release documentation
│   ├── RELEASE_NOTES.md
│   └── DEPLOYMENT_LOG.md
└── handoffs/              # Session handoffs
    └── [DATE]_handoff.md
```

**Save here if**: Sprint plans, releases, deployment docs, handoffs

---

### 6. Implementation Documentation (`IBRAIN_IMPLEMENTATION/`)

```
IBRAIN_IMPLEMENTATION/
├── 00_MASTER_INDEX.md     # Implementation entry point
├── 1-SERVICES/            # Service implementation docs
│   ├── README.md
│   ├── gateway/
│   ├── intelligence/
│   ├── analytics/
│   └── auth/
├── 2-ENGINES/             # Engine implementation docs
│   ├── README.md
│   ├── scoring/
│   ├── tracking/
│   ├── observer/
│   ├── iam/
│   ├── assessment/
│   └── planner/
├── 3-TESTING/             # Testing docs
│   ├── README.md
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── 4-SDK/                 # SDK docs
    ├── README.md
    ├── javascript/
    └── python/
```

**Save here if**: Implementation details, service docs, testing guides, SDK docs

---

### 7. External Developer Docs (`External_App_Integration/`)

```
External_App_Integration/
├── README.md                  # Integration overview
├── 01_WHAT_IS_IBRAIN.md       # Platform intro
├── 02_QUICK_START.md          # Quick start guide
├── 03_REGISTRATION.md         # App registration
├── 04_API_REFERENCE.md        # API reference
├── 05_SERVICES_OVERVIEW.md    # Services overview
├── 06_INTEGRATION_EXAMPLES.md # Code examples
├── 07_WEBHOOKS.md             # Webhook guide
├── 08_AUTHENTICATION.md       # Auth guide
├── 09_SDK_LIBRARIES.md        # SDK guide
└── 10_TROUBLESHOOTING.md      # Troubleshooting
```

**Save here if**: External developer documentation, API guides, integration examples

---

### 8. Legacy/Archive (`legacy/`)

```
legacy/
├── README.md              # Archive overview
├── migration/             # Historical migration docs
│   ├── MIGRATION_AUDIT_REPORT.md
│   ├── MIGRATION_PLAN_FROM_GOALTRACKER_TEST.md
│   └── [other migration docs]
└── detailed_design/       # Early design documents
    ├── design/
    ├── architecture/
    └── implementation/
```

**Save here if**: Historical documents, deprecated content, migration archives

---

### 9. DEPRECATED: `/docs/` Folder

**DO NOT** add new files to `/docs/`. This folder is being phased out.

All documents have been migrated to:
- Architecture → `IBRAIN_STRATEGY/2-TECHNICAL/architecture/`
- API specs → `IBRAIN_STRATEGY/2-TECHNICAL/api-specs/`
- Data models → `IBRAIN_STRATEGY/2-TECHNICAL/data-models/`
- Testing → `IBRAIN_IMPLEMENTATION/3-TESTING/`
- Integration → `External_App_Integration/`
- Legacy → `legacy/`

---

## Quick Reference: Where to Save New Files

| Document Type | Save Location |
|--------------|---------------|
| Strategy docs | `IBRAIN_STRATEGY/1-PRODUCT/strategy/` |
| Engine strategy | `IBRAIN_STRATEGY/1-PRODUCT/strategy/ENGINE_*.md` |
| User journeys | `IBRAIN_STRATEGY/1-PRODUCT/user-journeys/` |
| User stories | `IBRAIN_STRATEGY/1-PRODUCT/user-stories/` |
| Architecture | `IBRAIN_STRATEGY/2-TECHNICAL/architecture/` |
| API specs | `IBRAIN_STRATEGY/2-TECHNICAL/api-specs/` |
| Data models | `IBRAIN_STRATEGY/2-TECHNICAL/data-models/` |
| Sprint plans | `IBRAIN_STRATEGY/3-DELIVERY/sprints/` |
| Release notes | `IBRAIN_STRATEGY/3-DELIVERY/releases/` |
| Session handoffs | `IBRAIN_STRATEGY/3-DELIVERY/handoffs/` |
| Service impl docs | `IBRAIN_IMPLEMENTATION/1-SERVICES/{service}/` |
| Engine impl docs | `IBRAIN_IMPLEMENTATION/2-ENGINES/{engine}/` |
| Testing docs | `IBRAIN_IMPLEMENTATION/3-TESTING/` |
| SDK docs | `IBRAIN_IMPLEMENTATION/4-SDK/` |
| External dev docs | `External_App_Integration/` |
| Claude guides | `.claude/` |
| Slash commands | `.claude/commands/` |
| Legacy/Archive | `legacy/` |

---

## Naming Conventions

### File Names

| Type | Convention | Example |
|------|------------|---------|
| Master docs | `MASTER_*.md` | `MASTER_PRODUCT_STRATEGY.md` |
| Engine docs | `ENGINE_*_STRATEGY.md` | `ENGINE_SCORING_STRATEGY.md` |
| API specs | `*_API.md` | `GATEWAY_API.md` |
| User journeys | `*_JOURNEY.md` | `DEVELOPER_JOURNEY.md` |
| Sprint plans | `SPRINT_*.md` | `SPRINT_3_PLAN.md` |
| Handoffs | `[DATE]_handoff.md` | `2025-12-05_handoff.md` |

### Folder Names

- Use lowercase with hyphens: `user-journeys/`
- Or UPPERCASE for category folders: `1-SERVICES/`
- Engine/service names: lowercase: `scoring/`, `gateway/`

### Author Naming Convention (BRAMHI_LABS)

All documents must use BRAMHI_LABS role-based author names in the Document Control table.

| Role | Author Name | Use For |
|------|-------------|---------|
| Product Manager | `BRAMHI_LABS_ARIA_PM` | Product docs, user journeys, user stories, strategy |
| Architect | `BRAMHI_LABS_SYNTH_ARCH` | Architecture docs, technical design, system design |
| Developer | `BRAMHI_LABS_CODEX_DEV` | Implementation docs, code docs, SDK docs |
| QA | `BRAMHI_LABS_VALIDAR_QA` | Testing docs, test plans, quality docs |
| Consultant | `BRAMHI_LABS_CONSULTANT` | Session management, guides, handoffs |

**Document Type to Author Mapping:**

| Document Location | Default Author |
|------------------|----------------|
| `IBRAIN_STRATEGY/1-PRODUCT/` | `BRAMHI_LABS_ARIA_PM` |
| `IBRAIN_STRATEGY/2-TECHNICAL/` | `BRAMHI_LABS_SYNTH_ARCH` |
| `IBRAIN_STRATEGY/3-DELIVERY/` | `BRAMHI_LABS_ARIA_PM` |
| `IBRAIN_IMPLEMENTATION/` | `BRAMHI_LABS_CODEX_DEV` |
| `IBRAIN_IMPLEMENTATION/3-TESTING/` | `BRAMHI_LABS_VALIDAR_QA` |
| `.claude/` | `BRAMHI_LABS_CONSULTANT` |
| `External_App_Integration/` | `BRAMHI_LABS_CODEX_DEV` |

---

## Required Document Sections

Every new `.md` file MUST include:

```markdown
# [Document Title]

**Version**: X.Y.Z
**Last Updated**: [Date]
**Status**: [Draft/Active/Deprecated]
**Parent**: [Link to parent doc]
**Owner**: [Team/Person]

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Date | Name | Initial version |

---

[Content]

---

## Related Documents

- [Link 1](path)
- [Link 2](path)

---

**Document Status**: [Description]
```

---

## After Creating a New Document

1. **Add to DOCUMENT_REGISTRY.md**: `IBRAIN_STRATEGY/1-PRODUCT/strategy/DOCUMENT_REGISTRY.md`
2. **Update parent README.md**: Add link to new document
3. **Update CHANGE_LOG.md**: `.claude/CHANGE_LOG.md`
4. **Update cross-references**: Link from related documents

---

## Prohibited Actions

- **DO NOT** create `.md` files in root folder
- **DO NOT** create files in `IBRAIN_STRATEGY/` root
- **DO NOT** create files in `IBRAIN_IMPLEMENTATION/` root
- **DO NOT** create random folders
- **DO NOT** skip the document header template
- **DO NOT** forget to update DOCUMENT_REGISTRY

---

**Document Status**: Mandatory file placement guide. All contributors must follow these rules.
