# Command Template

**Use For**: Claude slash commands in .claude/commands/

---

## Template

```markdown
# [Command Name] Session Initialization

**Version**: 1.0.0
**Last Updated**: [DATE]
**Status**: Active
**Session Type**: [SESSION_TYPE]
**Access Profile**: [PROFILE] (from ACCESS_CONTROL.yaml)
**Token Budget**: [RANGE] ([PERCENTAGE])
**Purpose**: [Brief description]

---

## TIERED CONTEXT LOADING

### Step 1: ALWAYS Load (Constitutional + Governance)

```
READ:DEEP -> IBRAIN_STRATEGY/1-PRODUCT/strategy/00-constitutional/
           |__ MVG_MINIMUM_VIABLE_GOVERNANCE.md (T1 - Supreme Authority)

READ:SKIM -> IBRAIN_STRATEGY/1-PRODUCT/strategy/05-governance/
           |__ [Relevant governance docs]
```

**Why**: [Reason for always loading these docs]

### Step 2: Load Based on [Session Type] Type

**Select your [session] type** (then load the corresponding documents):

#### Type A: [Subtype A]
```
READ:DEEP  -> [path/to/doc1.md]
READ:SKIM  -> [path/to/doc2.md]
READ:REF   -> [path/to/doc3.md]
SKIP       -> [folders to skip]
```

#### Type B: [Subtype B]
```
READ:DEEP  -> [path/to/doc1.md]
READ:SKIM  -> [path/to/doc2.md]
READ:REF   -> [path/to/doc3.md]
SKIP       -> [folders to skip]
```

---

## CONTEXT LOADING MATRIX

| [Subtype] | 00-const | 01-auth | 02-master | [other] | Code Ref |
|-----------|----------|---------|-----------|---------|----------|
| [Type A] | DEEP | [X] | [X] | [X] | [ref] |
| [Type B] | DEEP | [X] | [X] | [X] | [ref] |

**Legend**: DEEP = Full read | SKIM = Headers + key sections | SKIP = Don't load | REF = Reference only

---

## ACCESS CONTROL PROFILE: [PROFILE]

From `.claude/ACCESS_CONTROL.yaml`:

```yaml
[PROFILE]:
  can_read: ["DOC-*"]
  can_write: ["DOC-TX-*", "DOC-TY-*"]
  cannot_write: ["DOC-TZ-*"]
  notes: "[Profile description]"
```

**Restrictions**:
- [Restriction 1]
- [Restriction 2]

---

## [Session Type] Scope

**What are you [doing]?** (Select scope):

- [ ] **[Option 1]** - [Description]
- [ ] **[Option 2]** - [Description]
- [ ] **[Option 3]** - [Description]

**Files/Areas to [Work On]**:
1. [item 1]
2. [item 2]
3. [item 3]

---

## [Main Section 1]

[Content specific to this command type]

---

## [Main Section 2]

[Content specific to this command type]

---

## [Checklists/Workflows]

```
[Workflow Name]:
[ ] Step 1
[ ] Step 2
[ ] Step 3
```

---

## Quality Standards

| Rating | Quality Level |
|--------|---------------|
| 10 | [Description] |
| 9 | [Description] |
| 8 | [MINIMUM TARGET] |
| 7 | [Description] |
| <= 6 | [Description] |

**My Rating**: [X/10]

---

## Success Criteria

This [session type] session is successful when:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] Session rating >= 8/10

---

**NOW BEGIN [SESSION TYPE]**

[Closing instruction/motivation]
```

---

## Command File Rules

### Required Sections

Every command file must have:
1. **Header** with version, date, status, purpose
2. **Tiered Context Loading** section
3. **Access Control Profile** reference
4. **Scope Selection** options
5. **Success Criteria** checklist
6. **Quality Rating** scale

### Version Management

- Start at 1.0.0
- Minor updates: 1.0.0 -> 1.1.0
- Major restructures: 1.0.0 -> 2.0.0
- Track in .claude/DOCUMENT_REGISTRY.md

### Consistency

All commands should:
- Use same tiered loading format
- Reference ACCESS_CONTROL.yaml
- Have quality rating scale
- Include success criteria
- End with action prompt

---

## Access Profiles Reference

| Profile | Write Access | Primary Use |
|---------|--------------|-------------|
| STRATEGY | T2, T3, T4 | Planning, specs |
| CODING | T3, T4 | Implementation |
| AUDIT | T4 only | Review, health |
| TESTING | T3-TST, T4 | Test docs |
| GENERAL | T4 only | Research, questions |

---

**Template Version**: 1.0.0
**Last Updated**: December 21, 2025
