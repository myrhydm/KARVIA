# Manifestor - Software Development Ecosystem

> **Universal journey tracking & manifestation platform with AI-powered assessment engines**

**Status**: ✅ Operational Ecosystem - Production-Ready Engines  
**Architecture**: 6-Engine Microservice Architecture + Unified Admin Dashboard  
**Purpose**: Complete manifestation platform with role-based development structure

## 🚀 Quick Start for New Team Members

### For Product Managers
- 📋 **Product Requirements**: `/docs/product-requirements/`
- 🎯 **Daily Progress**: `/daily/logs/`
- 🔍 **Research**: `/knowledge/research/`

### For Developers  
- ⚡ **Engine Architecture**: `/server/engines/`
- 🧪 **Testing**: `/qa/automation/`
- 📖 **API Docs**: `/docs/architecture/current/`

### For Designers
- 🎨 **Design Assets**: `/designer/branding/`
- 🖼️ **Mockups**: `/designer/mockups/`
- 💾 **Frontend Components**: `/client/components/`

### For QA Engineers
- ✅ **Test Cases**: `/qa/test-cases/`
- 📊 **Reports**: `/qa/reports/`
- 🤖 **Automation**: `/qa/automation/`

### For DevOps
- 🚀 **Deployment**: `/ops/infra/`
- 📈 **Monitoring**: `/ops/monitoring/`
- ⚙️ **CI/CD**: `/ops/ci-cd/`

---

## 🏗️ System Architecture

**6-Engine Microservice Architecture:**

| Engine | Port | Purpose | Status |
|--------|------|---------|--------|
| Assessment | 8084 | Vision & PM evaluation | ✅ Live |
| Observer | 8082 | Rules & stage progression | ✅ Live |
| Tracking | 8083 | Behavioral analytics | 🔧 In Progress |
| Scoring | 8080 | 5D achievement scoring | 🔧 Go Implementation |
| Planner | 8081 | AI journey generation | 📋 Planned |
| IAM | 8086 | Identity & access | 📋 Planned |

**Monitoring Dashboard:** `http://localhost:8085/dashboard`

## 📂 Child Repository Status

### **📱 goal_tracking** - `/Users/sagarrs/Desktop/official_dev/goal_tracking/`
- **Status**: ✅ **Active Development Repository**
- **Purpose**: Pure frontend application for goal tracking
- **Components**: Client interface, server backend, user data management
- **Stack**: HTML/CSS/JS frontend, Express.js backend, MongoDB
- **Features**: Journey tracking, task management, user authentication
- **Target Users**: End users focused on personal/professional goal achievement

### **🧠 iBrain** - `/Users/sagarrs/Desktop/official_dev/iBrain/`
- **Status**: ✅ **Intelligence Platform Repository**  
- **Purpose**: Multi-application Intelligence as a Service (IQaaS)
- **Architecture**: 6 independent microservices engines
- **Stack**: Node.js, Go, Python, Docker containers
- **Engines**: Observer, Scoring, Tracking, Planner, IAM, Assessment, Universal Adapter
- **Target Clients**: Multiple applications (goal_tracking, CRM, fitness apps, etc.)

### **🔗 Integration Pattern**
```
goal_tracking ←→ iBrain SDK ←→ iBrain Services
```

## 🚀 Development Workflow

### **Daily Management Scripts**
- **`./ops/scripts/goodmorning.sh`** - Start-of-day system check and setup
- **`./ops/scripts/Letsmeettomorrow.sh`** - End-of-day documentation and cleanup

### **Child Repository Development**
```bash
# Work on frontend application
cd /Users/sagarrs/Desktop/official_dev/goal_tracking
npm run dev  # Start goal tracking app

# Work on intelligence platform
cd /Users/sagarrs/Desktop/official_dev/iBrain
docker-compose up  # Start all intelligence engines
```

## Getting Started

Install dependencies and run the test suite:

```bash
npm install
npm test
```

### Environment variables

The server expects several environment variables to be defined:

* `MONGO_URI` - MongoDB connection string.
* `JWT_SECRET` - Secret used to sign authentication tokens.
* `JWT_EXPIRATION` - How long newly issued tokens remain valid (default `1h`).
* `LLM_PROVIDER` - Which AI provider to use (`openai` or `llama`). Defaults to `openai`.
* `OPENAI_API_KEY` - Required when `LLM_PROVIDER` is set to `openai`. The server
  will exit at startup if this key is missing.
* `OLLAMA_BASE_URL` - Base URL of your Ollama instance (default `http://localhost:11434`).
* `OLLAMA_MODEL` - Llama model to use (default `llama3.2:latest`).

Copy `.env.example` to `.env` and update the values. At startup the server loads
variables from this file **without** overriding any environment variables that
are already set. This allows environment-specific configuration (for example
deployment secrets) to take precedence over the contents of `.env`. Update the
file whenever your API keys change. Increase `JWT_EXPIRATION` if you need longer
login sessions.

The integration tests rely on `mongodb-memory-server` which may require network access to download MongoDB binaries.

### Weekly Goals API

The `/api/weeklyGoals` endpoint expects a `weekOf` query parameter specifying
the Monday (in UTC) of the week you want to retrieve. If omitted the server
returns `weekOf is required.` Example request:

```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:5001/api/weeklyGoals?weekOf=2025-07-07T00:00:00.000Z"
```

Environment variables from `.env` are loaded automatically at startup so
ensure `LLM_PROVIDER` and any API keys (like `OPENAI_API_KEY`) are defined there.

## Documentation

Additional documentation and deployment guides are available in the [docs](docs/README.md) directory.

