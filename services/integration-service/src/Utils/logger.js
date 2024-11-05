const winston = require('winston')

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
        })
    })
)

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Write all logs with importance level of 'error' or less to 'error.log'
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs with importance level of 'info' or less to 'combined.log'
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
})

// If we're not in production, log to the console with simple format
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }))
}


module.exports = { logger }