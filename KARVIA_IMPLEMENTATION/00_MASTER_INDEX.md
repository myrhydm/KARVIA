# KARVIA Implementation - Master Index

**Version**: 1.0.0
**Last Updated**: December 22, 2025
**Status**: Active

---

## Overview

This is the master index for all KARVIA implementation documentation. This folder contains detailed technical specifications, service documentation, and implementation guides.

---

## Directory Structure

```
KARVIA_IMPLEMENTATION/
├── 00_MASTER_INDEX.md    # This file
│
├── 1-SERVICES/           # Service documentation
│   └── (service specs go here)
│
├── 2-ENGINES/            # Engine implementations
│   └── (engine docs go here)
│
├── 3-TESTING/            # Test documentation
│   └── (test plans go here)
│
└── 4-SDK/                # SDK & integration docs
    └── (SDK docs go here)
```

---

## Current Services (from codebase)

### API Routes
| Service | Location | Purpose |
|---------|----------|---------|
| Auth | server/routes/auth.js | User authentication |
| Goals | server/routes/goals.js | Weekly goal management |
| Tasks | server/routes/tasks.js | Task CRUD operations |
| Journey | server/routes/journeyCore.js | User journey progression |
| Vision | server/routes/vision.js | Vision assessment |
| LLM | server/routes/llm.js | AI/LLM integration |
| Dreams | server/routes/dreams.js | Dream parsing |

### Core Services
| Service | Location | Purpose |
|---------|----------|---------|
| LLM Service | server/services/llmService.js | AI provider abstraction |
| Journey Service | server/services/journeyService.js | Journey logic |
| Email Service | server/services/emailService.js | Email notifications |
| Scoring Engine | server/services/comprehensiveScoringEngine.js | User scoring |

---

## Documentation To Create

As the project matures, add documentation for:

1. **1-SERVICES/**
   - [ ] Auth Service Spec
   - [ ] Goals Service Spec
   - [ ] Tasks Service Spec
   - [ ] Journey Service Spec
   - [ ] Vision Service Spec

2. **2-ENGINES/**
   - [ ] Scoring Engine Spec
   - [ ] Habit Loop Engine Spec
   - [ ] Adaptation Engine Spec

3. **3-TESTING/**
   - [ ] Test Strategy
   - [ ] Integration Test Plan
   - [ ] E2E Test Plan

4. **4-SDK/**
   - [ ] API Client SDK
   - [ ] Webhook Integration Guide

---

## Related Locations

- [KARVIA_STRATEGY/](../KARVIA_STRATEGY/) - Strategy documentation
- [server/](../server/) - Backend source code
- [client/](../client/) - Frontend source code
- [.claude/CODEBASE_STRUCTURE.md](../.claude/CODEBASE_STRUCTURE.md) - Architecture overview

---

**Session Seal**
- **Generated**: December 22, 2025
- **Command**: /bootstrap
- **Purpose**: Master navigation index for implementation documents
