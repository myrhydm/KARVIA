# Minimum Viable Governance - [PROJECT_NAME]

**Version**: 1.0.0
**Last Updated**: [DATE]
**Status**: CONSTITUTIONAL
**Authority**: This document supersedes all others in case of conflict.
**Owner**: [OWNER]

---

## Document Genome

> **Quick Genome**: `META:STRATEGIC:CONSTITUTIONAL | T1:CONSTITUTIONAL | GOVERNANCE | ACTIVE | HOT | R:0% | READ:DEEP`

---

## 1. Project Identity

### 1.1 Core Definition

**Name**: [PROJECT_NAME]
**Mission**: [One sentence - what we do]
**Vision**: [One sentence - where we're going]
**Values**: [3-5 core values]

### 1.2 Stakeholders

| Role | Responsibility |
|------|----------------|
| Product Owner | [name/role] |
| Technical Lead | [name/role] |
| Documentation Owner | [name/role] |

---

## 2. Human Values

> **CRITICAL**: These values guide ALL decisions. If any action conflicts with these, STOP and escalate.

### 2.1 Non-Negotiable Values

1. **[Value 1]**: [Description and examples]
2. **[Value 2]**: [Description and examples]
3. **[Value 3]**: [Description and examples]

### 2.2 Value Conflict Resolution

When values conflict:
1. [Priority order]
2. [Escalation process]
3. [Documentation requirement]

---

## 3. Phase Definition

### 3.1 Current Phase

| Phase | Status | Entry Date | Exit Criteria |
|-------|--------|------------|---------------|
| **[CURRENT]** | Active | [DATE] | [criteria] |

### 3.2 Phase Gates

| Phase | Entry Criteria | Key Deliverables | Success Metrics |
|-------|----------------|------------------|-----------------|
| MVP | [criteria] | [deliverables] | [metrics] |
| Growth | [criteria] | [deliverables] | [metrics] |
| Scale | [criteria] | [deliverables] | [metrics] |
| Enterprise | [criteria] | [deliverables] | [metrics] |

### 3.3 Phase Transition Rules

1. All entry criteria must be met
2. Stakeholder sign-off required
3. Documentation updated before transition
4. Rollback plan documented

---

## 4. Document Authority

### 4.1 Authority Tiers

```
T1: CONSTITUTIONAL (this document)
│   └── Supreme authority, cannot be overridden
│
├── T2: CANONICAL (domain sources)
│   └── Single source of truth for domain
│
├── T3: DERIVED (from T2)
│   └── Must align with canonical source
│
└── T4: WORKING (drafts, notes)
    └── May be incomplete or stale
```

### 4.2 Conflict Resolution

When documents conflict:
1. **T1 always wins** - no exceptions
2. **Within same tier**: More recently updated wins
3. **Cross-domain**: Check CANONICAL_SOURCE_REGISTRY
4. **Unresolved**: Escalate to stakeholder

### 4.3 Domain Precedence

```
GOVERNANCE > SECURITY > ARCHITECTURE > [DOMAIN] > [DOMAIN] > API
```

---

## 5. Governance Rules

### 5.1 Documentation Standards

- All documents MUST have version numbers
- All READMEs MUST have Session Seals
- All strategy docs SHOULD have Document Genome
- Changes MUST be logged in CHANGE_LOG.md

### 5.2 Session Management

- Sessions MUST start with `/init`
- Sessions MUST end with `/close`
- Handoff documents REQUIRED for context preservation
- Session quality rating REQUIRED (target >= 8/10)

### 5.3 Audit Requirements

- Run `/audit` weekly on active development areas
- Document Health check monthly
- Address CRITICAL issues immediately
- Address HIGH issues within sprint

---

## 6. Amendment Process

### 6.1 Who Can Amend

- Only [ROLE] can propose amendments
- Only [ROLE] can approve amendments

### 6.2 Amendment Steps

1. Propose change with rationale
2. Impact assessment required
3. Stakeholder review (minimum [N] days)
4. Approval documented
5. Version incremented
6. All affected docs updated

### 6.3 Emergency Amendments

For critical safety/security issues:
1. Immediate stakeholder notification
2. Temporary amendment can be applied
3. Full review within [N] days
4. Permanent decision documented

---

## 7. Enforcement

### 7.1 Compliance Check

During `/audit`, verify:
- [ ] All documents reference MVG
- [ ] No documents contradict MVG
- [ ] Phase status is accurate
- [ ] Values are being followed

### 7.2 Non-Compliance Handling

| Severity | Response |
|----------|----------|
| Minor | Note in audit, fix in next session |
| Major | Block deployment until fixed |
| Critical | Immediate escalation to stakeholder |

---

## Related Documents

- [PHASE_GATES.md](../01-authoritative/PHASE_GATES.md) - Detailed phase criteria
- [CANONICAL_SOURCE_REGISTRY.md](../05-governance/CANONICAL_SOURCE_REGISTRY.md) - Domain sources
- [DOCUMENT_GENOME_SPECIFICATION.md](../05-governance/DOCUMENT_GENOME_SPECIFICATION.md) - Doc standards

---

**Document Status**: CONSTITUTIONAL - Supreme authority for [PROJECT_NAME]. All other documents must align with this.
