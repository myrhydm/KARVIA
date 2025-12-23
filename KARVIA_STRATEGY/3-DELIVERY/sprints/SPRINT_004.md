# Sprint 4: iBrain Integration - Interactive Intelligence

**Version**: 1.0.0
**Sprint Duration**: 2 weeks
**Start Date**: TBD (after Sprint 3)
**Status**: Draft (T4)
**Theme**: Transform KARVIA into an interactive, AI-powered personal development companion

---

## Sprint Goal

Connect KARVIA to iBrain's IQaaS platform to provide users with real-time intelligence scoring, AI-powered nudges, and personalized guidance - making KARVIA truly interactive.

---

## Context: Why iBrain Integration?

| Current State | With iBrain |
|---------------|-------------|
| Static goal tracking | Dynamic dimension scoring |
| Manual progress review | AI-powered nudges |
| Generic recommendations | Personalized action plans |
| Isolated app | Universal identity ecosystem |
| Basic analytics | Trend analysis & benchmarks |

---

## Sprint Backlog

### Foundation Items

| ID | Type | Story | Priority | Estimate | Status |
|----|------|-------|----------|----------|--------|
| B043 | Integration | Create iBrain SDK client for KARVIA | P0 | 2d | To Do |
| B044 | Integration | Implement user identity registration with iBrain | P0 | 1.5d | To Do |
| B045 | Feature | Build consent management UI | P0 | 1d | To Do |
| B046 | Feature | Create 5 PM Dimension Dashboard component | P0 | 2d | To Do |
| B047 | Feature | Display Passion & Engagement scores | P1 | 1d | To Do |
| B048 | Integration | Send assessments to iBrain pipeline | P1 | 1.5d | To Do |
| B049 | Feature | Implement nudge display system | P1 | 2d | To Do |
| B050 | Integration | Set up webhook handler for iBrain events | P1 | 1d | To Do |
| B051 | Quality | Add score caching layer | P2 | 0.5d | To Do |
| B052 | Testing | Integration tests for iBrain flows | P1 | 1d | To Do |

---

## Story Details

### B043: iBrain SDK Client

**Description**: Create a reusable SDK client for communicating with iBrain APIs.

**Location**: `server/services/ibrainClient.js` (new)

**API Endpoints to Support**:
```javascript
// Identity
POST /identity/user/register
GET  /identity/lookup

// Scores
GET  /scores/dimensions/{user_id}
GET  /scores/passion/{user_id}
GET  /scores/engagement/{user_id}

// Assessment
POST /ingest/assessment
GET  /assessment/status/{batch_id}

// Intelligence
GET  /intelligence/nudges/{user_id}
GET  /intelligence/action-plan/{user_id}
```

**Acceptance Criteria**:
- [ ] SDK handles authentication (ka_ API key)
- [ ] Request/response typing
- [ ] Error handling with retries
- [ ] Rate limiting awareness
- [ ] Configurable base URL (dev/prod)
- [ ] Request logging

**Technical Notes**:
```javascript
// Example usage
const ibrain = require('./services/ibrainClient');

// Register user
const identity = await ibrain.identity.register({
  source_app: 'karvia',
  external_user_id: user._id,
  email: user.email,
  consent: { assessment_data: true, behavioral_tracking: true }
});

// Get dimension scores
const scores = await ibrain.scores.getDimensions(identity.ibrain_user_id);
```

---

### B044: User Identity Registration

**Description**: Register KARVIA users with iBrain during onboarding.

**Flow**:
```
User completes Vision Questionnaire
         │
         ▼
Check if user has iBrain ID
         │
    ┌────┴────┐
    │ No      │ Yes
    ▼         ▼
Register     Skip
with iBrain
         │
         ▼
Store iBrain ID in User model
         │
         ▼
Continue to dashboard
```

**Acceptance Criteria**:
- [ ] Add `ibrainUserId` field to User model
- [ ] Register new users automatically after vision questionnaire
- [ ] Handle existing users (batch registration script)
- [ ] Lookup before registration to prevent duplicates
- [ ] Store consent preferences

**User Model Update**:
```javascript
// server/models/User.js - Add fields
ibrainUserId: { type: String, index: true },
ibrainConsent: {
  assessmentData: { type: Boolean, default: false },
  behavioralTracking: { type: Boolean, default: false },
  consentedAt: Date,
  consentVersion: String
}
```

---

### B045: Consent Management UI

**Description**: Let users view and manage their iBrain data sharing preferences.

**Location**: `client/user_profile.html` (update), new consent component

**UI Design**:
```
┌──────────────────────────────────────────────────┐
│  🔐 Data & Privacy Settings                      │
├──────────────────────────────────────────────────┤
│                                                   │
│  iBrain Intelligence                              │
│  ────────────────────                            │
│  We use iBrain to provide personalized insights.  │
│                                                   │
│  ☑ Share assessment responses                     │
│    Enables dimension scoring                      │
│                                                   │
│  ☑ Share activity data                            │
│    Enables engagement tracking                   │
│                                                   │
│  ☐ Share with connected apps                      │
│    Cross-app insights (e.g., Prodify)            │
│                                                   │
│  ┌──────────────┐                                │
│  │ Save Changes │                                │
│  └──────────────┘                                │
│                                                   │
│  Learn more about how we use your data →         │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Acceptance Criteria**:
- [ ] Consent toggles in user profile
- [ ] Consent recorded before iBrain calls
- [ ] Ability to revoke consent
- [ ] Consent change audit trail
- [ ] Link to privacy policy

---

### B046: 5 PM Dimension Dashboard

**Description**: Visual display of user's dimension scores from iBrain.

**Location**: `client/home.html` (update), new component `client/pages/scripts/dimensions.js`

**UI Design**:
```
┌──────────────────────────────────────────────────┐
│  📊 Your Success Dimensions                      │
├──────────────────────────────────────────────────┤
│                                                   │
│  🔍 Clarity         ████████░░  72%  ↑ +5       │
│     Goal definition and path clarity             │
│                                                   │
│  🔥 Commitment      ██████░░░░  65%  →          │
│     Consistency and follow-through               │
│                                                   │
│  🌱 Adaptability    █████████░  80%  ↑ +8       │
│     Openness to learn and adapt                  │
│                                                   │
│  🧠 Competency      █████░░░░░  55%  → ⚠️       │
│     Skills and knowledge mastery                 │
│                                                   │
│  📈 Opportunity     ██████░░░░  60%  ↓ -3       │
│     Growth awareness and seeking                 │
│                                                   │
│  ───────────────────────────────────────         │
│  Overall: 66.4  |  Updated: 2 hours ago          │
│                                                   │
│  ┌─────────────────┐                             │
│  │ View Full Report│                             │
│  └─────────────────┘                             │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Acceptance Criteria**:
- [ ] Fetch scores from iBrain via server proxy
- [ ] Display all 5 dimensions with progress bars
- [ ] Show trend indicators (↑ ↓ →)
- [ ] Highlight concerning dimensions (⚠️)
- [ ] Click to expand for details
- [ ] Loading state while fetching
- [ ] Graceful fallback if iBrain unavailable

**API Endpoint** (KARVIA server):
```
GET /api/scores/dimensions
Authorization: Bearer {jwt}

Response:
{
  "dimensions": {
    "clarity": { "score": 72, "trend": "improving", "change": 5 },
    "commitment": { "score": 65, "trend": "stable", "change": 0 },
    ...
  },
  "overall": 66.4,
  "lastUpdated": "2025-12-22T10:00:00Z"
}
```

---

### B047: Passion & Engagement Display

**Description**: Show real-time passion and engagement meters.

**Location**: Header component or dashboard

**UI Design**:
```
┌───────────────────────────────────────────┐
│  🔥 78%  Passion    📊 85%  Engagement   │
└───────────────────────────────────────────┘
```

**Acceptance Criteria**:
- [ ] Compact display in header
- [ ] Fetch from iBrain Passion/Engagement endpoints
- [ ] Tooltip with description on hover
- [ ] Animation when score changes
- [ ] Cache scores for 5 minutes

---

### B048: Assessment Pipeline Integration

**Description**: Send KARVIA assessments to iBrain for analysis.

**Assessments to Integrate**:
1. Vision Questionnaire → iBrain Assessment API
2. PM Assessment → iBrain Assessment API

**Flow**:
```
User completes Vision Questionnaire
         │
         ▼
Format responses for iBrain
         │
         ▼
POST /ingest/assessment
         │
         ▼
Receive batch_id
         │
         ▼
Poll for completion (or webhook)
         │
         ▼
Scores updated automatically
```

**Acceptance Criteria**:
- [ ] Transform KARVIA assessment format to iBrain format
- [ ] Send to iBrain after questionnaire completion
- [ ] Track batch status
- [ ] Handle qualitative responses (send for LLM analysis)
- [ ] Error handling and retry

**Assessment Mapping**:
```javascript
// KARVIA Vision Question → iBrain Assessment
{
  source_app: 'karvia',
  ibrain_user_id: user.ibrainUserId,
  assessment_type: 'vision_questionnaire',
  responses: [
    {
      question_id: 'learning_style',
      dimension: 'adaptability',
      response_type: 'quantitative',
      value: user.visionProfile.learningStyle
    },
    {
      question_id: 'dream_statement',
      dimension: 'clarity',
      response_type: 'qualitative',
      value: user.dreamText
    }
  ]
}
```

---

### B049: Nudge Display System

**Description**: Show AI-powered nudges from iBrain.

**Location**: New component, toast system

**UI Design**:
```
┌──────────────────────────────────────────────────┐
│  💡 Nudge from KARVIA                        ✕   │
├──────────────────────────────────────────────────┤
│                                                   │
│  Your Clarity score could use some attention.     │
│                                                   │
│  Consider reviewing and refining your main goal   │
│  this week. Clear goals lead to better outcomes!  │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐               │
│  │ Review Goals│  │ Remind Later │               │
│  └─────────────┘  └──────────────┘               │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Acceptance Criteria**:
- [ ] Fetch active nudges on page load
- [ ] Display as toast/modal
- [ ] Action buttons (configurable per nudge)
- [ ] Dismiss functionality
- [ ] Nudge history in settings
- [ ] Max 1 nudge per session (configurable)

**API Endpoint** (KARVIA server):
```
GET /api/intelligence/nudges
Authorization: Bearer {jwt}

Response:
{
  "nudges": [
    {
      "id": "NUDGE-001",
      "trigger": "clarity_below_70",
      "priority": "medium",
      "message": "Your Clarity score could use some attention...",
      "actions": [
        { "label": "Review Goals", "url": "/goals" },
        { "label": "Remind Later", "action": "dismiss" }
      ],
      "expiresAt": "2025-12-29T00:00:00Z"
    }
  ]
}
```

---

### B050: Webhook Handler

**Description**: Receive real-time events from iBrain.

**Location**: `server/routes/webhooks.js` (new)

**Events to Handle**:
| Event | Action |
|-------|--------|
| `assessment.completed` | Update local score cache, notify user |
| `score.updated` | Invalidate cache |
| `score.alert` | Create notification |
| `nudge.triggered` | Store for next session |

**Acceptance Criteria**:
- [ ] POST /api/webhooks/ibrain endpoint
- [ ] HMAC signature verification
- [ ] Event type routing
- [ ] Idempotency (prevent duplicate processing)
- [ ] Logging for debugging
- [ ] 200 response within 5 seconds

**Security**:
```javascript
// Verify HMAC signature
const crypto = require('crypto');

function verifyIBrainWebhook(req) {
  const signature = req.headers['x-ibrain-signature'];
  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', process.env.IBRAIN_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature === expected;
}
```

---

### B051: Score Caching Layer

**Description**: Cache iBrain scores to reduce API calls.

**Strategy**:
- Cache scores for 5 minutes
- Invalidate on webhook events
- Background refresh option

**Acceptance Criteria**:
- [ ] In-memory cache (or Redis if available)
- [ ] TTL configuration
- [ ] Cache invalidation on webhooks
- [ ] Fallback to cache if iBrain unavailable

---

### B052: Integration Tests

**Description**: Test the complete iBrain integration flow.

**Test Scenarios**:
1. User registration → iBrain identity created
2. Assessment submission → Scores updated
3. Dimension fetch → Correct display
4. Nudge fetch → Toast displayed
5. Webhook received → Cache invalidated

**Acceptance Criteria**:
- [ ] Mock iBrain API for tests
- [ ] Test all happy paths
- [ ] Test error scenarios
- [ ] Test webhook signature verification

---

## Environment Variables (New)

```bash
# iBrain Integration
IBRAIN_API_URL=https://api.ibrain.io/v1
IBRAIN_API_KEY=ka_live_xxxxxxxxxxxxx
IBRAIN_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
IBRAIN_ENABLED=true  # Feature flag
```

---

## New API Routes (KARVIA Server)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scores/dimensions` | Proxy to iBrain dimensions |
| GET | `/api/scores/passion` | Proxy to iBrain passion |
| GET | `/api/scores/engagement` | Proxy to iBrain engagement |
| GET | `/api/intelligence/nudges` | Proxy to iBrain nudges |
| POST | `/api/webhooks/ibrain` | Webhook handler |
| PUT | `/api/users/consent` | Update iBrain consent |

---

## New Files

| File | Purpose |
|------|---------|
| `server/services/ibrainClient.js` | iBrain API SDK |
| `server/routes/ibrainScores.js` | Score proxy routes |
| `server/routes/webhooks.js` | Webhook handlers |
| `server/middleware/ibrainAuth.js` | Webhook verification |
| `client/pages/scripts/dimensions.js` | Dimension dashboard |
| `client/pages/scripts/nudges.js` | Nudge display system |
| `client/components/dimension-card.html` | Dimension UI component |
| `client/components/nudge-toast.html` | Nudge toast component |

---

## Sprint Metrics

| Metric | Target |
|--------|--------|
| Story Points | ~14 days effort |
| iBrain API Integration | 100% of planned endpoints |
| Test Coverage | 80% for new code |
| User-facing Features | 4 (dimensions, passion, engagement, nudges) |

---

## Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| iBrain API key (ka_ prefix) | iBrain Team | Pending |
| Webhook endpoint registered | iBrain Team | Pending |
| iBrain Gateway accessible | iBrain Team | Pending |
| KARVIA user consent flow | KARVIA Team | Sprint 4 |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| iBrain API not ready | Medium | High | Feature flag, mock mode |
| Rate limiting issues | Low | Medium | Caching, exponential backoff |
| Webhook delivery failures | Medium | Low | Manual sync fallback |
| User consent refusal | Low | Medium | Graceful degradation |

---

## Definition of Done

- [ ] iBrain SDK implemented and tested
- [ ] Users can register with iBrain
- [ ] Dimension dashboard displays scores
- [ ] Nudges appear when triggered
- [ ] Webhooks processed correctly
- [ ] Consent management working
- [ ] Integration tests passing
- [ ] Feature flag tested (enable/disable)

---

## Post-Sprint: Phase 2 Items

After Sprint 4, consider for Sprint 5:

| ID | Feature | Description |
|----|---------|-------------|
| B053 | Smart Weekly Goals | Auto-generate goals from iBrain action plans |
| B054 | Trend Charts | 30d/90d dimension trend visualization |
| B055 | Peer Benchmarks | "Top 25%" comparisons |
| B056 | WebSocket | Real-time score updates |
| B057 | Push Notifications | Nudge delivery via push |

---

## Quick Links

- [Sprint 4 Brainstorm](./SPRINT_004_BRAINSTORM.md)
- [iBrain MVP 1.0 Master Plan](file:///Users/sagarrs/Desktop/official_dev/iBrain/IBRAIN_STRATEGY/3-DELIVERY/sprints/MVP_1.0/MVP_1.0_MASTER_PLAN.md)
- [KARVIA Integration TODO (iBrain)](file:///Users/sagarrs/Desktop/official_dev/iBrain/IBRAIN_STRATEGY/3-DELIVERY/KARVIA_INTEGRATION_TODO.md)

---

**Session Seal**
- **Created**: December 22, 2025
- **Sprint**: 4 of N
- **Theme**: iBrain Integration - Interactive Intelligence
