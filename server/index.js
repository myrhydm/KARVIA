/**
 * server/index.js
 * Main entry point for the Karvia backend server.
 */

// 1. Import Dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load variables from .env and override any existing environment values
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

// Debug: Confirm that the API key is present without exposing any part of it
if (process.env.OPENAI_API_KEY) {
  console.log('🔑 API key loaded');
} else {
  console.log('🔑 API key not found');
}
const provider = process.env.LLM_PROVIDER || 'openai';
process.env.LLM_PROVIDER = provider;
console.log('🤖 LLM Provider:', provider);

// Ensure OpenAI API key is provided when using the OpenAI provider
if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
    process.exit(1);
}

// 2. Initial Configuration
// Environment variables are already loaded from the project root .env file

// Initialize the Express app
const app = express();

// 3. Connect to MongoDB Database
// Use the MONGO_URI from the .env file
const db = process.env.MONGO_URI;

if (!db) {
    console.error('MONGO_URI is not defined. Please set MONGO_URI in your .env file.');
    console.log('MONGO_URI:', db);
    process.exit(1);
}

// Ensure JWT_SECRET is defined before continuing
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined. Please set JWT_SECRET in your .env file.');
    process.exit(1);
}

// Set the Mongoose option to suppress the deprecation warning.
mongoose.set('strictQuery', true);

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('MongoDB Connected Successfully');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${mongoose.connection.name}`);
})
.catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    console.error('MONGO_URI:', db ? `${db.substring(0, 30)}...` : 'undefined');
    // Exit process with failure
    process.exit(1);
});

// 4. Initialize Middleware
// This allows the app to accept JSON in the request body
app.use(express.json({ extended: false }));


// 5. Define API Routes
// All routes will be prefixed with '/api'
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const weeklyGoalRoutes = require('./routes/goals');
const taskRoutes = require('./routes/tasks');
const taskChatRoutes = require('./routes/taskChat');
const analyticsRoutes = require('./routes/analytics');
const manifestRoutes = require('./routes/manifest');
const configRoutes = require('./routes/config');
const visionRoutes = require('./routes/vision');
const pmAssessmentRoutes = require('./routes/pmAssessment');
const ollamaRoutes = require('./routes/ollama');
const llmRoutes = require('./routes/llm');

// Import journey routes
const journeyRoutes = require('./routes/journeyCore');
const dreamParserRoutes = require('./routes/dreamParserSimple');
const dreamRoutes = require('./routes/dreams');
const usersRoutes = require('./routes/users');

// Import consumer routes
const consumerJourneyRoutes = require('./routes/consumer-journey');

// Import reflection routes
const reflectionRoutes = require('./api/routes/reflections');

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/weeklyGoals', weeklyGoalRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/task-chat', taskChatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/manifest', manifestRoutes);
app.use('/api/config', configRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/pm-assessment', pmAssessmentRoutes);
app.use('/api/ollama', ollamaRoutes);
app.use('/api/llm', llmRoutes);

// Add journey routes
app.use('/api/journey', journeyRoutes);
app.use('/api/dream-parser', dreamParserRoutes);
app.use('/api/dreams', dreamRoutes);
app.use('/api/users', usersRoutes);

// Add goals alias for frontend compatibility
app.use('/api/goals', weeklyGoalRoutes);

// Add consumer routes
app.use('/api/consumer/journey', consumerJourneyRoutes);

// Add reflection routes
app.use('/api/reflections', reflectionRoutes);


// 5.5. Health Check Endpoint (for monitoring)
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'karvia',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Basic database connection check
    if (mongoose.connection.readyState === 1) {
      healthCheck.database = 'connected';
    } else {
      healthCheck.database = 'disconnected';
      healthCheck.status = 'degraded';
    }
  } catch (error) {
    healthCheck.database = 'error';
    healthCheck.status = 'unhealthy';
    healthCheck.error = error.message;
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 :
                     healthCheck.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(healthCheck);
});

// 6. Serve Static Assets (HTML, CSS, JS from the 'client' folder)
// This tells Express to serve all the files from the 'client' folder
app.use(express.static(path.join(__dirname, '..', 'client')));

// Serve test files from root
app.use(express.static(path.join(__dirname, '..')));

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    // Log more details in development
    if (process.env.NODE_ENV !== 'production') {
        console.error('Stack trace:', err.stack);
        console.error('Request details:', {
            method: req.method,
            url: req.url,
            body: req.body,
            headers: req.headers
        });
    }

    res.status(500).json({
        msg: 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { error: err.message })
    });
});

// The "catchall" handler: for any request that doesn't match one above,
// send back the main index.html file. This is key for page refreshes.
// Only for SPA routes, not file requests
app.get('*', (req, res, next) => {
    // Skip catchall for static file requests
    if (req.path.includes('.')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});


// 7. Start the Server
// Use the PORT from the .env file, or default to 5001
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
