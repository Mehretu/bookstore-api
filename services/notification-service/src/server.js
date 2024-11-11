require('./tracing')
const express = require('express')
const createError = require('http-errors')
const cors = require('cors')
const http = require('http')
require('dotenv').config()
const vaultHelper = require('./Config/init_vault')
const { initMongoDB } = require('./Config/init_mongodb')
const { connectQueue } = require('./Config/rabbitmq')
const { connectRedis, getRedisClient } = require('./Config/init_redis')
const swaggerUi = require('swagger-ui-express')
const swaggerSpecs = require('./swagger')

async function startServer() {
    try {
        // Initialize Vault and services
        await vaultHelper.initialize()
        console.log('Vault initialized')
        await initMongoDB()
        
        // Get configurations from Vault
        console.log('Reading service configurations from Vault')
        const serviceConfig = await vaultHelper.readSecret('services')
        const redisConfig = await vaultHelper.readSecret('redis')

        if (!serviceConfig || !serviceConfig.auth_service_url || !serviceConfig.rabbitmq_url) {
            throw new Error('Service configuration is missing')
        }

        // Set environment variables
        global.AUTH_SERVICE_URL = serviceConfig.auth_service_url
        global.RABBITMQ_URL = serviceConfig.rabbitmq_url
        global.REDIS_URL = redisConfig.redis_url

        // Initialize services
        await connectRedis()
        const redisClient = getRedisClient()
        if(!redisClient || !redisClient.isReady) {
            throw new Error('Redis failed to initialize properly')
        }
        console.log('Redis ready for operations')
        
        await connectQueue()
        console.log('RabbitMQ connected')

        const app = express()
        const server = http.createServer(app)

        // Initialize socket.io
        const io = require('./Config/socket').init(server)

        // Middleware
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

        
        app.get('/api/health', async (req, res) => {
            try {
                const mongoStatus = require('mongoose').connection.readyState === 1
                const redisClient = getRedisClient() // Get Redis client properly
                
                let redisStatus = false
                if (redisClient && redisClient.isReady) {
                    try {
                        await redisClient.ping()
                        redisStatus = true
                    } catch (error) {
                        console.error('Redis ping failed:', error)
                    }
                }
                    
                res.json({ 
                    status: 'ok',
                    service: 'notification-service',
                    timestamp: new Date(),
                    checks: {
                        mongodb: mongoStatus ? 'connected' : 'disconnected',
                        redis: redisStatus ? 'connected' : 'disconnected',
                        vault: 'connected',
                        rabbitmq: global.channel ? 'connected' : 'disconnected'
                    }
                })
            } catch (error) {
                res.status(503).json({
                    status: 'error',
                    message: error.message
                })
            }
        })
        
        
        // Swagger documentation
        app.use('/api-docs', swaggerUi.serve)
        app.get('/api-docs', swaggerUi.setup(swaggerSpecs, {
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
        // Routes
        const notificationRoutes = require('./Routes/Notification.route')
        app.use('/api/notifications', notificationRoutes)

        // 404 handler
        app.use((req, res, next) => {
            next(createError.NotFound('Route not found'))
        })

        // Error handler
        app.use((err, req, res, next) => {
            console.error(err.stack)
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
        const PORT = process.env.PORT || 6001
        const HOST = '0.0.0.0'

        server.listen(PORT, HOST, () => {
            console.log('\nNotification Service is running!')
            console.log('Services initialized:')
            console.log('  - Vault connected')
            console.log('  - MongoDB connected')
            console.log('  - Redis connected')
            console.log('  - RabbitMQ connected')
            console.log('  - Socket.IO initialized')
            console.log(`
    Local:            http://localhost:${PORT}
    On Your Network:  http://${HOST}:${PORT}
    Health Check:     http://localhost:${PORT}/health
            `)
        })

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received: closing HTTP server')
            server.close(() => {
                console.log('HTTP server closed')
                process.exit(0)
            })
        })

    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

// Start the server
startServer()