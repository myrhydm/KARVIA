# Session Seal Template

Use this template to add Session Seal blocks to README.md files.

---

## Where to Add

Add the Session Seal section **at the end of the README**, just before "Related Documentation".

---

## Full Session Seal Block

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

---
```

---

## Counter Encoding Rules

### Format

```
[FOLDER_CODE][TIMESTAMP][SEQUENCE]
```

### Folder Codes

| Folder | Code | Example |
|--------|------|---------|
| IBRAIN_STRATEGY/ (root) | `STR` | STR202512201830000001 |
| 1-PRODUCT/ | `PROD` | PROD202512201830000001 |
| 2-TECHNICAL/ | `TECH` | TECH202512201830000001 |
| 3-DELIVERY/ | `DEL` | DEL202512201830000001 |
| .claude/ | `CLAUDE` | CLAUDE202512201830000001 |
| strategy/00-constitutional/ | `CONST` | CONST202512201830000001 |
| strategy/01-authoritative/ | `AUTH` | AUTH202512201830000001 |
| strategy/02-master/ | `MSTR` | MSTR202512201830000001 |
| strategy/03-engines/ | `ENG` | ENG202512201830000001 |
| strategy/04-vision/ | `VIS` | VIS202512201830000001 |
| strategy/05-governance/ | `GOV` | GOV202512201830000001 |

### Timestamp Format

`YYYYMMDDHHMMSS` - Current close time

Example: `202512201830` = 2025-12-20 18:30

### Sequence

4-digit number, incrementing from previous counter.
Start at `0001` for new folders.

---

## Impact Levels

| Level | Description | Keep Duration |
|-------|-------------|---------------|
| **High** | Major structural changes, new docs, breaking changes | 3+ sessions |
| **Medium** | Content updates, new sections | 2 sessions |
| **Low** | Typos, formatting, minor updates | 1 session |

---

## Rolling Window Rules

### Recent Changes Section

- Keep entries based on **contextual importance**, not count
- High-impact changes: Keep for 3+ sessions
- Medium-impact: Keep for 2 sessions
- Low-impact: Roll off after 1 session
- **Exception**: If a change explains a complex pattern, keep longer

### Milestones Section

- Milestones are **permanent** (never removed)
- Only add for significant achievements:
  - Phase gate completions
  - Major features
  - Architectural changes
  - Version milestones

---

## Example: New Folder

```markdown
## Session Seal

| Field | Value |
|-------|-------|
| **Counter** | `ENG202512201830000001` |
| **Last Close** | 2025-12-20 18:30 |
| **Summary** | Initial folder creation; 7 engine docs organized |

### Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| Dec 20, 2025 | Folder created, 7 docs moved here | High |

### Milestones

| Phase | Date | Achievement |
|-------|------|-------------|
| Pre-MVP | Dec 20, 2025 | Engine strategy folder established |
```

---

## Example: Subsequent Update

```markdown
## Session Seal

| Field | Value |
|-------|-------|
| **Counter** | `ENG202512211430000002` |
| **Last Close** | 2025-12-21 14:30 |
| **Summary** | Updated ENGINE_IAM_STRATEGY with auth flow details |

### Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| Dec 21, 2025 | Updated ENGINE_IAM_STRATEGY auth flow | Medium |
| Dec 20, 2025 | Folder created, 7 docs moved here | High |

### Milestones

| Phase | Date | Achievement |
|-------|------|-------------|
| Pre-MVP | Dec 20, 2025 | Engine strategy folder established |
```

---

## Verification Checklist

During `/close`, verify:

- [ ] Counter uses correct folder code
- [ ] Timestamp matches close time
- [ ] Sequence increments from previous
- [ ] Summary accurately describes changes
- [ ] Recent Changes entries are current
- [ ] Impact levels are appropriate
- [ ] Old low-impact entries rolled off
- [ ] Milestones only for significant achievements

---

**Use this template when adding or updating Session Seals in README files.**
