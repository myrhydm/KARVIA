# Best Practices for Claude Code Sessions

**Version**: 1.1.0
**Last Updated**: December 20, 2025
**Status**: Active
**Purpose**: Essential patterns for high-quality, productive interactions

---

## Core Philosophy

**Every session should be**:
- **Purposeful** - Clear objectives from the start
- **Measurable** - Track metrics and quality
- **Documented** - Knowledge captured for future
- **Efficient** - Optimal use of token budget
- **High-Quality** - Meet or exceed standards (>= 8/10)

**Remember**: It's better to complete 1 task perfectly than 3 tasks poorly.

---

## Session Lifecycle Best Practices

### 1. Starting Sessions

#### DO:
```
- Use /init command to load context
- Identify session type before starting (Strategy/Coding/Audit/Testing/General)
- Use session-specific slash command (/strategy, /coding, etc.)
- Read session log and handoff documents first
- Set clear, measurable objectives
- Define success criteria upfront
- Check token budget for session type
```

#### DON'T:
```
- Start without reading session log
- Mix session types (strategy + coding in one session)
- Skip loading context from handoff documents
- Work without clear objectives
- Guess at what needs to be done
```

**Example - Good Start**:
```markdown
Used /init to review current state
Session Type: CODING
Task: Implement JavaScript SDK for iBrain API
Token Budget: 80-120K
Success Criteria:
- [ ] SDK handles authentication
- [ ] All 29 API endpoints wrapped
- [ ] TypeScript definitions included
```

---

### 2. During Sessions

#### Strategy Sessions:
```
- Create comprehensive documentation
- Break tasks into specific, actionable items
- Identify dependencies and risks
- Stay within 40-60K token budget (20-30%)
```

#### Coding Sessions:
```
- Check ALL security gates (XSS, injection, auth, secrets)
- Check ALL architecture gates (RESTful, error handling, patterns)
- Update handoff document continuously
- Create session break notes at 120K tokens (60%)
- Test functionality before marking complete
- Aim for 80-120K token usage (40-60%)
```

#### Audit Sessions:
```
- Review code systematically using checklists
- Rate every issue by severity (Critical/High/Medium/Low)
- Provide specific fix instructions with code examples
- Create comprehensive audit report
- Use 50-70K tokens (25-35%)
```

#### Testing Sessions:
```
- Execute planned test cases methodically
- Document every test result (PASS/FAIL/SKIPPED)
- Provide exact reproduction steps for bugs
- Create test execution report
- Use 40-60K tokens (20-30%)
```

---

### 3. Closing Sessions

#### DO:
```
- Use /close command for proper closure
- Update session log with entry
- Create session break notes if >60% tokens used
- Rate session quality (1-10)
- Commit code with proper message format
- Identify next session type and objectives
```

#### DON'T:
```
- End session without updating documentation
- Skip session rating
- Leave work uncommitted
- Forget to plan next session
```

---

## Security Best Practices

### iBrain-Specific Security Gates

```javascript
// Multi-Tenant Isolation - ALWAYS filter by business context
const data = await Model.find({
  business_id: req.user.business_id,  // ALWAYS include
  ...otherFilters
});

// JWT Validation - All protected routes
router.post('/endpoint',
  authenticateToken,  // Verify JWT
  requireRole('ADMIN', 'DEVELOPER'),  // Check role
  async (req, res) => { ... }
);

// No Hardcoded Secrets
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET not configured');
}

// Input Validation
const schema = Joi.object({
  name: Joi.string().required().max(255),
  email: Joi.string().email().required()
});
```

### Security Checklist (Every Coding Session)

```
[ ] All user input validated before processing
[ ] All database queries filter by business context
[ ] All protected routes have authenticateToken
[ ] Role-restricted routes have requireRole
[ ] No secrets hardcoded in code
[ ] Environment variables used for sensitive config
[ ] Rate limiting on sensitive endpoints
```

---

## Architecture Best Practices

### iBrain Service Patterns

```javascript
// RESTful API Design
GET    /api/assessments/:id          // Get single assessment
GET    /api/assessments              // List assessments
POST   /api/assessments              // Create assessment
PUT    /api/assessments/:id          // Update assessment
DELETE /api/assessments/:id          // Delete assessment

// Consistent Error Handling
router.post('/resource', async (req, res) => {
  try {
    // Validation
    if (!req.body.required_field) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field'
      });
    }

    // Business logic
    const result = await service.create(req.body);

    // Success response
    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

### Cross-Service Communication

```javascript
// Gateway proxying to services
const response = await axios.get(
  `${INTELLIGENCE_URL}/api/archetypes/${userId}`,
  { headers: { Authorization: req.headers.authorization } }
);
```

---

## Token Management Best Practices

### Token Budget Allocation

```
Strategy Session: 40-60K (20-30%)
- Reading docs, creating plans

Coding Session: 80-120K (40-60%)
- File reads, writes, testing, documentation

Audit Session: 50-70K (25-35%)
- Code review, issue identification

Testing Session: 40-60K (20-30%)
- Test execution, bug documentation

General Session: 20-40K (10-20%)
- Quick questions, research
```

### Token Checkpoints

```
At 30% (60K):
[ ] Review progress against objectives
[ ] Ensure on track to complete in budget

At 60% (120K):
[ ] CREATE SESSION_BREAK_NOTES immediately
[ ] Document exact restart point
[ ] List remaining work

At 75% (150K):
[ ] Plan to wrap up current task
[ ] No new features or files

At 90% (180K):
[ ] Begin session closure process
[ ] Update all documentation
```

---

## Quality Rating Guidelines

```
10 = Exceptional
   - Production-ready code
   - Zero security issues
   - All patterns followed
   - Comprehensive error handling
   - Well documented

9 = Excellent
   - High quality code
   - Minor improvements possible
   - All major patterns followed

8 = Good (Minimum Target)
   - Meets all quality gates
   - Follows established patterns
   - Proper error handling
   - Basic documentation present

7 = Acceptable
   - Works but needs refinement
   - Some patterns inconsistent

<= 6 = Below Standard
   - Requires significant rework
```

---

## Common Anti-Patterns to Avoid

### 1. The "I'll Fix It Later" Anti-Pattern
```
WRONG: "I'll add error handling later"
CORRECT: Implement security, error handling AS YOU CODE
```

### 2. The "Mixed Session" Anti-Pattern
```
WRONG: Starting as strategy, switching to coding, then audit
CORRECT: One session = one type with clear boundaries
```

### 3. The "Token Wastage" Anti-Pattern
```
WRONG: Reading entire files when only need small section
CORRECT: Read specific line ranges, stay focused
```

### 4. The "Undocumented Decision" Anti-Pattern
```
WRONG: Making architecture decisions without documenting
CORRECT: Document every decision with rationale
```

---

## iBrain-Specific Patterns

### Working with Engines

```javascript
// Engine communication pattern
const engineResponse = await axios.post(
  `${ENGINE_BASE_URL}/api/endpoint`,
  payload,
  {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30000
  }
);

// Mock fallback when engine unavailable
if (!engineResponse || engineResponse.status !== 200) {
  return getMockData(payload);
}
```

### Assessment Flow

```javascript
// Standard assessment flow
1. User initiates assessment
2. Gateway routes to Assessment Engine
3. Assessment Engine processes
4. Results stored and returned
5. Analytics updated
```

---

## Project Setup Best Practices

### Starting a New Project

Use `/setup` command to scaffold documentation structure:

```
/setup
   │
   ├─► Creates tiered folder structure (00-constitutional → 05-governance)
   ├─► Generates governance documents (MVG, Document Genome)
   ├─► Creates README templates with Session Seals
   └─► Configures project.yaml for governance settings
```

### Scaffold Modes

| Mode | Use When | Creates |
|------|----------|---------|
| **Full** | New projects, complex domains | 6 tiers + MVG + all templates |
| **Minimal** | Quick start, small projects | 3 folders + basic READMEs |

### Portable .claude Folder

The `.claude/` folder is designed to be portable across codebases:

**Universal (Copy As-Is)**:
```
.claude/
├── commands/           # All command workflows
├── templates/          # Document templates
├── README.md           # Claude orientation
├── MASTER_GUIDE.md     # File placement rules
└── BEST_PRACTICES.md   # This file
```

**Project-Specific (Regenerate)**:
```
.claude/
├── SESSION_LOG.md      # Start fresh per project
├── CHANGE_LOG.md       # Start fresh per project
├── project.yaml        # Configure per project
└── DOCUMENT_REGISTRY.md # Track per project
```

### To Port to Another Project

1. Copy `.claude/` folder to new project root
2. Delete: `SESSION_LOG.md`, `CHANGE_LOG.md`, `project.yaml`
3. Run `/setup` to scaffold for new project
4. Customize governance documents

---

## Document Governance Best Practices

### Document Tiers

Follow the authority hierarchy:

```
T1: CONSTITUTIONAL (MVG) - Supreme authority
 │
 ├── T2: CANONICAL - Single source of truth per domain
 │
 ├── T3: DERIVED - Must align with T2
 │
 └── T4: WORKING - Drafts, may be incomplete
```

### Session Seals

Every README in strategy folders MUST have a Session Seal:

```markdown
## Session Seal

| Field | Value |
|-------|-------|
| **Counter** | `[CODE][TIMESTAMP][SEQ]` |
| **Last Close** | [DATE] |
| **Summary** | [1-line changes] |
```

### Document Genome

Strategy documents SHOULD have a Document Genome:

```markdown
## Document Genome

> **Quick Genome**: `[CLASS] | [TIER] | [DOMAIN] | [LIFECYCLE] | [FRESHNESS] | R:[X]% | [DIRECTIVE]`
```

### Document IDs & Access Control

Documents can be assigned unique IDs for access control:

```
Format: DOC-[TIER]-[DOMAIN]-[SEQ]
Example: DOC-T2-ENG-001
```

**Domains**: GOV, SEC, ENG, API, PRD, ARC, VIS, RUN, TST, DOC

Access rules are defined in `.claude/ACCESS_CONTROL.yaml` (Admin only):
- **Tier-level**: T1 (no write), T2 (strategy), T3 (all), T4 (all)
- **Domain-level**: GOV/SEC restricted to admin
- **Document-level**: Specific overrides as needed

> **Note**: Enforcement is currently advisory. See ACCESS_CONTROL.yaml for full schema.

### Audit .claude Folder

Run `/audit` with `.claude` scope periodically:

- Verify command versions are current
- Check template accuracy
- Ensure DOCUMENT_REGISTRY is up to date
- Validate project.yaml settings

---

## Quick Reference

**Essential Commands**:
- `/init` - Load context and start session
- `/setup` - Scaffold project documentation structure
- `/strategy` - Start strategy session
- `/coding` - Start coding session
- `/audit` - Start audit session
- `/testing` - Start testing session
- `/general` - Start general session
- `/close` - Close current session

**Essential Files**:
- `.claude/SESSION_LOG.md` - Session history
- `.claude/BEST_PRACTICES.md` - This file
- `.claude/project.yaml` - Project configuration
- `.claude/ACCESS_CONTROL.yaml` - Central access control (Admin only)
- `.claude/DOCUMENT_REGISTRY.md` - .claude doc tracking
- `POST_MIGRATION_IMPLEMENTATION_MASTER_LIST.md` - Roadmap
- `GETTING_STARTED.md` - Setup guide

**Target Metrics**:
- Quality Rating: >= 8/10 average
- Security Gates: 100% compliance
- Documentation Coverage: 100%
- Critical Bugs: 0 in production

---

**Remember**: These best practices exist to make every session productive, measurable, and high-quality. Follow them consistently for optimal results.
