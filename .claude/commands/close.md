# Session Close Command

**Version**: 3.0.0
**Last Updated**: December 20, 2025
**Status**: Active
**Purpose**: Automated workflow for clean session closure, context preservation, and README checkpoint

---

## IMPORTANT: This is an AUTOMATED WORKFLOW

**Claude MUST execute each phase sequentially. This is not a reference doc - it's a step-by-step process that ensures seamless session handoffs.**

---

## PHASE 1: SESSION DISCOVERY

### Step 1.1: Gather Session Context

**Execute these commands:**

```bash
# Check git status for changes
git status

# Check recent file modifications
git diff --name-only HEAD~5

# Check for existing handoffs
ls -la IBRAIN_STRATEGY/3-DELIVERY/handoffs/ 2>/dev/null || echo "No handoffs yet"
```

**Collect from conversation memory:**
- Session type: (Strategy/Coding/Audit/Testing/General)
- Approximate duration: (from conversation length)
- Files created this session
- Files modified this session
- Key accomplishments

---

## PHASE 2: FILE PLACEMENT VERIFICATION

### Step 2.1: Read Placement Rules

**Read**: `.claude/MASTER_GUIDE.md`

### Step 2.2: Verify All New Files

**For EACH new file created this session, verify against these rules:**

| File Type | Required Location |
|-----------|------------------|
| Strategy docs | `IBRAIN_STRATEGY/1-PRODUCT/strategy/` |
| Engine strategy | `IBRAIN_STRATEGY/1-PRODUCT/strategy/ENGINE_*.md` |
| User journeys | `IBRAIN_STRATEGY/1-PRODUCT/user-journeys/` |
| Architecture | `IBRAIN_STRATEGY/2-TECHNICAL/architecture/` |
| API specs | `IBRAIN_STRATEGY/2-TECHNICAL/api-specs/` |
| Data models | `IBRAIN_STRATEGY/2-TECHNICAL/data-models/` |
| Sprint plans | `IBRAIN_STRATEGY/3-DELIVERY/sprints/` |
| Handoffs | `IBRAIN_STRATEGY/3-DELIVERY/handoffs/` |
| Service impl | `IBRAIN_IMPLEMENTATION/1-SERVICES/{service}/` |
| Engine impl | `IBRAIN_IMPLEMENTATION/2-ENGINES/{engine}/` |
| Testing docs | `IBRAIN_IMPLEMENTATION/3-TESTING/` |
| SDK docs | `IBRAIN_IMPLEMENTATION/4-SDK/` |
| External docs | `External_App_Integration/` |
| Claude guides | `.claude/` |
| Slash commands | `.claude/commands/` |
| Legacy/Archive | `legacy/` |

**If ANY file is misplaced:**
1. Move it to correct location
2. Update any references
3. Log the move in handoff

### Step 2.3: Verify Document Headers

**Every new .md file MUST have this header:**

```markdown
# [Title]

**Version**: X.Y.Z
**Last Updated**: [Date]
**Status**: [Draft/Active/Deprecated]
**Parent**: [Link]
**Owner**: [Team/Person]

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
```

**Add missing headers before proceeding.**

---

## PHASE 3: UPDATE TRACKING DOCUMENTS

### Step 3.1: Update CHANGE_LOG.md

**Add new entry to `.claude/CHANGE_LOG.md`:**

```markdown
#### Session [N]: [Session Title]

**Type**: `[FEAT/FIX/DOCS/REFACTOR/TEST/INFRA/CONFIG]`
**Author**: Claude
**Session**: [Strategy/Coding/Audit/Testing/General]

**Changes Made**:

1. **[Category]**
   - [Change 1]
   - [Change 2]

**Files Created**: [N]
**Files Modified**: [N]
**Files Deleted**: [N]

**Reason**: [Why changes were made]

---
```

### Step 3.2: Update SESSION_LOG.md

**Add row to `.claude/SESSION_LOG.md`:**

```markdown
| [Date] | [Type] | [Duration] | [Token%] | [Quality/10] | [Key Outputs] | [Notes] |
```

### Step 3.3: Update DOCUMENT_REGISTRY.md

**If new documents were created, add to `IBRAIN_STRATEGY/1-PRODUCT/strategy/DOCUMENT_REGISTRY.md`:**

```markdown
| [Document Name] | [Version] | [Status] | [Location] |
```

---

## PHASE 3.5: README CHECKPOINT (IBRAIN_STRATEGY/*)

> **Purpose**: Update READMEs in IBRAIN_STRATEGY folders to track folder changes and maintain session seal integrity.

### Step 3.5.1: Identify Changed Folders

**Check which IBRAIN_STRATEGY folders had changes this session:**

```bash
# Get folders that had changes in IBRAIN_STRATEGY
git diff --name-only HEAD~10 | grep "^IBRAIN_STRATEGY/" | cut -d'/' -f1-2 | sort -u
```

### Step 3.5.2: Update Session Seal in Each Changed README

**For each folder that changed, update its README.md with:**

1. **Session Seal Block** (add/update at the end of the README, before "Related Documentation"):

```markdown
---

## Session Seal

| Field | Value |
|-------|-------|
| **Counter** | `[CODE][YYYYMMDDHHMMSS][NNNN]` |
| **Last Close** | [YYYY-MM-DD HH:MM] |
| **Summary** | [1-line description of this session's changes to this folder] |

### Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| [Date] | [1-line change description] | [Low/Medium/High] |

### Milestones

| Phase | Date | Achievement |
|-------|------|-------------|
| [Phase] | [Date] | [Milestone description] |
```

**Counter Encoding Rules:**
- Folder codes: `STR` (root), `PROD` (1-PRODUCT), `TECH` (2-TECHNICAL), `DEL` (3-DELIVERY)
- Timestamp: Current close time in `YYYYMMDDHHMMSS` format
- Sequence: Increment from previous counter (start at `0001`)
- Example: `PROD202512201845230001`

### Step 3.5.3: Manage Entry Rolling Window

**Rules for "Recent Changes" section:**
- Keep entries based on **contextual importance**, not count
- High-impact changes: Keep for 3+ sessions
- Medium-impact: Keep for 2 sessions
- Low-impact: Roll off after 1 session (unless part of a pattern)
- **Exception rule**: If a change explains a complex pattern, use 2-3 lines

**Rules for "Milestones" section:**
- Milestones are **permanent** (never removed)
- Only add milestones for significant achievements (phase completions, major features)
- Milestones are defined by phase gates in [MVG](../IBRAIN_STRATEGY/1-PRODUCT/strategy/MVG_MINIMUM_VIABLE_GOVERNANCE.md)

### Step 3.5.4: Verify Session Seal Consistency

**After updating all READMEs, verify:**
- All counters have same timestamp (within same close session)
- All counters have correct folder codes
- All "Last Close" dates match

---

## PHASE 4: CREATE HANDOFF DOCUMENT

### Step 4.1: Create Handoff File

**Create**: `IBRAIN_STRATEGY/3-DELIVERY/handoffs/[YYYY-MM-DD]_handoff.md`

Use this template:

```markdown
# Session Handoff - [YYYY-MM-DD]

**Version**: 1.0.0
**Last Updated**: [Date]
**Status**: Active
**Parent**: [../README.md](../README.md)
**Owner**: Claude

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | [Date] | BRAMHI_LABS_CONSULTANT | Session handoff |

---

## Session Summary

| Attribute | Value |
|-----------|-------|
| **Session Type** | [Type] |
| **Date** | [Full Date] |
| **Duration** | [Estimate] |
| **Quality** | [X/10] |
| **Status** | [Complete/In Progress/Blocked] |

---

## Accomplishments

### Completed
1. [Task 1 - DONE]
2. [Task 2 - DONE]

### Files Created
| File | Location | Purpose |
|------|----------|---------|
| [file.md] | [path] | [purpose] |

### Files Modified
| File | Changes |
|------|---------|
| [file.md] | [description] |

### Decisions Made
1. [Decision]: [Rationale]

---

## Current State

### Project Phase
- **Phase**: Phase 4 - Developer Experience
- **Sprint**: [Current sprint]
- **Blockers**: [None/List]

### Documentation
- **Active Docs**: [Count from DOCUMENT_REGISTRY]
- **New This Session**: [Count]
- **Updated**: [Count]

---

## Incomplete Work

| Task | Progress | Remaining | Priority |
|------|----------|-----------|----------|
| [Task] | [X%] | [Work left] | [P0/P1/P2] |

### Open Questions
1. [Question needing decision]

---

## CONTEXT FOR NEXT SESSION

### Restart Point

**When next session starts with `/init`, Claude should:**

1. **READ FIRST**: [Specific file to read]
2. **UNDERSTAND**: [Key context needed]
3. **START WITH**: [Exact first action]

### Priority Files
| Priority | File | Reason |
|----------|------|--------|
| 1 | [file] | [Why] |
| 2 | [file] | [Why] |

### Recommended Next Session

**Type**: [Recommended type]
**Focus**: [Specific focus]
**Duration**: [Estimate]

**Objectives**:
1. [Objective 1]
2. [Objective 2]

**Success Criteria**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

## Technical Context

[Any architecture notes, patterns, or dependencies for next session]

---

## Quality Assessment

**Session Quality**: [X/10]

| Criteria | Score |
|----------|-------|
| Objectives Met | [X/10] |
| Doc Quality | [X/10] |
| Handoff Clarity | [X/10] |

**Went Well**: [Positives]
**Improve**: [Areas for improvement]

---

## Related Documents

- [CHANGE_LOG.md](../../../.claude/CHANGE_LOG.md)
- [SESSION_LOG.md](../../../.claude/SESSION_LOG.md)
- [DOCUMENT_REGISTRY.md](../../1-PRODUCT/strategy/DOCUMENT_REGISTRY.md)

---

**Handoff Ready. Run `/init` to continue.**
```

---

## PHASE 5: FINAL VERIFICATION

### Step 5.1: Execute Checklist

**Claude MUST verify each item:**

```
FILE PLACEMENT
[ ] All new files in correct locations (per MASTER_GUIDE.md)
[ ] All new .md files have proper headers
[ ] No files in root that shouldn't be
[ ] No files in deprecated /docs folder

DOCUMENTATION
[ ] CHANGE_LOG.md updated with session entry
[ ] SESSION_LOG.md updated with session row
[ ] DOCUMENT_REGISTRY.md updated (if new docs created)
[ ] Handoff document created in 3-DELIVERY/handoffs/

README CHECKPOINT (NEW!)
[ ] All changed IBRAIN_STRATEGY/* folders have updated Session Seal
[ ] Session counters have consistent timestamp
[ ] "Last Close" dates match across all updated READMEs
[ ] Recent Changes entries reflect this session's work
[ ] Milestones added for any phase gate achievements

CROSS-REFERENCES
[ ] New docs linked from parent README
[ ] Internal links verified working
[ ] No broken references

CODE (if applicable)
[ ] No debug code left in
[ ] No hardcoded secrets
[ ] No orphaned TODOs without context
[ ] Tests pass (if modified)

GIT
[ ] All changes staged
[ ] Commit message prepared
[ ] Ready for commit
```

### Step 5.2: Fix Any Issues

**If any check fails:**
1. Fix the issue immediately
2. Document the fix in handoff
3. Re-verify the checklist

---

## PHASE 6: SESSION CLOSURE

### Step 6.1: Output Summary to User

```markdown
## Session Closed Successfully

| Metric | Value |
|--------|-------|
| **Session Type** | [Type] |
| **Duration** | [Estimate] |
| **Quality** | [X/10] |
| **Files Created** | [N] |
| **Files Modified** | [N] |

### Accomplished
- [Summary point 1]
- [Summary point 2]

### Handoff Created
`IBRAIN_STRATEGY/3-DELIVERY/handoffs/[DATE]_handoff.md`

### Next Session
- **Type**: [Recommended]
- **Focus**: [Focus area]
- **Start**: Run `/init`

---

**Session properly closed. All documentation updated.**
```

### Step 6.2: Git Commit (if requested)

```bash
git add .
git commit -m "docs(session): [Description]

- [Change 1]
- [Change 2]

Session: [Type] | Quality: [X/10]
Handoff: IBRAIN_STRATEGY/3-DELIVERY/handoffs/[DATE]_handoff.md

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## WORKFLOW DIAGRAM

```
/close
   │
   ├─► PHASE 1: Session Discovery
   │      └─► git status, gather context from memory
   │
   ├─► PHASE 2: File Placement Verification
   │      └─► Read MASTER_GUIDE.md rules
   │      └─► Verify each new file location
   │      └─► Fix misplacements
   │      └─► Verify document headers
   │
   ├─► PHASE 3: Update Tracking Docs
   │      └─► Add entry to CHANGE_LOG.md
   │      └─► Add row to SESSION_LOG.md
   │      └─► Update DOCUMENT_REGISTRY.md
   │
   ├─► PHASE 3.5: README Checkpoint (NEW!)
   │      └─► Identify changed IBRAIN_STRATEGY/* folders
   │      └─► Update Session Seal in each README
   │      └─► Manage Recent Changes rolling window
   │      └─► Add Milestones for phase achievements
   │      └─► Verify counter consistency
   │
   ├─► PHASE 4: Create Handoff
   │      └─► Create 3-DELIVERY/handoffs/[DATE]_handoff.md
   │      └─► Include full context for next session
   │      └─► Define exact restart point
   │
   ├─► PHASE 5: Final Verification
   │      └─► Execute checklist (now includes README checkpoint)
   │      └─► Fix any issues found
   │
   └─► PHASE 6: Close Session
          └─► Output summary to user
          └─► Git commit (if requested)
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

## KEY PRINCIPLES

1. **Execute, don't reference** - This workflow must be followed step by step
2. **Update real files** - Actually modify CHANGE_LOG.md, SESSION_LOG.md, etc.
3. **Handoff is critical** - The handoff doc preserves context between sessions
4. **Quality minimum: 8/10** - Document why if below 8
5. **Enable /init** - The /init command reads handoffs to restore context
6. **No orphaned work** - Every task should have clear next steps

---

## QUICK REFERENCE: Session Close Steps

1. Gather session context (git status + memory)
2. Verify file placements (MASTER_GUIDE.md)
3. Verify document headers
4. Update CHANGE_LOG.md
5. Update SESSION_LOG.md
6. Update DOCUMENT_REGISTRY.md (if new docs)
7. **Update Session Seals in IBRAIN_STRATEGY/* READMEs** (NEW!)
8. Create handoff in 3-DELIVERY/handoffs/
9. Run final verification checklist (includes README checkpoint)
10. Output summary to user
11. Git commit (if requested)

---

**This command ensures clean session transitions and full context preservation.**
