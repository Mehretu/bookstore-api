const Notification = require('../Models/Notification.model')
const socketConfig = require('../Config/socket')
const { getRedisClient } = require('../Config/init_redis')
const createError = require('http-errors')
const CacheHelper = require('../helpers/cache_helper')

module.exports = {
    handleEvent: async (event) => {
        try {
            const { type, payload } = event
            const io = socketConfig.getIO()

            console.log('Received event:', { type, payload }) // Debug log

            switch (type) {
                case 'NEW_BOOK':
                    const { book, interestedUsers } = payload
                    
                    console.log('Processing new book notification:', {
                        book,
                        interestedUsers
                    })

                    if (!interestedUsers || interestedUsers.length === 0) {
                        console.log('No interested users found')
                        return
                    }
                    
                    // Create notifications for interested users
                    const notifications = await Promise.all(
                        interestedUsers.map(async (userId) => {
                            console.log(`Creating notification for user: ${userId}`)

                            const notification = await Notification.create({
                                userId,
                                type: 'NEW_BOOK',
                                data: {
                                    bookId: book.id,
                                    title: book.title,
                                    author: book.author,
                                    category: book.category,
                                    price: book.price,
                                    genre: book.genre,
                                    rating: book.rating,
                                    message: `New ${book.category} book: "${book.title}" by ${book.author}`
                                }
                            })

                            console.log(`Emitting to user:${userId}`, notification)

                            // Emit to both room and direct socket
                            io.to(`user:${userId}`).emit('new-book', {
                                type: 'NEW_BOOK',
                                notification
                            })

                            // Also emit to general room
                            io.emit('notifications', {
                                type: 'NEW_BOOK',
                                notification
                            })

                            return notification
                        })
                    )

                    console.log(`Notifications created and emitted for ${notifications.length} users`)
                    break;

                default:
                    console.log('Unknown event type:', type)
            }
        } catch (error) {
            console.error('Error handling event:', error)
        }
    },

    getNotifications: async (req, res, next) => {
        try {
            const { userId } = req.payload
            const page = parseInt(req.query.page) || 1
            const limit = parseInt(req.query.limit) || 10

            const cacheKey = CacheHelper.generateCacheKey(
                'notifications',
                userId,
                page.toString(),
                limit.toString()
            )

            // Try to get from cache
            const cachedData = await CacheHelper.getFromCache(cacheKey)
            if (cachedData) {
                console.log('Cache hit for notifications')
                return res.json(cachedData)
            }

            // If not in cache, get from database
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)

            const total = await Notification.countDocuments({ userId })

            const response = {
                notifications,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }

            // Store in cache
            await CacheHelper.setCache(cacheKey, response)

            res.json(response)
        } catch (error) {
            next(error)
        }
    },


    getNotificationsByCategory: async (req, res, next) => {
        try {
            const { category } = req.params
            const { page = 1, limit = 10 } = req.query
            const userId = req.payload.userId
            
            const cacheKey = CacheHelper.generateCacheKey(
                'notifications', 
                userId, 
                category, 
                page, 
                limit
            )
            
            // Try cache first
            const cachedData = await CacheHelper.getFromCache(cacheKey)
            if (cachedData) {
                return res.json(cachedData)
            }
    
            const notifications = await Notification.find({
                'data.category': category
            })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
    
            const total = await Notification.countDocuments({
                'data.category': category
            })
    
            const response = {
                success: true,
                data: {
                    notifications,
                    pagination: {
                        total,
                        totalPages: Math.ceil(total / limit),
                        currentPage: parseInt(page),
                        limit: parseInt(limit)
                    }
                }
            }
    
            // Cache for 5 minutes
            await CacheHelper.setCache(cacheKey, response, 300)
    
            res.json(response)
        } catch (error) {
            next(error)
        }
    },

    getUnreadCount: async (req, res, next) => {
        try {
            const { userId } = req.payload
            const cacheKey = `notifications:${userId}:unread:count` // More specific cache key
    
            // Try to get from cache
            const cachedCount = await CacheHelper.getFromCache(cacheKey)
            if (cachedCount !== null) {
                return res.json({ count: parseInt(cachedCount) }) // Ensure it's a number
            }
    
            // If not in cache, get from database
            const count = await Notification.countDocuments({
                userId,
                read: false
            })
    
            // Store in cache for a shorter duration since this changes frequently
            await CacheHelper.setCache(cacheKey, count, 60) // Cache for 1 minute
    
            res.json({ count })
        } catch (error) {
            next(error)
        }
    },

    markAsRead: async (req, res, next) => {
        try {
            const { userId } = req.payload
            const { notificationId } = req.params
    
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, userId, read: false }, // Add read:false to only update if it was unread
                { read: true },
                { new: true }
            )
    
            if (!notification) {
                throw createError.NotFound('Notification not found')
            }
    
            // Invalidate all related caches
            await Promise.all([
                // Invalidate unread count cache
                CacheHelper.invalidateCache(`notifications:${userId}:unread:count`),
                // Invalidate notification list caches
                CacheHelper.invalidateCache(`notifications:${userId}:*`),
                // Invalidate category-specific caches
                CacheHelper.invalidateCache(`notifications:${userId}:category:*`),
                // Legacy cache pattern (if still in use)
                CacheHelper.invalidateCache(`notification:cache:user:${userId}:*`)
            ])
    
            // Get new unread count
            const unreadCount = await Notification.countDocuments({
                userId,
                read: false
            })
    
            res.json({
                success: true,
                notification,
                unreadCount // Include the new count in the response
            })
        } catch (error) {
            next(error)
        }
    },

    markAllAsRead: async (req, res, next) => {
        try {
            const userId = req.payload.userId
    
            // Update all unread notifications
            const result = await Notification.updateMany(
                { userId, read: false },
                { read: true }
            )
    
            // Invalidate specific caches
            await Promise.all([
                CacheHelper.invalidateCache(`notifications:${userId}:unread:count`),
                CacheHelper.invalidateCache(`notifications:${userId}:*`),
                CacheHelper.invalidateCache(`notifications:${userId}:category:*`),
                CacheHelper.invalidateCache(`notification:cache:user:${userId}:*`)
            ])
    
            res.json({
                success: true,
                message: 'All notifications marked as read',
                updated: result.modifiedCount // Add count of updated documents
            })
        } catch (error) {
            next(error)
        }
    },

    deleteNotification: async (req, res, next) => {
        try {
            const { notificationId } = req.params
            const userId = req.payload.userId

            const notification = await Notification.findByIdAndDelete(notificationId)

            if (!notification) {
                throw createError.NotFound('Notification not found')
            }

            // Use CacheHelper instead of direct Redis client
            await CacheHelper.invalidateCache(`notifications:${userId}:*`)

            res.json({
                success: true,
                message: 'Notification deleted successfully'
            })
        } catch (error) {
            next(error)
        }
    },
    clearAllCaches: async (req, res, next) => {
        try {
            const redisClient = getRedisClient()
            if (!redisClient || !redisClient.isReady) {
                throw createError.ServiceUnavailable('Cache service not available')
            }

            const keys = await redisClient.keys('notifications:*')
            if (keys.length > 0) {
                await redisClient.del(keys)
            }

            res.json({
                success: true,
                message: `Cleared ${keys.length} cache entries`
            })
        } catch (error) {
            next(error)
        }
    }
}
