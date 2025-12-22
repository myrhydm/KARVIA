# KARVIA - Personal Goal Achievement Platform

> **Help individuals achieve their dreams through structured goal tracking and AI-powered guidance**

**Status**: ✅ Operational
**Port**: 5001
**Database**: MongoDB

---

## What is KARVIA?

KARVIA is a personal development platform that helps individuals:
- **Define their vision** through guided assessments
- **Break down dreams** into actionable weekly goals
- **Track progress** with smart task management
- **Get AI-powered guidance** for planning and reflection

---

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp config/.env.example .env
# Edit .env with your MongoDB URI, JWT secret, and OpenAI API key

# Start the server
npm start

# Open in browser
open http://localhost:5001
```

---

## Features

### Vision & Goal Setting
- **Vision Questionnaire** - Discover your learning style, timeline, and priorities
- **Dream Parser** - AI-powered breakdown of aspirations into concrete goals
- **Weekly Planning** - Generate personalized weekly goals with LLM assistance

### Task Management
- **Smart Tasks** - Create tasks with time estimates and scheduling
- **Progress Tracking** - Monitor completion rates and streaks
- **Day-based Organization** - Organize tasks by day of the week

### Journey System
- **Stage Progression** - Move through onboarding → discovery → growth stages
- **Milestone Tracking** - Celebrate achievements along your journey
- **Adaptive Guidance** - Get recommendations based on your progress

### AI Integration
- **OpenAI/Ollama Support** - Flexible LLM provider configuration
- **Personalized Plans** - AI generates plans based on your profile
- **Smart Insights** - Get contextual advice and encouragement

---

## Project Structure

```
KARVIA/
├── client/                 # Frontend UI
│   ├── index.html         # Login page
│   ├── home.html          # Dashboard
│   ├── goals.html         # Weekly goals
│   ├── tasks.html         # Task management
│   ├── journey.html       # Journey progress
│   └── pages/scripts/     # Frontend JavaScript
│
├── server/
│   ├── index.js           # Express server entry
│   ├── routes/            # API endpoints
│   │   ├── auth.js        # Authentication
│   │   ├── goals.js       # Weekly goals CRUD
│   │   ├── tasks.js       # Task management
│   │   ├── journey*.js    # Journey tracking
│   │   ├── vision.js      # Vision assessments
│   │   ├── dreams.js      # Dream parsing
│   │   └── llm.js         # AI generation
│   │
│   ├── models/            # MongoDB schemas
│   │   ├── User.js        # User accounts
│   │   ├── WeeklyGoal.js  # Goals
│   │   ├── Task.js        # Tasks
│   │   ├── Journey.js     # User journeys
│   │   └── VisionProfile.js
│   │
│   ├── services/          # Business logic
│   │   ├── llmService.js  # LLM integration
│   │   ├── journeyService.js
│   │   ├── emailService.js
│   │   └── ...
│   │
│   └── middleware/        # Auth & permissions
│
└── config/                # App configuration
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/user` | Get current user |

### Goals & Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weeklyGoals?weekOf=<date>` | Get weekly goals |
| POST | `/api/weeklyGoals` | Create goal |
| GET | `/api/tasks` | Get tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |

### Journey & Vision
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journey` | Get user journey |
| POST | `/api/vision/submit` | Submit vision assessment |
| GET | `/api/dreams` | Get parsed dreams |

### AI Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/llm/generate` | Generate content |
| POST | `/api/llm/plan-week` | Generate weekly plan |
| GET | `/api/llm/status` | Check LLM status |

---

## Environment Variables

```bash
# Required
MONGO_URI=mongodb://localhost:27017/karvia
JWT_SECRET=your-secure-secret
JWT_EXPIRATION=24h

# LLM Configuration
LLM_PROVIDER=openai          # or 'ollama'
OPENAI_API_KEY=sk-...        # Required if using OpenAI

# Optional (for Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest

# Server
PORT=5001
NODE_ENV=development
```

Copy `config/.env.example` to `.env` and update the values. The server loads variables from this file at startup without overriding existing environment variables.

---

## Weekly Goals API

The `/api/weeklyGoals` endpoint expects a `weekOf` query parameter specifying the Monday (in UTC) of the week you want to retrieve:

```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:5001/api/weeklyGoals?weekOf=2025-07-07T00:00:00.000Z"
```

---

## Development

```bash
# Start with auto-reload
npm run server

# Run tests
npm test
```

---

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: Vanilla HTML/CSS/JS with Tailwind
- **AI**: OpenAI GPT / Ollama (local)
- **Auth**: JWT tokens

---

## Health Check

```bash
curl http://localhost:5001/health
```

Response:
```json
{
  "status": "healthy",
  "service": "karvia",
  "database": "connected",
  "uptime": 123.45
}
```

---

## License

ISC

---

**KARVIA** - *Your journey to achievement starts here*
