# Strategy Derived Template (T3)

**Use For**: Derived strategy documents that extend T2 canonical sources

---

## Template

```markdown
# [DOCUMENT_TITLE]

**Version**: 1.0.0
**Last Updated**: [DATE]
**Status**: Active
**Doc ID**: DOC-T3-[DOMAIN]-[SEQ]
**Parent**: [T2_CANONICAL_DOC_LINK]
**Owner**: [BRAMHI_LABS_ROLE]
**Authority**: T3 - DERIVED (From [PARENT_DOC_NAME])

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | [DATE] | [BRAMHI_LABS_ROLE] | Initial creation |

---

## Document Genome

> **Quick Genome**: `META:STRATEGIC:AUTHORITATIVE | T3:DERIVED | [DOMAIN] | ACTIVE | HOT | R:[X]% | READ:SKIM`

| Dimension | Value | Notes |
|-----------|-------|-------|
| **Class** | `META:STRATEGIC:AUTHORITATIVE` | Domain-specific strategy |
| **Topic Domain** | `[DOMAIN]` | Primary bounded context |
| **Authority** | `T3:DERIVED` | Derived from canonical |
| **Canonical Source** | `-> [PARENT_DOC.md]` | Parent document |
| **Lifecycle** | `ACTIVE` | Current and valid |
| **Freshness** | `HOT (0d)` | Just created |
| **Redundancy** | `[X]%` | Overlap with parent |
| **Claude Directive** | `READ:SKIM` | Scan if read parent |

### Overlap Analysis

| Overlaps With | Score | Relationship |
|---------------|-------|--------------|
| [PARENT_DOC.md] | [X]% | Derived from |
| [SIBLING_DOC.md] | [Y]% | Complementary |

### Claude Reading Path

| If Task Involves | Read First | Then Read | May Skip |
|------------------|------------|-----------|----------|
| [this topic] | [PARENT] | THIS DOC | [others] |
| [specific detail] | THIS DOC | [impl] | [parent] |

---

## Canonical Reference

> **IMPORTANT**: This document derives from [PARENT_DOC.md]. If conflicts arise, the parent document takes precedence.

**Parent Document**: [Link to T2 canonical]
**Relationship**: Extends [specific sections]
**Unique Value**: [What this doc adds that parent doesn't cover]

---

## 1. Overview

[Brief overview of what this derived doc covers]

---

## 2. [Main Section 1]

[Detailed content specific to this scope]

---

## 3. [Main Section 2]

[Detailed content]

---

## 4. [Main Section 3]

[Detailed content]

---

## 5. Implementation

[Specific implementation guidance]

---

## Related Documents

- **Parent (T2)**: [Canonical source link]
- **Siblings (T3)**: [Other derived docs from same parent]
- **Implementation**: [Implementation docs if any]

---

**Document Status**: DERIVED from [PARENT]. Provides detailed [TOPIC] specification.
```

---

## Field Reference

### When to Use T3

Use T3 (Derived) when:
- Extending a T2 canonical document with specific details
- Creating engine-specific strategies (derived from MASTER_ENGINE_STRATEGY)
- Documenting specific implementations of general patterns

### Redundancy Calculation

Estimate redundancy score:
- 0-20%: Mostly unique content
- 20-40%: Some shared context, unique details
- 40-60%: Significant overlap, specific extensions
- 60%+: Consider if this doc is necessary

### Conflict Rule

```
If THIS DOC conflicts with PARENT DOC:
  PARENT WINS

If THIS DOC conflicts with SIBLING DOC:
  More recently updated wins
  OR escalate to parent doc for resolution
```

---

**Template Version**: 1.0.0
**Last Updated**: December 21, 2025
