const { getRedisClient } = require('../Config/init_redis')

class CacheHelper {
    static async getFromCache(key) {
        try {
            const redisClient = getRedisClient()
            if (!redisClient || !redisClient.isReady) {
                console.log('Redis client not ready, skipping cache get')
                return null
            }

            const cachedData = await redisClient.get(key)
            return cachedData ? JSON.parse(cachedData) : null
        } catch (error) {
            console.error('Cache get error:', error)
            return null
        }
    }

    static async setCache(key, data, ttl = 3600) {
        try {
            const redisClient = getRedisClient()
            if (!redisClient || !redisClient.isReady) {
                console.log('Redis client not ready, skipping cache set')
                return
            }

            const stringifiedData = JSON.stringify(data)
            await redisClient.setEx(key, ttl, stringifiedData)
        } catch (error) {
            console.error('Cache set error:', error)
        }
    }

    static async invalidateCache(pattern) {
        try {
            const redisClient = getRedisClient()
            if (!redisClient || !redisClient.isReady) {
                console.log('Redis client not ready, skipping cache invalidation')
                return
            }

            const keys = await redisClient.keys(pattern)
            if (keys && keys.length > 0) {
                await redisClient.del(keys)
            }
        } catch (error) {
            console.error('Cache invalidation error:', error)
        }
    }

    static generateCacheKey(...parts) {
        return parts.filter(part => part !== undefined && part !== null).join(':')
    }
}

module.exports = CacheHelper