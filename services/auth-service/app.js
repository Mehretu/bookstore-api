require('./tracing')
const express = require('express')
const morgan = require('morgan')
const createError = require('http-errors')
const mongoose = require('mongoose')
const User = require('./Models/User.model')
require('dotenv').config()
const vaultHelper = require('./helpers/vault_helper')
const { initMongoDB } = require('./helpers/init_mongodb')
const { client } = require('./helpers/init_redis')
const { verifyAccessToken, initializeSecrets } = require('./helpers/jwt_helper')
const AuthRoute = require('./Routes/Auth.route')
const swaggerUi = require('swagger-ui-express')
const swaggerSpecs = require('./swagger')
const { ROLES } = require('../../shared/auth')

async function startServer() {
    try {
        // Initialize services
        await vaultHelper.initialize()
        await initMongoDB()
        await initializeSecrets()

        const app = express()

        app.use(morgan('dev'))
        app.use(express.json())
        app.use(express.urlencoded({ extended: true }))
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs))

        app.get('/', verifyAccessToken, async (req, res, next) => {
            res.send("Hello from express.")
        })

        app.get('/health', async (req, res) => {
            try {
                const mongoStatus = mongoose.connection.readyState === 1
                const redisStatus = client.connected
                const adminExists = await User.exists({ role: ROLES.ADMIN })

                if (mongoStatus && redisStatus && adminExists) {
                    res.status(200).json({
                        status: 'healthy',
                        mongo: 'connected',
                        redis: 'connected',
                        admin: 'exists'
                    })
                } else {
                    res.status(503).json({
                        status: 'unhealthy',
                        mongo: mongoStatus ? 'connected' : 'disconnected',
                        redis: redisStatus ? 'connected' : 'disconnected',
                        admin: adminExists ? 'exists' : 'missing'
                    })
                }
            } catch (error) {
                res.status(503).json({
                    status: 'error',
                    message: error.message
                })
            }
        })

        app.use('/auth', AuthRoute)

        app.use(async (req, res, next) => {
            next(createError.NotFound())
        })

        app.use((err, req, res, next) => {
            res.status(err.status || 500)
            res.send({
                error: {
                    status: err.status || 500,
                    message: err.message,
                },
            })
        })

        const PORT = process.env.PORT || 5000

        app.listen(PORT, () => {
            console.log('Services initialized successfully:')
            console.log('  - Vault connected')
            console.log('  - MongoDB connected')
            console.log('  - Redis connected')
            console.log(`  - Server running on port ${PORT}`)
        })

    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }

    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)
}

async function gracefulShutdown(signal) {
    console.log(`\n${signal} received. Starting graceful shutdown...`)
    try {
        await mongoose.connection.close()
        console.log('MongoDB connection closed')
        await client.quit()
        console.log('Redis connection closed')
        process.exit(0)
    } catch (error) {
        console.error('Error during shutdown:', error)
        process.exit(1)
    }
}

startServer()