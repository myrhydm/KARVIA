# Document Standards & Governance

**Version**: 1.0.0
**Last Updated**: December 21, 2025
**Status**: AUTHORITATIVE
**Purpose**: Single source of truth for all document creation, maintenance, and governance across the entire SDLC
**Scope**: Universal - applies to ALL products developed using this framework

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Dec 21, 2025 | BRAMHI_LABS_CONSULTANT | Initial comprehensive standards |

---

## Quick Reference Card

```
BEFORE CREATING ANY DOCUMENT:
1. Check this file for document type → Use correct template
2. Determine tier (T1-T4 or Ops) → Apply correct governance
3. Find correct placement → Use MASTER_GUIDE.md
4. Apply Doc ID (if T1-T3) → Check DOC_ID_REGISTRY.md
5. Add required sections → Header, Genome (if strategy), Footer
```

---

## 1. Document Taxonomy

### 1.1 Primary Classification

```
DOCUMENTS
├── STRATEGY DOCUMENTS (Permanent/Evolving)
│   ├── T1: CONSTITUTIONAL - Cannot be overridden
│   ├── T2: CANONICAL - Single source of truth per domain
│   ├── T3: DERIVED - Must align with T1/T2
│   └── T4: WORKING - Drafts, incomplete work
│
├── OPERATIONAL DOCUMENTS (Scoped Lifecycle)
│   ├── Sprint-Scoped (Sprint plans, task lists)
│   ├── Release-Scoped (Release notes, deployment logs)
│   ├── Incident-Scoped (Bug reports, hotfix docs)
│   └── Session-Scoped (Handoffs, audit reports)
│
└── .CLAUDE DOCUMENTS (Framework)
    ├── Commands (Session workflows)
    ├── Templates (Document scaffolding)
    └── Core (Logs, registries, guides)
```

### 1.2 Document Type Matrix

| Type | Tier | Lifecycle | Doc ID | Session Seal | Genome | Archive After |
|------|------|-----------|--------|--------------|--------|---------------|
| MVG/Constitutional | T1 | PERMANENT | Required | On doc | Full | Never |
| Master Strategy | T2 | PERMANENT | Required | On folder | Full | Never |
| Engine/Derived Strategy | T3 | EVOLVING | Required | On folder | Full | When replaced |
| Draft/WIP | T4 | TEMPORARY | Optional | No | Minimal | When finalized |
| Sprint Plan | Ops | SPRINT | No | No | No | +2 sprints |
| Handoff | Ops | SESSION | No | Embedded | No | +30 days |
| Bug Report | Ops | INCIDENT | No | No | No | When closed |
| Release Notes | Ops | RELEASE | No | No | No | +1 year |
| Audit Report | Ops | SESSION | No | No | No | +90 days |

### 1.3 SDLC Phase Document Map

| SDLC Phase | Document Types Created | Location |
|------------|----------------------|----------|
| **Ideation** | Vision docs (T4→T2), User stories | 1-PRODUCT/strategy/, 1-PRODUCT/user-stories/ |
| **Planning** | Sprint plans, Architecture specs | 3-DELIVERY/sprints/, 2-TECHNICAL/architecture/ |
| **Design** | Engine strategies (T3), Data models | 1-PRODUCT/strategy/03-engines/, 2-TECHNICAL/data-models/ |
| **Development** | Implementation docs, Test plans | IBRAIN_IMPLEMENTATION/, 3-TESTING/ |
| **Testing** | Test reports, Bug reports | 3-TESTING/, 3-DELIVERY/bugs/ |
| **Release** | Release notes, Deployment logs | 3-DELIVERY/releases/ |
| **Maintenance** | Hotfix docs, Update logs | 3-DELIVERY/maintenance/ |

---

## 2. Document Tiers (Strategy Documents)

### 2.1 Tier Definitions

| Tier | Code | Write Access | Approval | Modification |
|------|------|--------------|----------|--------------|
| T1 | `T1:CONSTITUTIONAL` | None (Admin only) | Admin | Formal amendment |
| T2 | `T2:CANONICAL` | Strategy, Admin | Strategy | Documented reason |
| T3 | `T3:DERIVED` | Strategy, Coding, Admin | Self | Must align with T2 |
| T4 | `T4:WORKING` | All | Self | Free |

### 2.2 Conflict Resolution

```
When documents conflict:
  T1 > T2 > T3 > T4

Within same tier:
  1. More recently updated wins
  2. Canonical source wins over derived
  3. Consult governing document for explicit decisions
```

### 2.3 Tier-Specific Rules

**T1 (Constitutional)**
- Cannot be modified without formal process
- Always READ:DEEP
- Never archive, only amend
- Example: MVG_MINIMUM_VIABLE_GOVERNANCE.md

**T2 (Canonical)**
- One per domain (Engine, Security, Product, etc.)
- Source of truth for that domain
- All T3 docs must reference their T2 parent
- Example: MASTER_ENGINE_STRATEGY.md

**T3 (Derived)**
- Must explicitly reference parent T2
- Cannot contradict parent
- Can extend but not override
- Example: ENGINE_SCORING_STRATEGY.md

**T4 (Working)**
- Temporary by nature
- No formal governance
- Must be finalized (→T3) or deleted
- Example: DRAFT_NEW_FEATURE.md

---

## 3. Doc ID System

### 3.1 Format

```
DOC-[TIER]-[DOMAIN]-[SEQUENCE]

Example: DOC-T2-ENG-001
```

### 3.2 Domain Codes

| Code | Domain | Examples |
|------|--------|----------|
| GOV | Governance | MVG, access control |
| SEC | Security | Auth, encryption |
| ENG | Engine | All 6 engines |
| API | API/Contracts | OpenAPI specs |
| PRD | Product | Features, roadmap |
| ARC | Architecture | System design |
| VIS | Vision | Future direction |
| RUN | Runtime | Ports, topology |
| TST | Testing | Test frameworks |
| DOC | Documentation | This doc, registries |

### 3.3 Doc ID Scope

| Document Type | Doc ID Required | Reason |
|---------------|-----------------|--------|
| T1 Strategy | Yes | Permanent, critical governance |
| T2 Strategy | Yes | Single source of truth |
| T3 Strategy | Yes | Traceable lineage to T2 |
| T4 Working | Optional | Temporary, may not survive |
| Ops Documents | No | Ephemeral, high volume |
| .claude Commands | No | Framework, not content |

### 3.4 Doc ID Placement

Add Doc ID in document header immediately after Status:

```markdown
# Document Title

**Version**: X.Y.Z
**Last Updated**: [Date]
**Status**: Active
**Doc ID**: DOC-T2-ENG-001  ← Here
**Parent**: [Link]
**Owner**: [Team]
```

---

## 4. Document Genome (Strategy Documents Only)

### 4.1 When to Include

- **Required**: All T1, T2, T3 documents
- **Optional**: T4 documents (minimal genome)
- **Never**: Ops documents, .claude commands

### 4.2 Quick Genome Format

```markdown
> **Quick Genome**: `[CLASS] | [TIER] | [DOMAIN] | [LIFECYCLE] | [FRESHNESS] | R:[X]% | [DIRECTIVE]`
```

Example:
```markdown
> **Quick Genome**: `META:STRATEGIC:AUTHORITATIVE | T2:CANONICAL | ENGINE | ACTIVE | HOT | R:0% | READ:DEEP`
```

### 4.3 Full Genome Block

Place after Document Control, before main content:

```markdown
## Document Genome

> **Quick Genome**: `[one-liner]`

| Dimension | Value | Notes |
|-----------|-------|-------|
| **Class** | `[CLASS]` | Document classification |
| **Topic Domain** | `[DOMAIN]` | Primary bounded context |
| **Authority** | `[TIER]` | Tier in hierarchy |
| **Canonical Source** | `SELF` or `→ [doc.md]` | Parent if derived |
| **Lifecycle** | `[STATE]` | Current state |
| **Freshness** | `[LEVEL] ([N]d)` | Days since update |
| **Redundancy** | `[X]%` | Overlap with other docs |
| **Claude Directive** | `[DIRECTIVE]` | How Claude should process |
```

### 4.4 Genome Values Reference

**Class Options:**
- `META:STRATEGIC:CONSTITUTIONAL` - Supreme authority
- `META:STRATEGIC:AUTHORITATIVE` - Domain truth
- `META:STRATEGIC:MASTER` - Navigation/index
- `META:TACTICAL:ARCHITECTURE` - System design
- `META:TACTICAL:SPECIFICATION` - Detailed specs
- `META:OPERATIONAL:PROCEDURAL` - How-to guides
- `META:OPERATIONAL:TRACKING` - Logs, changelogs
- `META:OPERATIONAL:HANDOFF` - Session transfers

**Lifecycle States:**
- `ACTIVE` 🟢 - Current, valid
- `UPDATE_NEEDED` 🟡 - Valid but stale
- `DEPRECATED` 🟠 - Being replaced
- `REDUNDANT` 🔴 - Duplicates another
- `ARCHIVED` ⚫ - Historical only

**Freshness Levels:**
- `HOT` 🔥 - 0-7 days
- `WARM` ☀️ - 8-30 days
- `COOL` 🌤️ - 31-90 days
- `COLD` ❄️ - 91-180 days
- `FROZEN` 🧊 - 180+ days

**Claude Directives:**
- `READ:DEEP` - Essential, read fully
- `READ:SKIM` - Scan for relevant sections
- `READ:IF_RELEVANT` - Only if topic matches
- `SKIP:REDUNDANT` - Skip if read canonical
- `VERIFY:STALE` - Cross-check freshness

---

## 5. Session Seal

### 5.1 Purpose

Session Seals provide continuity verification between Claude sessions. They answer: "Has anything changed since my last context?"

### 5.2 Session Seal Scope

| Location | Session Seal | Reason |
|----------|--------------|--------|
| T1 Documents | On document | Critical, rarely changes |
| Folder READMEs (IBRAIN_STRATEGY/*) | On README | Tracks folder changes |
| Handoff Documents | Embedded | Session context |
| .claude/README.md | On document | Entry point |
| Individual T2/T3 docs | On folder README | Avoid noise |
| Ops Documents | Never | Ephemeral |

### 5.3 Session Seal Format

```markdown
## Session Seal

| Field | Value |
|-------|-------|
| **Counter** | `[CODE][YYYYMMDDHHMMSS][NNNN]` |
| **Last Close** | [YYYY-MM-DD HH:MM] |
| **Summary** | [1-line description] |

### Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| [Date] | [Change] | [Low/Medium/High] |

### Milestones

| Phase | Date | Achievement |
|-------|------|-------------|
| [Phase] | [Date] | [Milestone] |
```

### 5.4 Counter Encoding

| Folder | Code | Example |
|--------|------|---------|
| IBRAIN_STRATEGY (root) | `STR` | `STR202512211200000001` |
| 1-PRODUCT | `PROD` | `PROD202512211200000001` |
| 2-TECHNICAL | `TECH` | `TECH202512211200000001` |
| 3-DELIVERY | `DEL` | `DEL202512211200000001` |
| 03-engines | `ENG` | `ENG202512211200000001` |

---

## 6. Templates

### 6.1 Template Inventory

| Template | Use For | Location |
|----------|---------|----------|
| STRATEGY_FULL_TEMPLATE.md | T1, T2 canonical docs | .claude/templates/ |
| STRATEGY_DERIVED_TEMPLATE.md | T3 derived docs | .claude/templates/ |
| WORKING_DOC_TEMPLATE.md | T4 drafts, WIP | .claude/templates/ |
| README_TEMPLATE.md | Folder READMEs | .claude/templates/ |
| OPERATIONAL_TEMPLATE.md | Sprint plans, releases, bugs | .claude/templates/ |
| COMMAND_TEMPLATE.md | .claude/commands/ files | .claude/templates/ |

### 6.2 Template Selection Guide

```
Creating a new document?

Is it a Strategy document?
├── Yes → Is it T1 or T2?
│         ├── Yes → STRATEGY_FULL_TEMPLATE.md
│         └── No → Is it T3?
│                  ├── Yes → STRATEGY_DERIVED_TEMPLATE.md (use GENOME_TEMPLATE.md for genome)
│                  └── No (T4) → WORKING_DOC_TEMPLATE.md
└── No → Is it Operational?
         ├── Yes → OPERATIONAL_TEMPLATE.md
         └── No → Is it a Folder README?
                  ├── Yes → README_TEMPLATE.md
                  └── No → Is it a .claude command?
                           ├── Yes → COMMAND_TEMPLATE.md
                           └── No → Check MASTER_GUIDE.md for location
```

---

## 7. Required Sections

### 7.1 Strategy Documents (T1-T3)

**Header (All)**:
```markdown
# [Title]

**Version**: X.Y.Z
**Last Updated**: [Date]
**Status**: [Draft/Active/Deprecated]
**Doc ID**: DOC-TX-XXX-NNN  ← Required for T1-T3
**Parent**: [Link]
**Owner**: [Team/Role]

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
```

**Genome (T1-T3)**: See Section 4.3

**Footer (All)**:
```markdown
---

## Related Documents

- [Link 1](path)
- [Link 2](path)

---

**Document Status**: [Description]
```

### 7.2 Operational Documents

**Minimal Header**:
```markdown
# [Title]

**Date**: [Date]
**Type**: [Sprint/Release/Bug/Handoff]
**Status**: [Open/Closed/Active]

---
```

**No Genome required. No Doc ID required.**

### 7.3 .claude Commands

**Command Header**:
```markdown
# [Command Name]

**Version**: X.Y.Z
**Last Updated**: [Date]
**Status**: Active
**Purpose**: [Brief description]

---
```

---

## 8. Archive Strategy

### 8.1 Retention Rules

| Document Type | Retention | Archive Location |
|---------------|-----------|------------------|
| T1 Constitutional | Forever | Never archive |
| T2 Canonical | Forever | Never archive (amend) |
| T3 Derived | Until replaced | 3-DELIVERY/archive/strategy/ |
| T4 Working | Until finalized | Delete or promote |
| Sprint Plans | +2 sprints | 3-DELIVERY/archive/sprints/ |
| Release Notes | +1 year | 3-DELIVERY/archive/releases/ |
| Handoffs | +30 days | 3-DELIVERY/archive/handoffs/ |
| Bug Reports | When closed +30d | 3-DELIVERY/archive/bugs/ |
| Audit Reports | +90 days | 3-DELIVERY/archive/audits/ |

### 8.2 Archive Process

1. Move file to appropriate archive subfolder
2. Update source registry (remove entry)
3. Update parent README (remove link)
4. Do NOT update archived file's genome (preserve state)

### 8.3 Archive Folder Structure

```
IBRAIN_STRATEGY/3-DELIVERY/archive/
├── README.md           # Archive index
├── strategy/           # Archived T3 docs
├── sprints/            # Past sprint plans
├── releases/           # Old release notes
├── handoffs/           # Past session handoffs
├── bugs/               # Closed bug reports
└── audits/             # Historical audit reports
```

---

## 9. Automation Distribution

### 9.1 /init Responsibilities

| Task | When | Output |
|------|------|--------|
| Load latest handoff | Always | Context restoration |
| Check Session Seals | Always | Staleness report |
| Report stale docs | If any COLD/FROZEN | Warning list |
| Load tier-appropriate context | Always | Context budget management |

### 9.2 /close Responsibilities

| Task | When | Output |
|------|------|--------|
| Update CHANGE_LOG.md | Always | Session entry |
| Update SESSION_LOG.md | Always | Session row |
| Update folder Session Seals | If IBRAIN_STRATEGY/* changed | Counter, summary |
| Create handoff document | Always | 3-DELIVERY/handoffs/[date].md |
| Update DOCUMENT_REGISTRY | If new docs created | Registry entry |
| Verify file placement | Always | Compliance check |
| Update doc Freshness | For modified docs | HOT timestamp |

### 9.3 /audit Responsibilities

| Task | When | Output |
|------|------|--------|
| Recalculate all Freshness | Always | Updated genome |
| Check Redundancy scores | Always | Overlap analysis |
| Identify archive candidates | Always | Archive recommendations |
| Sync Doc IDs | Always | ID assignment/verification |
| Generate health report | Always | Health metrics |
| Verify genome accuracy | For strategy docs | Corrections |
| Check lifecycle states | For all docs | State updates |

---

## 10. Creation Guidelines

### 10.1 Before Creating a Document

```
CHECKLIST:
[ ] Checked if similar doc already exists (avoid redundancy)
[ ] Determined correct tier (T1/T2/T3/T4/Ops)
[ ] Found correct location (MASTER_GUIDE.md)
[ ] Selected correct template
[ ] Have Doc ID ready (if T1-T3)
```

### 10.2 During Creation

```
CHECKLIST:
[ ] Using correct template
[ ] Header complete with all required fields
[ ] Doc ID added (if T1-T3)
[ ] Genome section added (if T1-T3)
[ ] Parent document linked
[ ] Related documents section at bottom
[ ] Author follows BRAMHI_LABS convention
```

### 10.3 After Creation

```
CHECKLIST:
[ ] Added to appropriate registry
[ ] Updated parent README with link
[ ] Cross-references updated
[ ] File placement verified
```

---

## 11. Editing Guidelines

### 11.1 Before Editing

```
CHECKLIST:
[ ] Confirmed access level (check ACCESS_CONTROL.yaml)
[ ] Understand tier restrictions
[ ] For T2: Have documented reason
[ ] For T1: DO NOT EDIT (escalate to admin)
```

### 11.2 During Editing

```
CHECKLIST:
[ ] Update Version number (semantic versioning)
[ ] Update Last Updated date
[ ] Add entry to Document Control table
[ ] If genome exists, update Freshness to HOT
[ ] Maintain Doc ID (never change)
```

### 11.3 After Editing

```
CHECKLIST:
[ ] Update registry if version changed significantly
[ ] /close will update Session Seals
[ ] Notify if breaking change to T2 doc
```

---

## 12. Author Naming Convention

All documents use BRAMHI_LABS role-based author names:

| Role | Author Name | Use For |
|------|-------------|---------|
| Product Manager | `BRAMHI_LABS_ARIA_PM` | Product, strategy, user journeys |
| Architect | `BRAMHI_LABS_SYNTH_ARCH` | Architecture, technical design |
| Developer | `BRAMHI_LABS_CODEX_DEV` | Implementation, SDK, code docs |
| QA | `BRAMHI_LABS_VALIDAR_QA` | Testing, quality docs |
| Consultant | `BRAMHI_LABS_CONSULTANT` | Session mgmt, guides, handoffs |

---

## 13. Related Documents

- [MASTER_GUIDE.md](./MASTER_GUIDE.md) - File placement rules
- [ACCESS_CONTROL.yaml](./ACCESS_CONTROL.yaml) - Access control configuration
- [DOCUMENT_REGISTRY.md](./DOCUMENT_REGISTRY.md) - .claude docs registry
- [GENOME_TEMPLATE.md](./templates/GENOME_TEMPLATE.md) - Genome block template
- [README_TEMPLATE.md](./templates/README_TEMPLATE.md) - Folder README template
- [DOC_ID_REGISTRY.md](../IBRAIN_STRATEGY/1-PRODUCT/strategy/05-governance/DOC_ID_REGISTRY.md) - Strategy Doc IDs
- [DOCUMENT_GENOME_SPECIFICATION.md](../IBRAIN_STRATEGY/1-PRODUCT/strategy/05-governance/DOCUMENT_GENOME_SPECIFICATION.md) - Full genome spec

---

## 14. Quick Reference Tables

### 14.1 Template Selection

| I'm creating... | Use Template |
|-----------------|--------------|
| Constitutional/Governance doc | STRATEGY_FULL_TEMPLATE.md |
| Master strategy doc (T2) | STRATEGY_FULL_TEMPLATE.md |
| Engine/derived strategy (T3) | STRATEGY_DERIVED_TEMPLATE.md |
| Draft/WIP document | WORKING_DOC_TEMPLATE.md |
| Sprint plan | OPERATIONAL_TEMPLATE.md |
| Release notes | OPERATIONAL_TEMPLATE.md |
| Bug report | OPERATIONAL_TEMPLATE.md |
| Handoff document | /close creates automatically |
| Folder README | README_TEMPLATE.md |
| .claude command | COMMAND_TEMPLATE.md |

### 14.2 Governance at a Glance

| Tier | Doc ID | Genome | Session Seal | Archive |
|------|--------|--------|--------------|---------|
| T1 | ✅ Required | ✅ Full | ✅ On doc | Never |
| T2 | ✅ Required | ✅ Full | ✅ On folder | Never |
| T3 | ✅ Required | ✅ Full | ✅ On folder | When replaced |
| T4 | ❓ Optional | ❓ Minimal | ❌ No | Delete/promote |
| Ops | ❌ No | ❌ No | ❌ No | Per retention |

### 14.3 Session Command Responsibilities

| Aspect | /init | /close | /audit |
|--------|-------|--------|--------|
| Freshness | Read | Update | Recalculate all |
| Lifecycle | Read | — | Update |
| Redundancy | — | — | Calculate |
| Session Seal | Verify | Update | — |
| Doc ID | — | — | Sync/assign |
| Archive | — | — | Recommend |
| Handoff | Read | Create | — |

---

**Document Status**: AUTHORITATIVE. This is the single source of truth for all document governance. All other governance fragments should defer to this document.
