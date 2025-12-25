/**
 * server/index.js
 * Main entry point for the Karvia backend server.
 */

// 1. Import Dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const logger = require('./utils/logger');
const { httpLogger } = require('./utils/logger');

// Load variables from .env and override any existing environment values
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

// 2. Environment Validation
// Validate all required environment variables before starting
function validateEnvironment() {
    const errors = [];
    const warnings = [];

    // Required variables
    if (!process.env.MONGO_URI) {
        errors.push('MONGO_URI is required. Set it in your .env file.');
    }
    if (!process.env.JWT_SECRET) {
        errors.push('JWT_SECRET is required. Set it in your .env file.');
    }

    // Conditional requirements
    const provider = process.env.LLM_PROVIDER || 'openai';
    process.env.LLM_PROVIDER = provider;

    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
        errors.push('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
    }

    // Warnings for optional but recommended
    if (!process.env.JWT_EXPIRATION) {
        warnings.push('JWT_EXPIRATION not set, using default: 7d');
    }

    // Log configuration summary
    logger.info({ provider }, 'LLM Provider configured');
    if (process.env.OPENAI_API_KEY) {
        logger.info('OpenAI API key loaded');
    }

    // Log warnings
    warnings.forEach(w => logger.warn(w));

    // Exit on errors
    if (errors.length > 0) {
        errors.forEach(e => logger.error(e));
        logger.error('Environment validation failed. Please fix the above errors.');
        process.exit(1);
    }

    logger.info('Environment validation passed');
}

validateEnvironment();

// Initialize the Express app
const app = express();

// 3. Connect to MongoDB Database
const db = process.env.MONGO_URI;

// Set the Mongoose option to suppress the deprecation warning.
mongoose.set('strictQuery', true);

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    logger.info({
        database: mongoose.connection.name,
        environment: process.env.NODE_ENV || 'development'
    }, 'MongoDB connected successfully');
})
.catch(err => {
    logger.error({ error: err.message }, 'MongoDB connection failed');
    process.exit(1);
});

// 4. Initialize Middleware

// Security: Set various HTTP headers for protection
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openai.com"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for development
}));

// Security: Sanitize user input to prevent NoSQL injection
app.use(mongoSanitize());

// Security: Prevent HTTP Parameter Pollution
app.use(hpp());

// This allows the app to accept JSON in the request body
app.use(express.json({ extended: false, limit: '10kb' }));

// HTTP request logging
app.use(httpLogger);

// Global rate limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { msg: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Strict rate limiter for auth endpoints: 5 login attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { msg: 'Too many authentication attempts, please try again in 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
});

// Strict rate limiter for registration: 3 per hour per IP
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { msg: 'Too many account creation attempts, please try again in an hour' },
    standardHeaders: true,
    legacyHeaders: false,
});

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

// Apply strict rate limiting to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', registerLimiter);
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
    logger.error({
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
    }, 'Unhandled error');

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

app.listen(PORT, () => {
    logger.info({ port: PORT, environment: process.env.NODE_ENV || 'development' }, 'Server started');
});
