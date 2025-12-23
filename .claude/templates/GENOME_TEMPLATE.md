# Document Genome Template

Use this template to add a Document Genome section to strategy documents.

---

## Where to Add

Add the Document Genome section **after the Document Control table** and **before the main content**.

---

## Full Genome Block

```markdown
## Document Genome

> **Quick Genome**: `[CLASS] | [TIER] | [DOMAIN] | [LIFECYCLE] | [FRESHNESS] | R:[X]% | [DIRECTIVE]`

| Dimension | Value | Notes |
|-----------|-------|-------|
| **Class** | `[CLASS]` | [explanation] |
| **Topic Domain** | `[DOMAIN]` | Primary bounded context |
| **Authority** | `[TIER]` | Tier in hierarchy |
| **Canonical Source** | `SELF` or `→ [doc.md]` | Parent if derived |
| **Lifecycle** | `[STATE]` | Current state |
| **Freshness** | `[LEVEL] ([N]d)` | Days since update |
| **Redundancy** | `[X]%` | Overlap with other docs |
| **Claude Directive** | `[DIRECTIVE]` | How Claude should process |

### Overlap Analysis

| Overlaps With | Score | Relationship |
|---------------|-------|--------------|
| [doc.md] | [X]% | [Derived/Complementary/Reference] |

### Claude Reading Path

| If Task Involves | Read | Skip |
|------------------|------|------|
| [topic] | [docs] | [docs] |
```

---

## Quick Reference Values

### Class Options

| Code | Description |
|------|-------------|
| `META:STRATEGIC:CONSTITUTIONAL` | Supreme authority |
| `META:STRATEGIC:AUTHORITATIVE` | Domain truth |
| `META:STRATEGIC:VISIONARY` | Future direction |
| `META:STRATEGIC:MASTER` | Navigation/index |
| `META:TACTICAL:ARCHITECTURE` | System design |
| `META:TACTICAL:SPECIFICATION` | Detailed specs |
| `META:OPERATIONAL:PROCEDURAL` | How-to guides |
| `META:OPERATIONAL:TRACKING` | Logs, changelogs |
| `META:OPERATIONAL:HANDOFF` | Session transfers |

### Tier Options

| Code | Description |
|------|-------------|
| `T1:CONSTITUTIONAL` | Supreme, cannot be overridden |
| `T2:CANONICAL` | Single source of truth |
| `T3:DERIVED` | Derived from T1/T2 |
| `T4:WORKING` | Drafts, notes |

### Domain Options

| Domain | Scope |
|--------|-------|
| `GOVERNANCE` | Rules, values, phases |
| `PRODUCT` | Features, roadmap |
| `ENGINE` | Services, microservices |
| `ARCHITECTURE` | System design |
| `IDENTITY` | User identity |
| `SCORING` | Gamification |
| `SECURITY` | Auth, encryption |
| `DELIVERY` | Sprints, releases |
| `ROUTING` | Gateway, paths |
| `RUNTIME` | Ports, topology |
| `LLM` | AI pipeline |
| `API` | Endpoints, contracts |

### Lifecycle Options

| State | Symbol | Description |
|-------|--------|-------------|
| `ACTIVE` | 🟢 | Current, valid |
| `UPDATE_NEEDED` | 🟡 | Valid but stale |
| `DEPRECATED` | 🟠 | Being replaced |
| `REDUNDANT` | 🔴 | Duplicates another |
| `ARCHIVED` | ⚫ | Historical only |

### Freshness Options

| Level | Days | Symbol |
|-------|------|--------|
| `HOT` | 0-7 | 🔥 |
| `WARM` | 8-30 | ☀️ |
| `COOL` | 31-90 | 🌤️ |
| `COLD` | 91-180 | ❄️ |
| `FROZEN` | 180+ | 🧊 |

### Directive Options

| Directive | When to Use |
|-----------|-------------|
| `READ:DEEP` | Essential, read fully |
| `READ:SKIM` | Scan for relevant sections |
| `READ:HEADERS` | Just read structure |
| `READ:IF_RELEVANT` | Only if topic matches |
| `SKIP:REDUNDANT` | >80% overlap with canonical |
| `SKIP:ARCHIVED` | Historical only |
| `VERIFY:STALE` | COLD or FROZEN docs |

---

## Example: T2 Canonical Document

```markdown
## Document Genome

> **Quick Genome**: `META:STRATEGIC:AUTHORITATIVE | T2:CANONICAL | ENGINE | ACTIVE | HOT | R:0% | READ:DEEP`

| Dimension | Value | Notes |
|-----------|-------|-------|
| **Class** | `META:STRATEGIC:AUTHORITATIVE` | Engine strategy |
| **Topic Domain** | `ENGINE` | 6 engines, orchestration |
| **Authority** | `T2:CANONICAL` | Source of truth for ENGINE |
| **Canonical Source** | `SELF` | This IS the canonical source |
| **Lifecycle** | `ACTIVE` | Current and valid |
| **Freshness** | `HOT (2d)` | Updated 2 days ago |
| **Redundancy** | `0%` | Unique content |
| **Claude Directive** | `READ:DEEP` | Must read fully |
```

---

## Example: T3 Derived Document

```markdown
## Document Genome

> **Quick Genome**: `META:STRATEGIC:AUTHORITATIVE | T3:DERIVED | ENGINE | ACTIVE | WARM | R:35% | READ:SKIM`

| Dimension | Value | Notes |
|-----------|-------|-------|
| **Class** | `META:STRATEGIC:AUTHORITATIVE` | Engine-specific strategy |
| **Topic Domain** | `ENGINE` | Scoring engine details |
| **Authority** | `T3:DERIVED` | Derived from MASTER |
| **Canonical Source** | `→ MASTER_ENGINE_STRATEGY.md` | Parent document |
| **Lifecycle** | `ACTIVE` | Current |
| **Freshness** | `WARM (15d)` | Updated 15 days ago |
| **Redundancy** | `35%` | Overlaps with MASTER |
| **Claude Directive** | `READ:SKIM` | Scan if read MASTER |

### Overlap Analysis

| Overlaps With | Score | Relationship |
|---------------|-------|--------------|
| MASTER_ENGINE_STRATEGY.md | 35% | Derived from |
```

---

**Use this template when creating or updating strategy documents.**
