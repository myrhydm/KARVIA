# Strategy Full Template (T1/T2)

**Use For**: Constitutional (T1) and Canonical (T2) strategy documents

---

## Template

```markdown
# [DOCUMENT_TITLE]

**Version**: 1.0.0
**Last Updated**: [DATE]
**Status**: Active
**Doc ID**: DOC-[T1|T2]-[DOMAIN]-[SEQ]
**Parent**: [PARENT_DOC_LINK or "SELF" for T1]
**Owner**: [BRAMHI_LABS_ROLE]
**Authority**: [T1 - CONSTITUTIONAL | T2 - CANONICAL]

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | [DATE] | [BRAMHI_LABS_ROLE] | Initial creation |

---

## Document Genome

> **Quick Genome**: `META:STRATEGIC:[CLASS] | [T1:CONSTITUTIONAL|T2:CANONICAL] | [DOMAIN] | ACTIVE | HOT | R:0% | READ:DEEP`

| Dimension | Value | Notes |
|-----------|-------|-------|
| **Class** | `META:STRATEGIC:[CONSTITUTIONAL|AUTHORITATIVE]` | [explanation] |
| **Topic Domain** | `[DOMAIN]` | Primary bounded context |
| **Authority** | `[T1:CONSTITUTIONAL|T2:CANONICAL]` | Tier in hierarchy |
| **Canonical Source** | `SELF` | This IS the canonical source |
| **Lifecycle** | `ACTIVE` | Current and valid |
| **Freshness** | `HOT (0d)` | Just created |
| **Redundancy** | `0%` | Unique content |
| **Claude Directive** | `READ:DEEP` | Must read fully |

### Claude Reading Path

| If Task Involves | Read This | Then Read | May Skip |
|------------------|-----------|-----------|----------|
| [topic 1] | THIS DOC | [related] | [unrelated] |
| [topic 2] | THIS DOC | [related] | [unrelated] |

---

## Executive Summary

[2-3 sentence overview of what this document covers and why it matters]

---

## 1. Purpose & Scope

### 1.1 Purpose

[Why this document exists]

### 1.2 Scope

[What this document covers and does NOT cover]

### 1.3 Audience

[Who should read this document]

---

## 2. [Main Section 1]

[Content]

---

## 3. [Main Section 2]

[Content]

---

## 4. [Main Section 3]

[Content]

---

## 5. Implementation Guidelines

[How to apply this document's guidance]

---

## 6. Governance

### 6.1 Modification Process

[T1: Formal amendment required with admin approval]
[T2: Documented reason, strategy session approval]

### 6.2 Review Schedule

[How often this document should be reviewed]

---

## Session Seal

> **Note**: T1 docs include Session Seal directly. T2 docs rely on folder README Session Seal.

| Field | Value |
|-------|-------|
| **Counter** | `[CODE][YYYYMMDDHHMMSS][NNNN]` |
| **Last Close** | [YYYY-MM-DD HH:MM] |
| **Summary** | [1-line description] |

### Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| [Date] | Initial creation | High |

### Milestones

| Phase | Date | Achievement |
|-------|------|-------------|
| Creation | [Date] | Document established |

---

## Related Documents

- **Parent**: [parent or N/A for T1]
- **Children**: [derived documents]
- **Siblings**: [same-tier related docs]
- **See Also**: [references]

---

**Document Status**: [CONSTITUTIONAL|CANONICAL] - [Brief status description]
```

---

## Field Reference

### Doc ID Format
- T1: `DOC-T1-[DOMAIN]-[SEQ]` (e.g., DOC-T1-GOV-001)
- T2: `DOC-T2-[DOMAIN]-[SEQ]` (e.g., DOC-T2-ENG-001)

### Domain Codes
| Code | Domain |
|------|--------|
| GOV | Governance |
| SEC | Security |
| ENG | Engine |
| API | API/Contracts |
| PRD | Product |
| ARC | Architecture |
| VIS | Vision |
| RUN | Runtime |
| DOC | Documentation |

### Author Roles
| Location | Default Author |
|----------|----------------|
| 1-PRODUCT/ | BRAMHI_LABS_ARIA_PM |
| 2-TECHNICAL/ | BRAMHI_LABS_SYNTH_ARCH |
| .claude/ | BRAMHI_LABS_CONSULTANT |

---

**Template Version**: 1.0.0
**Last Updated**: December 21, 2025
