# General Session Initialization

**Version**: 2.0.0
**Last Updated**: December 21, 2025
**Session Type**: GENERAL
**Access Profile**: GENERAL (from ACCESS_CONTROL.yaml)
**Token Budget**: 20-40K (10-20%)
**Purpose**: Research, questions, quick fixes, exploration

---

## TIERED CONTEXT LOADING

### Step 1: Light Context (On-Demand)

```
READ:IF_NEEDED → IBRAIN_STRATEGY/1-PRODUCT/strategy/00-constitutional/
                └── MVG_MINIMUM_VIABLE_GOVERNANCE.md (Only if governance-related)
```

**Why**: General sessions are lightweight. Load context on-demand.

### Step 2: Load Based on Question Type

**Select your question type** (then load only what's needed):

#### Type A: Codebase Questions
```
READ:SKIM  → .claude/CODEBASE_STRUCTURE.md
READ:REF   → Relevant code files
SKIP       → strategy/ (unless directly relevant)
```

#### Type B: Documentation Questions
```
READ:SKIM  → .claude/DATA_STRUCTURE.md
READ:REF   → Relevant documentation
SKIP       → code files
```

#### Type C: Architecture/Design Questions
```
READ:SKIM  → 02-master/MASTER_TECHNICAL_ARCHITECTURE.md
READ:SKIM  → .claude/CODEBASE_STRUCTURE.md
SKIP       → 04-vision/
```

#### Type D: Quick Fixes
```
READ:REF   → Affected files only
SKIP       → All strategy docs (unless directly relevant)
```

---

## CONTEXT LOADING MATRIX

| Question Type | 00-const | Strategy | .claude | Code |
|---------------|----------|----------|---------|------|
| Codebase | SKIP | SKIP | SKIM | REF |
| Documentation | SKIP | IF_RELEVANT | SKIM | SKIP |
| Architecture | SKIP | SKIM | SKIM | SKIP |
| Quick Fixes | SKIP | SKIP | SKIP | REF |

**Legend**: SKIM = Headers only | IF_RELEVANT = Only if needed | REF = Reference specific files | SKIP = Don't load

---

## ACCESS CONTROL PROFILE: GENERAL

From `.claude/ACCESS_CONTROL.yaml`:

```yaml
GENERAL:
  can_read: ["DOC-*"]
  can_write: ["DOC-T4-*"]
  notes: "Most restricted write access"
```

**Restrictions**:
- Can read ALL documents
- Can only write T4 (Working) documents
- Most restricted profile for modifications
- Primary purpose is research and quick answers

**Note**: For significant changes, upgrade to appropriate session type.

---

## What Do You Need?

**Question/Task**: [What are you trying to accomplish?]
**Context**: [Any relevant background]

---

## Common Use Cases

### 1. Understanding the Codebase
- How does [service/feature] work?
- Where is [functionality] implemented?
- What's the flow for [process]?

### 2. Research
- What's the best approach for [feature]?
- How should we implement [pattern]?
- What are the options for [technology]?

### 3. Quick Fixes
- Small bug fixes (single file)
- Configuration changes
- Environment setup
- Dependency updates

### 4. Documentation
- Quick docs updates
- README improvements
- Comment additions

### 5. Troubleshooting
- Environment issues
- Build problems
- Dependency conflicts
- Service connectivity

---

## iBrain Quick Reference

### Services

| Service | Port | Purpose |
|---------|------|---------|
| Gateway | 3000 | API routing, auth, rate limiting |
| Intelligence | 8080 | Core algorithms, archetypes |
| Analytics | 8081 | User insights, progress tracking |
| Auth | 8082 | JWT authentication, profiles |

### Key Directories

```
/services/           # Microservices
  /gateway/          # API Gateway
  /intelligence/     # Intelligence Service
  /analytics/        # Analytics Service
  /auth/             # Auth Service

/engines/            # Engine integrations
  /assessment-engine/
  /observer-engine/
  /planner-engine/

/contracts/          # API contracts
  /openapi/          # OpenAPI specifications

/docs/               # Documentation
  /architecture/     # Architecture docs

/packages/           # SDKs and packages
  /sdk-js/           # JavaScript SDK
  /sdk-python/       # Python SDK
```

### Common Commands

```bash
# Start development
npm run dev

# Run tests
npm test

# Start specific service
cd services/[service] && npm start

# View logs
npm run logs

# Build
npm run build
```

### Key Files

| File | Purpose |
|------|---------|
| `POST_MIGRATION_IMPLEMENTATION_MASTER_LIST.md` | Current phase roadmap |
| `GETTING_STARTED.md` | Setup guide |
| `.env.example` | Environment template |
| `docker-compose.yml` | Docker configuration |

---

## Best Practices for General Sessions

### DO:
```
- Keep questions focused
- Provide context when asking
- For quick fixes, still read files first
- Document findings if useful
- Stay within token budget
```

### DON'T:
```
- Start complex implementations
- Mix with other session types
- Spend too many tokens on exploration
- Skip documentation for findings
```

---

## Session Output

For questions answered, provide:
1. Clear, direct answer
2. Code examples if applicable
3. References to relevant files
4. Next steps if action needed

For quick fixes, verify:
1. Change works as expected
2. No side effects
3. Update session log if significant

---

## Rate This Session (1-10)

| Rating | Quality Level |
|--------|---------------|
| 10 | Question fully answered, actionable |
| 9 | Good answer, minor gaps |
| 8 | Adequate response (MINIMUM TARGET) |
| 7 | Basic answer |
| <= 6 | Incomplete or unclear |

---

## When to Upgrade Session Type

If you find yourself:
- Planning significant work → `/strategy`
- Implementing features → `/coding`
- Reviewing code quality → `/audit`
- Running tests → `/testing`

Switch to the appropriate session type for proper structure and quality gates.

---

**NOW BEGIN**

Answer the question or complete the quick task efficiently.
