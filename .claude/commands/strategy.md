# Strategy Session Initialization

**Version**: 2.0.0
**Last Updated**: December 21, 2025
**Session Type**: STRATEGY
**Access Profile**: STRATEGY (from ACCESS_CONTROL.yaml)
**Token Budget**: 40-60K (20-30%)
**Purpose**: Planning, architecture decisions, specifications

---

## TIERED CONTEXT LOADING

### Step 1: ALWAYS Load (Constitutional)

```
READ:DEEP → IBRAIN_STRATEGY/1-PRODUCT/strategy/00-constitutional/
           └── MVG_MINIMUM_VIABLE_GOVERNANCE.md (T1 - Supreme Authority)
```

**Why**: T1 documents override all other documents. Never skip.

### Step 2: Load Based on Planning Type

**Select your planning type** (then load the corresponding documents):

#### Type A: Sprint Planning
```
READ:DEEP  → 02-master/MASTER_PRODUCT_STRATEGY.md
READ:SKIM  → 01-authoritative/PHASE_GATE_DEFINITIONS.md
READ:SKIM  → 05-governance/DOCUMENT_REGISTRY.md
SKIP       → 03-engines/, 04-vision/
```

#### Type B: Architecture Decision
```
READ:DEEP  → 02-master/MASTER_TECHNICAL_ARCHITECTURE.md
READ:DEEP  → 01-authoritative/API_CONTRACTS_SPECIFICATION.md
READ:SKIM  → 01-authoritative/SECURITY_FRAMEWORK.md
READ:SKIM  → 01-authoritative/RUNTIME_ORCHESTRATION.md
SKIP       → 04-vision/
```

#### Type C: Feature Specification
```
READ:DEEP  → 02-master/MASTER_PRODUCT_STRATEGY.md
READ:DEEP  → 02-master/MASTER_ENGINE_STRATEGY.md
READ:SKIM  → 03-engines/[relevant engine].md
SKIP       → 04-vision/
```

#### Type D: Engine Work Planning
```
READ:DEEP  → 02-master/MASTER_ENGINE_STRATEGY.md
READ:DEEP  → 03-engines/ENGINE_[NAME]_STRATEGY.md
READ:SKIM  → 01-authoritative/RUNTIME_ORCHESTRATION.md
SKIP       → 04-vision/
```

#### Type E: Documentation Planning
```
READ:DEEP  → 05-governance/DOCUMENT_GENOME_SPECIFICATION.md
READ:DEEP  → 05-governance/CANONICAL_SOURCE_REGISTRY.md
READ:SKIM  → 05-governance/DOCUMENT_REGISTRY.md
SKIP       → 03-engines/, 04-vision/
```

#### Type F: Vision/Roadmap Planning
```
READ:DEEP  → 02-master/MASTER_PRODUCT_STRATEGY.md
READ:DEEP  → 04-vision/POST_MVP_IDENTITY.md
READ:DEEP  → 04-vision/POST_MVP_SCORING_METHODOLOGY.md
READ:SKIM  → 02-master/MASTER_ENGINE_STRATEGY.md
```

---

## CONTEXT LOADING MATRIX

| Planning Type | 00-const | 01-auth | 02-master | 03-engines | 04-vision | 05-gov |
|---------------|----------|---------|-----------|------------|-----------|--------|
| Sprint | ALWAYS | SKIM | DEEP | SKIP | SKIP | SKIM |
| Architecture | ALWAYS | DEEP | DEEP | IF_RELEVANT | SKIP | SKIP |
| Feature Spec | ALWAYS | IF_RELEVANT | DEEP | SKIM | SKIP | SKIP |
| Engine Work | ALWAYS | IF_RELEVANT | DEEP | DEEP | SKIP | SKIP |
| Documentation | ALWAYS | SKIP | SKIP | SKIP | SKIP | DEEP |
| Vision/Roadmap | ALWAYS | SKIP | DEEP | SKIP | DEEP | SKIP |

**Legend**: DEEP = Full read | SKIM = Headers + key sections | IF_RELEVANT = Only if applicable | SKIP = Don't load

---

## ACCESS CONTROL PROFILE: STRATEGY

From `.claude/ACCESS_CONTROL.yaml`:

```yaml
STRATEGY:
  can_read: ["DOC-T1-*", "DOC-T2-*", "DOC-T3-*", "DOC-T4-*"]
  can_write: ["DOC-T2-*", "DOC-T3-*", "DOC-T4-*"]
  cannot_write: ["DOC-T1-*", "DOC-*-SEC-*", "DOC-*-GOV-*"]
  requires_approval: ["DOC-T2-*"]
```

**Restrictions**:
- Cannot modify T1 (Constitutional) documents
- Cannot modify Security domain documents
- Cannot modify Governance domain documents
- T2 modifications require user confirmation

---

## DOCUMENT AUTHORITY HIERARCHY

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCUMENT AUTHORITY PYRAMID                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        ┌─────────┐                              │
│                        │   T1    │  CONSTITUTIONAL              │
│                        │  MVG    │  00-constitutional/          │
│                        └────┬────┘                              │
│                             │                                    │
│              ┌──────────────┼──────────────┐                    │
│              ▼              ▼              ▼                    │
│         ┌────────┐    ┌────────┐    ┌────────┐                 │
│         │   T2   │    │   T2   │    │   T2   │  CANONICAL       │
│         │ 01-auth│    │02-master│   │ 05-gov │                  │
│         └────┬───┘    └────┬───┘    └────────┘                  │
│              │             │                                     │
│              └──────┬──────┘                                     │
│                     ▼                                            │
│              ┌─────────────┐                                     │
│              │     T3      │  DERIVED                           │
│              │ 03-engines  │  04-vision                         │
│              └─────────────┘                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Conflict Resolution**: T1 > T2 > T3 | GOVERNANCE > SECURITY > ARCHITECTURE > ENGINE

---

## PLANNING CHECKLIST

### Before Planning

```
[ ] Loaded 00-constitutional (ALWAYS)
[ ] Identified planning type (A-F above)
[ ] Loaded relevant documents per matrix
[ ] Checked .claude/SESSION_LOG.md for recent context
[ ] Read most recent handoff if resuming work
```

### During Planning

```
[ ] Respect document authority (T1 > T2 > T3)
[ ] Reference canonical sources for domain truth
[ ] Create actionable specifications
[ ] Document decisions with rationale
[ ] Identify dependencies and blockers
```

### After Planning

```
[ ] New documents follow MASTER_GUIDE.md placement rules
[ ] New T3 documents align with T2 canonical sources
[ ] Update DOCUMENT_REGISTRY if new docs created
[ ] Update SESSION_LOG.md
[ ] Prepare for /close handoff
```

---

## WHAT ARE YOU PLANNING?

**Planning Type**: [ ] Sprint | [ ] Architecture | [ ] Feature | [ ] Engine | [ ] Documentation | [ ] Vision

**Scope**: [Which services/engines/features?]

**Deliverables**: [Specs, plans, ADRs, feature specs]

---

## SERVICES ARCHITECTURE

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Gateway   │───►│ Intelligence │    │  Analytics  │    │    Auth     │
│   :3000     │    │    :8080    │    │    :8081    │    │    :8082    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       └──────────────────┴──────────────────┴──────────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       │                      Engines                             │
       ├───────────┬───────────┬───────────┬───────────┬─────────┤
       │ Scoring   │ Tracking  │ Observer  │ IAM       │ Planner │
       │ :8080     │ :8081     │ :8082     │ :8083     │ server/ │
       │ (Go)      │ (Node)    │ (Node)    │ (Node)    │ (Node)  │
       └───────────┴───────────┴───────────┴───────────┴─────────┘
```

---

## STRATEGY OUTPUT TEMPLATES

### For Sprint Planning
```markdown
## Sprint [X] Plan

### Goals
1. [Goal 1]
2. [Goal 2]

### Tasks
| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Task 1 | P0 | 2h | None |

### Success Criteria
- [ ] Criterion 1
```

### For Architecture Decisions
```markdown
## ADR: [Title]

### Context
[Why is this decision needed?]

### Decision
[What was decided?]

### Options Considered
1. [Option 1] - Pros/Cons

### Consequences
[What are the implications?]
```

### For Feature Specifications
```markdown
## Feature: [Name]

### Overview
[What does this feature do?]

### Requirements
- [ ] Requirement 1

### Technical Design
- Services affected: [List]
- API changes: [List]

### Implementation Plan
1. Step 1
```

---

## TOKEN CHECKPOINTS

- At 30K (15%): Context loading complete
- At 45K (22%): Analysis complete
- At 55K (27%): Documentation draft
- At 60K (30%): Finalize and prepare for /close

---

## SESSION METRICS

- [ ] Clarity: Plans are actionable
- [ ] Completeness: All aspects covered
- [ ] Feasibility: Realistic scope
- [ ] Documentation: Well-documented
- [ ] Authority: Respects T1/T2/T3 hierarchy

---

## RATE THIS SESSION (1-10)

| Rating | Quality Level |
|--------|---------------|
| 10 | Comprehensive, actionable, well-documented |
| 9 | Thorough, minor gaps |
| 8 | Good coverage (MINIMUM TARGET) |
| 7 | Adequate but needs refinement |
| <= 6 | Incomplete or unclear |

**My Rating**: [X/10]

---

## SUCCESS CRITERIA

This strategy session is successful when:
- [ ] Constitutional (T1) context loaded
- [ ] Appropriate documents loaded per planning type
- [ ] Clear, actionable plans created
- [ ] All decisions documented with rationale
- [ ] Document authority respected
- [ ] Session rating >= 8/10

---

**NOW BEGIN PLANNING**

1. Confirm your planning type (A-F)
2. Load the appropriate documents
3. Create actionable specifications
4. Respect document authority hierarchy
5. Prepare for /close when done
