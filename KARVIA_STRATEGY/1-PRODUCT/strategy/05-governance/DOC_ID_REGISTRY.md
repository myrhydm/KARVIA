# Doc ID Registry

**Version**: 1.0.0
**Last Updated**: December 22, 2025
**Doc ID**: DOC-T2-GOV-003
**Status**: Canonical (T2)

---

## Document Genome

> **Quick Genome**: `META:GOVERNANCE:REGISTRY | T2:CANONICAL | GOVERNANCE | ACTIVE | WARM | R:0% | READ:SCAN`

---

## Purpose

This registry assigns and tracks unique document identifiers (Doc IDs) for all strategic documents in the KARVIA project.

---

## Doc ID Format

```
DOC-{TIER}-{DOMAIN}-{SEQUENCE}

TIER:
  T1 = Constitutional
  T2 = Canonical
  T3 = Derived
  T4 = Working

DOMAIN (3 chars):
  CON = Constitutional
  GOV = Governance
  TEC = Technical
  ARC = Architecture
  DEL = Delivery
  PRD = Product
  SEC = Security
```

---

## Assigned Doc IDs

### T1: Constitutional

| Doc ID | Document | Assigned | Status |
|--------|----------|----------|--------|
| DOC-T1-CON-001 | MVG_KARVIA.md | 2025-12-22 | Active |

### T2: Canonical

| Doc ID | Document | Assigned | Status |
|--------|----------|----------|--------|
| DOC-T2-GOV-001 | CANONICAL_SOURCE_REGISTRY.md | 2025-12-22 | Active |
| DOC-T2-GOV-002 | DOCUMENT_REGISTRY.md | 2025-12-22 | Active |
| DOC-T2-GOV-003 | DOC_ID_REGISTRY.md | 2025-12-22 | Active |
| DOC-T2-TEC-001 | CODEBASE_STRUCTURE.md | 2025-12-22 | Active |

### T3: Derived

| Doc ID | Document | Assigned | Status |
|--------|----------|----------|--------|
| - | (none assigned) | - | - |

### T4: Working

| Doc ID | Document | Assigned | Status |
|--------|----------|----------|--------|
| DOC-T4-DEL-001 | INITIAL_BACKLOG.md | 2025-12-22 | Draft |

---

## Next Available IDs

| Tier | Domain | Next ID |
|------|--------|---------|
| T1 | CON | DOC-T1-CON-002 |
| T2 | GOV | DOC-T2-GOV-004 |
| T2 | TEC | DOC-T2-TEC-002 |
| T2 | ARC | DOC-T2-ARC-001 |
| T2 | SEC | DOC-T2-SEC-001 |
| T3 | * | DOC-T3-XXX-001 |
| T4 | DEL | DOC-T4-DEL-002 |
| T4 | PRD | DOC-T4-PRD-001 |

---

## ID Assignment Rules

1. **New documents**: Request next available ID in sequence
2. **Archived documents**: ID is retired, not reused
3. **Tier changes**: New ID assigned, old ID deprecated
4. **Document splits**: Each part gets new ID
5. **Document merges**: Surviving doc keeps ID, merged doc deprecated

---

## Deprecated IDs

| Doc ID | Original Document | Deprecated Date | Reason |
|--------|-------------------|-----------------|--------|
| - | (none) | - | - |

---

## Related Documents

- [DOCUMENT_REGISTRY.md](./DOCUMENT_REGISTRY.md) - Full document list
- [CANONICAL_SOURCE_REGISTRY.md](./CANONICAL_SOURCE_REGISTRY.md) - Domain sources
- [MVG_KARVIA.md](../00-constitutional/MVG_KARVIA.md) - Governance rules

---

**Session Seal**
- **Generated**: December 22, 2025
- **Command**: /bootstrap
- **Purpose**: Assign and track document identifiers
