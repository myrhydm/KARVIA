const pino = require('pino');
const pinoHttp = require('pino-http');

const isProduction = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Logger configuration
const loggerOptions = {
    level,
    // Redact sensitive fields from logs
    redact: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
};

// Pretty printing for development
if (!isProduction) {
    loggerOptions.transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    };
}

const logger = pino(loggerOptions);

// HTTP request logging middleware
const httpLogger = pinoHttp({
    logger,
    // Don't log health check requests
    autoLogging: {
        ignore: (req) => req.url === '/health',
    },
    // Custom log message
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
    // Customize what's logged
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            // Don't log full headers in production
            ...(isProduction ? {} : { headers: req.headers }),
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
});

module.exports = logger;
module.exports.httpLogger = httpLogger;
