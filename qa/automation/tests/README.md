# 🧪 Manifestor Testing & Debug Suite

## 📁 Directory Structure

```
tests/
├── unit/            # Unit tests (Jest format)
├── integration/     # Integration tests (API & service tests)
├── e2e/            # End-to-end tests (user flow tests)
├── debug/          # Debug scripts and diagnostic tools
├── manual/         # Manual testing tools & HTML test pages
└── legacy/         # Archived test files from cleanup
```

## 🚀 Running Tests

### **Unit Tests**
```bash
# Run all unit tests
npm test

# Run specific test file
npm test tests/unit/home.test.js

# Run tests with coverage
npm run test:coverage
```

### **Integration Tests**
```bash
# Run integration tests
npm run test:integration

# Run specific integration test
node tests/integration/test-goals-crud.js
```

### **End-to-End Tests**
```bash
# Run all e2e tests
npm run test:e2e

# Run specific e2e test
node tests/e2e/test-complete-user-flow.js
```

### **Debug Tools**
```bash
# Run debug scripts (choose from tests/debug/)
node tests/debug/debug-tasks.js
node tests/debug/debug-journey.js
node tests/debug/comprehensive-test.js
```

### **Manual Testing**
```bash
# Start server and open manual test pages
npm start
# Then open: http://localhost:3000/tests/manual/test-mcp.html
```

## 📋 Test Categories

### **Unit Tests (`unit/`)**
- **Purpose**: Test individual functions/components in isolation
- **Format**: Jest test files (*.test.js)
- **Examples**: 
  - `home.test.js` - Home route tests
  - `limits.test.js` - Rate limiting tests
  - `scoreMapper.test.js` - Scoring utilities tests

### **Integration Tests (`integration/`)**
- **Purpose**: Test API endpoints and service integration
- **Format**: Node.js scripts with assertions
- **Examples**:
  - `test-goals-crud.js` - Goals CRUD operations
  - `test-llm-integration.js` - LLM service integration
  - `test-email-system.js` - Email service tests

### **End-to-End Tests (`e2e/`)**
- **Purpose**: Test complete user workflows
- **Format**: Automated browser tests
- **Examples**:
  - `test-complete-user-flow.js` - Full registration → goal creation flow
  - `test-dream-workflow.js` - Dream creation and plan generation
  - `test-navigation-flow.js` - UI navigation testing

### **Debug Tools (`debug/`)**
- **Purpose**: Diagnostic and debugging utilities
- **Format**: Standalone Node.js scripts
- **Categories**:
  - **Database Debug**: `debug_goals_db.js`, `debug_journey.js`
  - **Frontend Debug**: `debug-frontend-flow.js`, `debug-routing.js`
  - **Feature Debug**: `debug-tasks.js`, `debug-beast-mode.js`
  - **System Debug**: `debug-date.js`, `debug_weeklygoals_issue.js`

### **Manual Tests (`manual/`)**
- **Purpose**: Interactive testing tools and HTML test pages
- **Format**: HTML pages and Node.js utilities
- **Examples**:
  - `test-mcp.html` - MCP integration testing
  - `test-signup.html` - Registration flow testing
  - `test_discovery_system.html` - Discovery system testing

### **Legacy Tests (`legacy/`)**
- **Purpose**: Archived tests from previous structure
- **Status**: Preserved for reference, may contain outdated logic
- **Action**: Review before deletion

## ⚙️ Configuration

### **Jest Configuration (package.json)**
```json
{
  "scripts": {
    "test": "jest tests/unit",
    "test:integration": "node tests/integration/run-all.js",
    "test:e2e": "node tests/e2e/run-all.js",
    "test:coverage": "jest tests/unit --coverage",
    "test:debug": "node tests/debug/comprehensive-test.js"
  },
  "jest": {
    "testMatch": [
      "**/tests/unit/**/*.test.js"
    ],
    "setupFilesAfterEnv": ["./tests/unit/setup.js"]
  }
}
```

### **Environment Setup**
```bash
# Set test environment
export NODE_ENV=test

# Test database (use separate DB for tests)
export MONGODB_URI_TEST=mongodb://localhost:27017/goaltracker_test

# Disable external services during testing
export LLM_ENABLED=false
export EMAIL_ENABLED=false
```

## 🏃‍♂️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up test database
npm run setup:test-db

# 3. Run all unit tests
npm test

# 4. Run integration tests
npm run test:integration

# 5. Start debug session
node tests/debug/comprehensive-test.js
```

## 📝 Writing New Tests

### **Unit Test Example**
```javascript
// tests/unit/myFeature.test.js
describe('My Feature', () => {
  test('should do something', () => {
    expect(myFunction()).toBe(expectedResult);
  });
});
```

### **Integration Test Example**
```javascript
// tests/integration/test-my-api.js
const request = require('supertest');
const app = require('../../server/app');

test('POST /api/my-endpoint', async () => {
  const response = await request(app)
    .post('/api/my-endpoint')
    .send({ data: 'test' });
  
  expect(response.status).toBe(200);
});
```

### **Debug Script Example**
```javascript
// tests/debug/debug-my-feature.js
console.log('🔍 Debugging My Feature...');

// Add debugging logic here
const result = await debugMyFeature();
console.log('Result:', result);
```

## 🧹 Maintenance

### **Regular Cleanup**
- Review `legacy/` folder quarterly
- Remove obsolete debug scripts
- Update test documentation
- Maintain test environment isolation

### **Test Data Management**
- Use separate test database
- Clean up test data after each run
- Mock external services
- Use fixtures for consistent test data

---

**Last Updated**: August 2025  
**Structure Version**: 2.0 (Post-Cleanup)  
**Maintainer**: Development Team