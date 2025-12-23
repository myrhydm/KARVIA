# Minimum Viable Governance - KARVIA

**Version**: 1.0.0
**Last Updated**: December 22, 2025
**Status**: CONSTITUTIONAL
**Authority**: This document supersedes all others in case of conflict.
**Owner**: KARVIA Team

---

## Document Genome

> **Quick Genome**: `META:STRATEGIC:CONSTITUTIONAL | T1:CONSTITUTIONAL | GOVERNANCE | ACTIVE | HOT | R:0% | READ:DEEP`

---

## 1. Project Identity

### 1.1 Core Definition

**Name**: KARVIA
**Mission**: Help individuals achieve their dreams through structured goal tracking and AI-powered guidance.
**Vision**: Become the leading personal development platform that transforms aspirations into actionable, achievable outcomes.
**Values**:
- User Empowerment
- Simplicity & Clarity
- Continuous Improvement
- Privacy & Trust
- Evidence-Based Progress

### 1.2 Stakeholders

| Role | Responsibility |
|------|----------------|
| Product Owner | KARVIA Team |
| Technical Lead | KARVIA Team |
| Documentation Owner | Claude Code |

---

## 2. Human Values

> **CRITICAL**: These values guide ALL decisions. If any action conflicts with these, STOP and escalate.

### 2.1 Non-Negotiable Values

1. **User Privacy**: User data is sacred. Never expose personal goals, dreams, or progress without explicit consent.
2. **Accessibility**: The platform must remain usable by all individuals regardless of technical ability.
3. **Honesty**: AI recommendations must be transparent and not manipulative. Users own their journey.
4. **Safety**: No features that could harm user mental health or well-being. Encourage healthy goal-setting.

### 2.2 Value Conflict Resolution

When values conflict:
1. User safety takes precedence over all other concerns
2. Privacy outweighs convenience features
3. Document the conflict and resolution for future reference

---

## 3. Phase Definition

### 3.1 Current Phase

| Phase | Status | Entry Date | Exit Criteria |
|-------|--------|------------|---------------|
| **MVP** | Active | Dec 2025 | Core features stable, 100+ active users |

### 3.2 Phase Gates

| Phase | Entry Criteria | Key Deliverables | Success Metrics |
|-------|----------------|------------------|-----------------|
| MVP | Core functionality complete | Goals, Tasks, Journey, AI Integration | Functional app, basic tests |
| Growth | MVP validated | User analytics, enhanced AI, mobile | 1000+ users, 80% retention |
| Scale | Growth metrics hit | Performance optimization, enterprise | 10K+ users, <200ms response |
| Enterprise | Scale proven | Multi-tenant, SSO, compliance | Enterprise contracts |

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
GOVERNANCE > SECURITY > ARCHITECTURE > JOURNEY > GOALS > TASKS > AI > API
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

- Only Product Owner can propose amendments
- Only Technical Lead can approve amendments

### 6.2 Amendment Steps

1. Propose change with rationale
2. Impact assessment required
3. Stakeholder review (minimum 3 days)
4. Approval documented
5. Version incremented
6. All affected docs updated

### 6.3 Emergency Amendments

For critical safety/security issues:
1. Immediate stakeholder notification
2. Temporary amendment can be applied
3. Full review within 7 days
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

## 8. KARVIA-Specific Rules

### 8.1 Journey Stage Definitions

| Stage | Purpose | Key Actions |
|-------|---------|-------------|
| Onboarding | Initial setup | Vision questionnaire, dream capture |
| Discovery | Understanding | PM assessment, goal parsing |
| Growth | Active development | Weekly goals, task completion |
| Mastery | Optimization | Reflection, adaptation |

### 8.2 AI Guidelines

- LLM outputs MUST be reviewed before presentation to users
- AI-generated goals MUST be editable by users
- No autonomous actions without user consent
- Fallback to manual mode if AI unavailable

### 8.3 Data Retention

- User data retained for account lifetime
- Anonymized analytics retained indefinitely
- Deleted accounts purged within 30 days
- No selling of user data under any circumstances

---

## Related Documents

- [PHASE_GATES.md](../01-authoritative/PHASE_GATES.md) - Detailed phase criteria
- [CANONICAL_SOURCE_REGISTRY.md](../05-governance/CANONICAL_SOURCE_REGISTRY.md) - Domain sources
- [CODEBASE_STRUCTURE.md](../../../../.claude/CODEBASE_STRUCTURE.md) - Technical architecture

---

**Document Status**: CONSTITUTIONAL - Supreme authority for KARVIA. All other documents must align with this.
