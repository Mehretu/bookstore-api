const Redis = require('redis')

const redisClient = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
})

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err)
})

redisClient.on('connect', () => {
    console.log('Connected to Redis')
})

const connectRedis = async () => {
    try {
        await redisClient.connect()
    } catch (error) {
        console.error('Redis connection error:', error)
        setTimeout(connectRedis, 5000) 
    }
}

module.exports = { redisClient, connectRedis }