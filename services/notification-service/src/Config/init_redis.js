const { createClient } = require('redis')

class RedisManager {
    constructor() {
        this.client = null
    }

    async connect() {
        try {
            if (!global.REDIS_URL) {
                throw new Error('REDIS_URL not found in global configuration')
            }

            if (!this.client) {
                this.client = createClient({
                    url: global.REDIS_URL
                })

                this.client.on('error', (err) => {
                    console.error('Redis Client Error:', err)
                })

                this.client.on('connect', () => {
                    console.log('✅ Redis connected')
                })

                this.client.on('ready', () => {
                    console.log('✅ Redis ready for operations')
                })

                await this.client.connect()
                console.log('Redis connected to:', global.REDIS_URL)
            }

            return this.client
        } catch (error) {
            console.error('Redis connection error:', error)
            throw error
        }
    }

    getClient() {
        return this.client
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit()
            this.client = null
            console.log('Redis disconnected')
        }
    }
}

const redisManager = new RedisManager()

module.exports = {
    connectRedis: () => redisManager.connect(),
    disconnectRedis: () => redisManager.disconnect(),
    getRedisClient: () => redisManager.getClient()
}