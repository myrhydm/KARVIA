const pino = require('pino');

// Create a pino logger with configurable level via LOG_LEVEL environment variable
const level = process.env.LOG_LEVEL || 'info';

const logger = pino({
    level,
});

module.exports = logger;
