# KARVIA Strategy - Master Index

**Version**: 1.0.0
**Last Updated**: December 22, 2025
**Status**: Active

---

## Overview

This is the master index for all KARVIA strategic documentation. Navigate using the links below.

---

## Directory Structure

```
KARVIA_STRATEGY/
├── 00_MASTER_INDEX.md          # This file
│
├── 1-PRODUCT/
│   └── strategy/
│       ├── 00-constitutional/   # T1: Supreme authority
│       │   └── MVG_KARVIA.md
│       ├── 01-authoritative/    # T1: Key decisions
│       ├── 02-master/           # T2: Domain masters
│       ├── 03-engines/          # T2: Engine specs
│       ├── 04-vision/           # T2: Vision docs
│       └── 05-governance/       # T2: Governance docs
│           ├── CANONICAL_SOURCE_REGISTRY.md
│           ├── DOCUMENT_REGISTRY.md
│           └── DOC_ID_REGISTRY.md
│
├── 2-TECHNICAL/
│   ├── architecture/            # System architecture
│   ├── api-specs/               # API specifications
│   └── data-models/             # Data model docs
│
└── 3-DELIVERY/
    ├── sprints/                 # Sprint plans & backlogs
    │   └── INITIAL_BACKLOG.md
    ├── releases/                # Release documentation
    ├── handoffs/                # Session handoffs
    └── archive/                 # Historical records
        ├── strategy/
        ├── sprints/
        ├── releases/
        ├── handoffs/
        ├── bugs/
        ├── audits/
        └── tests/
```

---

## Quick Links

### Constitutional (T1)
- [MVG_KARVIA.md](1-PRODUCT/strategy/00-constitutional/MVG_KARVIA.md) - Minimum Viable Governance

### Governance (T2)
- [CANONICAL_SOURCE_REGISTRY.md](1-PRODUCT/strategy/05-governance/CANONICAL_SOURCE_REGISTRY.md) - Domain sources
- [DOCUMENT_REGISTRY.md](1-PRODUCT/strategy/05-governance/DOCUMENT_REGISTRY.md) - All documents
- [DOC_ID_REGISTRY.md](1-PRODUCT/strategy/05-governance/DOC_ID_REGISTRY.md) - Document IDs

### Delivery (T4)
- [INITIAL_BACKLOG.md](3-DELIVERY/sprints/INITIAL_BACKLOG.md) - Product backlog

### Technical (External)
- [CODEBASE_STRUCTURE.md](../.claude/CODEBASE_STRUCTURE.md) - Technical architecture

---

## Document Tiers

| Tier | Purpose | Location |
|------|---------|----------|
| T1 Constitutional | Supreme authority | 00-constitutional/, 01-authoritative/ |
| T2 Canonical | Single source of truth | 02-master/, 03-engines/, 04-vision/, 05-governance/ |
| T3 Derived | References canonical | Various |
| T4 Working | Drafts, notes | 3-DELIVERY/ |

---

## Related Locations

- [.claude/](../.claude/) - Claude Code governance
- [KARVIA_IMPLEMENTATION/](../KARVIA_IMPLEMENTATION/) - Implementation docs
- [README.md](../README.md) - Project README

---

**Session Seal**
- **Generated**: December 22, 2025
- **Command**: /bootstrap
- **Purpose**: Master navigation index for strategy documents
