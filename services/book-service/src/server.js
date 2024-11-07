require('./tracing')
const express = require('express')
const createError = require('http-errors')
const cors = require('cors')
require('dotenv').config()
require('./Config/init_mongodb')
const {connectQueue} = require('./Config/rabbitmq')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./swagger')

const app = express()

// Connect to RabbitMQ
connectQueue()

// Basic middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
    next()
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        service: 'book-service',
        timestamp: new Date()
    })
})

// Swagger documentation
app.use('/api-docs', swaggerUi.serve)
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        displayRequestDuration: true
    }
}))

// Redirect root to API docs
app.get('/', (req, res) => {
    res.redirect('/api-docs')
})

// API Routes
const bookRoutes = require('./Routes/Book.route')
const reviewRoutes = require('./Routes/Review.route')
const searchRoutes = require('./Routes/Search.route')

app.use('/api/books', bookRoutes)
app.use('/api/reviews', reviewRoutes)  
app.use('/api/search', searchRoutes)

app.get('/sw.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.status(204).send();  
});

// 404 handler
app.use((req, res, next) => {
    next(createError.NotFound('Route not found'))
})

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack)  // Add error logging
    res.status(err.status || 500)
    res.json({
        error: {
            status: err.status || 500,
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    })
})

// Server setup
const PORT = process.env.PORT || 8080
const HOST = '0.0.0.0'

const server = app.listen(PORT, HOST, () => {
    console.log('\n Book Service is running!')
    console.log(`
    Local:            http://localhost:${PORT}
    On Your Network:  http://${HOST}:${PORT}
    Documentation:    http://localhost:${PORT}/api-docs
    Health Check:     http://localhost:${PORT}/health
    `)
})

// Handle server errors
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error
    }

    switch (error.code) {
        case 'EACCES':
            console.error(`Port ${PORT} requires elevated privileges`)
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.error(`Port ${PORT} is already in use`)
            process.exit(1)
            break
        default:
            throw error
    }
})

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server')
    server.close(() => {
        console.log('HTTP server closed')
        process.exit(0)
    })
})