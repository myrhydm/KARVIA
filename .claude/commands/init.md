# Session Initialization

**Version**: 3.0.0
**Last Updated**: December 20, 2025
**Status**: Active
**Purpose**: Automated workflow for session startup, context restoration, and session seal verification

---

## IMPORTANT: This is an AUTOMATED WORKFLOW

**Claude MUST execute each step sequentially. This command restores context from previous sessions via handoff documents.**

---

## Step 0: Session Seal Verification (PRE-FLIGHT CHECK)

> **Purpose**: Verify previous session closed properly. Detect and recover from incomplete closures.

### Step 0.1: Check Session Seal Integrity

**Read the most recent handoff and compare with README counters:**

```bash
# Get most recent handoff
ls -la IBRAIN_STRATEGY/3-DELIVERY/handoffs/*.md 2>/dev/null | tail -1

# Check Session Seal in root README
grep -A5 "Session Seal" IBRAIN_STRATEGY/00_MASTER_INDEX.md 2>/dev/null || echo "No seal found"
```

### Step 0.2: Verify Counter Match

**Compare handoff date with README "Last Close" dates:**

1. Read the most recent handoff file
2. Extract the handoff date
3. Check if IBRAIN_STRATEGY/* READMEs have matching "Last Close" dates

**If dates match**: Previous session closed properly → Proceed to Step 1
**If dates mismatch**: Previous session may not have completed `/close` properly

### Step 0.3: Recovery Protocol (If Mismatch Detected)

**If session seal verification fails, execute README Recovery:**

```markdown
⚠️ SESSION SEAL MISMATCH DETECTED

Previous session may not have completed /close properly.

**Recovery Actions:**
1. Check git log for uncommitted changes
2. Scan IBRAIN_STRATEGY/* for files modified since last handoff
3. Generate recovery report with:
   - Files changed since last handoff
   - Missing Session Seal updates
   - Recommended corrections
4. Ask user: "Previous session appears incomplete. Should I run README recovery check? [Y/n]"
```

**Recovery Check Actions (if user approves):**
1. Read all IBRAIN_STRATEGY/* READMEs
2. Identify missing/outdated Session Seals
3. Update READMEs with recovered change information
4. Note in handoff that recovery was performed

**Recovery Report Template:**
```markdown
## Session Recovery Report

**Detection Time**: [timestamp]
**Last Known Good Seal**: [counter from handoff]
**Detected Gap**: [description]

### Files Changed Since Last Handoff
| File | Change Type | Needs README Update |
|------|-------------|---------------------|
| [file] | [created/modified] | [Yes/No] |

### Recovery Actions Taken
1. [action]
2. [action]

**Status**: [Recovered/Partial/User Intervention Needed]
```

---

## Step 1: Check for Handoff Documents (FIRST!)

**This is the most important step - handoffs preserve context between sessions.**

```bash
# Check for handoff documents
ls -la IBRAIN_STRATEGY/3-DELIVERY/handoffs/*.md 2>/dev/null | tail -5
```

**If handoffs exist:**
1. Read the MOST RECENT handoff file
2. Follow the "CONTEXT FOR NEXT SESSION" section
3. Execute the "Restart Point" instructions exactly

**The handoff contains:**
- What was accomplished last session
- What's left to do
- Exact restart instructions
- Technical context needed
- Recommended next steps

---

## Step 2: Read Core Context Files

Read these files in order to understand current state:

### Primary Context (Always Read)
1. `.claude/SESSION_LOG.md` - Session history and current progress
2. `.claude/CHANGE_LOG.md` - Recent changes made to project
3. `POST_MIGRATION_IMPLEMENTATION_MASTER_LIST.md` - Current phase priorities
4. `.claude/MASTER_GUIDE.md` - File placement rules (MANDATORY)

### Structure Maps (Reference as Needed)
5. `.claude/CODEBASE_STRUCTURE.md` - Where code files are located
6. `.claude/DATA_STRUCTURE.md` - Where documentation is located

### Check for Session Breaks (Legacy)
7. `.claude/sessions/` - Check for any break notes from previous sessions

---

## Step 3: Understand the Platform

### iBrain Architecture Summary

**4 Microservices**:
| Service | Port | Purpose |
|---------|------|---------|
| Gateway | 3000 | API routing, auth, rate limiting |
| Intelligence | 8080 | Core algorithms, archetypes |
| Analytics | 8081 | User insights, progress tracking |
| Auth | 8082 | JWT authentication, profiles |

**6 Engines**:
| Engine | Port | Technology | Status |
|--------|------|------------|--------|
| Scoring | 8080 | Go | Production |
| Tracking | 8081 | Node.js | Ready |
| Observer | 8082 | Node.js | Basic |
| IAM | 8083 | Node.js | Skeleton |
| Assessment | 8084 | Node.js | Skeleton |
| Planner | server/ | Node.js | Active |

### Current Phase: Phase 4

**Developer Experience & External Integration**

Priority 1 (High Impact):
- P1.1: JavaScript/Node.js SDK
- P1.2: Python SDK
- P1.3: Interactive Documentation (Swagger UI)
- P1.4: Integration Guides

Priority 2 (Medium Impact):
- P2.1: Docker Compose local dev
- P2.2: Postman Collection
- P3.1: API Key Management
- P3.2: Webhook System

---

## Step 4: Provide Current State Summary

After reading the context files, provide:

### 1. **Project Status**
```
Current Phase: [Phase 4 - Developer Experience]
Recent Changes: [List from CHANGE_LOG.md]
Last Session: [Type, Date, What was done]
Session Count: [From SESSION_LOG.md]
```

### 2. **Platform Status**
```
Services: [Gateway, Intelligence, Analytics, Auth - status]
Engines: [6 engines - operational status]
Documentation: [Coverage status]
```

### 3. **What Changed Recently**
- List recent entries from CHANGE_LOG.md
- Note any session break points
- Highlight any blockers or issues

### 4. **Recommended Next Session**
```
Type: [Strategy/Coding/Audit/Testing/General]
Focus: [Specific task or feature]
Token Budget: [X-YK]
Prerequisites: [Any dependencies]
```

---

## Step 5: Document Discovery Guide

If you need to find specific information:

| Looking For | Go To |
|-------------|-------|
| What is iBrain? | `IBRAIN_STRATEGY/1-PRODUCT/SYSTEM_OVERVIEW.md` |
| Setup instructions | `GETTING_STARTED.md` |
| Current priorities | `POST_MIGRATION_IMPLEMENTATION_MASTER_LIST.md` |
| Code organization | `.claude/CODEBASE_STRUCTURE.md` |
| Documentation map | `.claude/DATA_STRUCTURE.md` |
| API specifications | `IBRAIN_STRATEGY/2-TECHNICAL/api-specs/` |
| Service details | `IBRAIN_IMPLEMENTATION/1-SERVICES/` |
| Engine details | `IBRAIN_IMPLEMENTATION/2-ENGINES/` |
| External integration | `External_App_Integration/` |
| Session history | `.claude/SESSION_LOG.md` |
| All changes | `.claude/CHANGE_LOG.md` |
| Session handoffs | `IBRAIN_STRATEGY/3-DELIVERY/handoffs/` |
| File placement rules | `.claude/MASTER_GUIDE.md` |

---

## Step 6: Session Type Recommendation

Based on the current state, recommend which session type to start:

| Condition | Recommended Command |
|-----------|---------------------|
| Planning needed, architecture decisions | `/strategy` |
| Features ready to implement, specs complete | `/coding` |
| Code review needed, quality check required | `/audit` |
| Features implemented, validation needed | `/testing` |
| Questions to answer, research needed | `/general` |

---

## Step 7: Ready to Start

After completing init, ask the user which session type they want:

- `/strategy` - Start strategy session
- `/coding` - Start coding session
- `/audit` - Start audit session
- `/testing` - Start testing session
- `/general` - Start general session

**Or provide a ready-to-use starter prompt for the recommended session.**

---

## Quick Context Reference

### Key File Locations

```
.claude/                     # Session management hub
IBRAIN_STRATEGY/             # Strategy & product docs
IBRAIN_IMPLEMENTATION/       # Technical implementation docs
services/                    # 4 microservices
engines/                     # 6 engines
contracts/                   # API contracts
packages/                    # SDKs
External_App_Integration/    # External developer docs
```

### Key Documents

```
POST_MIGRATION_IMPLEMENTATION_MASTER_LIST.md  # Current roadmap
GETTING_STARTED.md                            # Setup guide
.claude/SESSION_LOG.md                        # Session history
.claude/CHANGE_LOG.md                         # Change tracking
.claude/CODEBASE_STRUCTURE.md                 # Code map
.claude/DATA_STRUCTURE.md                     # Docs map
```

---

## THE DANCE MOVE: /init ↔ /close

```
┌─────────────────────────────────────────────────────────────┐
│                    SESSION LIFECYCLE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    /init                                    /close           │
│      │                                         │             │
│      ▼                                         ▼             │
│  ┌─────────┐                            ┌──────────┐        │
│  │ Load    │                            │ Create   │        │
│  │ Context │◄───── Work Session ───────►│ Handoff  │        │
│  └─────────┘                            └──────────┘        │
│      │                                         │             │
│      │    ┌───────────────────────────┐       │             │
│      └───►│  IBRAIN_STRATEGY/         │◄──────┘             │
│           │  3-DELIVERY/handoffs/     │                      │
│           │  [DATE]_handoff.md        │                      │
│           └───────────────────────────┘                      │
│                        │                                     │
│                        ▼                                     │
│              Context preserved for                           │
│              next Claude session                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**The handoff document is the bridge between sessions. It captures:**
- What was done
- What's left to do
- Exact restart instructions
- Technical context
- Recommended next steps

---

## WORKFLOW SUMMARY

```
/init
   │
   ├─► Step 0: Session Seal Verification (PRE-FLIGHT CHECK - NEW!)
   │      └─► Check most recent handoff date
   │      └─► Compare with README "Last Close" dates
   │      └─► If mismatch: Run recovery protocol
   │      └─► If match: Proceed normally
   │
   ├─► Step 1: Check for handoffs (MOST IMPORTANT)
   │      └─► Read most recent handoff
   │      └─► Follow restart instructions
   │
   ├─► Step 2: Read core context files
   │      └─► SESSION_LOG.md, CHANGE_LOG.md
   │      └─► MASTER_GUIDE.md (file placement)
   │
   ├─► Step 3: Understand platform architecture
   │      └─► 4 microservices, 6 engines
   │
   ├─► Step 4: Provide current state summary
   │      └─► Project status, platform status
   │
   ├─► Step 5: Document discovery guide
   │      └─► Where to find information
   │
   ├─► Step 6: Session type recommendation
   │      └─► Based on handoff or current state
   │
   └─► Step 7: Ready to start
          └─► Begin work session
          └─► Remember to /close when done
```

---

**After completing init, you're ready to begin work on the iBrain platform.**

**Remember: Always run `/close` at the end of your session to preserve context!**
