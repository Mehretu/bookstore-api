const vaultHelper = require('./init_vault')
const { connectRedis } = require('./init_redis')
const { connectQueue } = require('./rabbitmq')
const mongoose = require('mongoose')

async function initializeServices() {
    try {
        console.log('Initializing services...')

        // Initialize Vault first
        await vaultHelper.initialize()
        console.log('Vault initialized')

        // Get configurations from Vault
        const dbConfig = await vaultHelper.readSecret('database')
        const serviceConfig = await vaultHelper.readSecret('services')
        const redisConfig = await vaultHelper.readSecret('redis')

        // Set global configurations
        global.MONGODB_URI = dbConfig.mongodb_uri
        global.AUTH_SERVICE_URL = serviceConfig.auth_service_url
        global.RABBITMQ_URL = serviceConfig.rabbitmq_url
        global.REDIS_URL = redisConfig.redis_url

        // Initialize MongoDB
        await mongoose.connect(global.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log('MongoDB connected')

        // Initialize Redis
        await connectRedis()
        console.log('✅ Redis connected')

        // Initialize RabbitMQ
        await connectQueue()
        console.log('RabbitMQ connected')

        return true
    } catch (error) {
        console.error('Service initialization failed:', error)
        throw error
    }
}

module.exports = { initializeServices }