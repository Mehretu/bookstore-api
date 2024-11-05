const Notification = require('../Models/Notification.model')
const socketConfig = require('../Config/socket')
const { redisClient } = require('../Config/init_redis')
const createError = require('http-errors')

module.exports = {
    handleEvent: async (event) => {
        try {
            const { type, payload } = event
            const io = socketConfig.getIO()

            switch (type) {
                case 'NEW_BOOK':
                    const { book, interestedUsers } = payload
                    
                    // Create notifications for interested users
                    const notifications = await Promise.all(
                        interestedUsers.map(async (userId) => {
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

                            // Emit to specific user
                            io.to(`user:${userId}`).emit('new-book', {
                                type: 'NEW_BOOK',
                                notification
                            })

                            return notification
                        })
                    )

                    console.log(`Notifications created for ${notifications.length} interested users`)
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
            const { page = 1, limit = 10 } = req.query
            const userId = req.payload.userId
            const cacheKey = `notifications:${userId}:${page}:${limit}`

            // Try to get from cache
            const cachedData = await redisClient.get(cacheKey)
            if (cachedData) {
                return res.json(JSON.parse(cachedData))
            }

            const notifications = await Notification.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))

            const total = await Notification.countDocuments()

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
            await redisClient.setEx(cacheKey, 300, JSON.stringify(response))

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
            
            const cacheKey = `notifications:${userId}:${category}:${page}:${limit}`
            const cachedData = await redisClient.get(cacheKey)
            
            if (cachedData) {
                return res.json(JSON.parse(cachedData))
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

            await redisClient.setEx(cacheKey, 300, JSON.stringify(response))

            res.json(response)
        } catch (error) {
            next(error)
        }
    },

    getUnreadCount: async (req, res, next) => {
        try {
            const userId = req.payload.userId
            const cacheKey = `unread:${userId}`

            const cachedCount = await redisClient.get(cacheKey)
            if (cachedCount) {
                return res.json({
                    success: true,
                    data: { count: parseInt(cachedCount) }
                })
            }

            const count = await Notification.countDocuments({
                read: false
            })

            await redisClient.setEx(cacheKey, 60, count.toString()) // Cache for 1 minute

            res.json({
                success: true,
                data: { count }
            })
        } catch (error) {
            next(error)
        }
    },

    markAsRead: async (req, res, next) => {
        try {
            const { notificationId } = req.params
            const userId = req.payload.userId

            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                { read: true },
                { new: true }
            )

            if (!notification) {
                throw createError.NotFound('Notification not found')
            }

            // Invalidate relevant caches
            const cachePattern = `notifications:${userId}:*`
            const keys = await redisClient.keys(cachePattern)
            if (keys.length > 0) {
                await redisClient.del(keys)
            }
            await redisClient.del(`unread:${userId}`)

            res.json({
                success: true,
                data: { notification }
            })
        } catch (error) {
            next(error)
        }
    },

    markAllAsRead: async (req, res, next) => {
        try {
            const userId = req.payload.userId

            await Notification.updateMany(
                { read: false },
                { read: true }
            )

            // Invalidate all user's caches
            const cachePattern = `notifications:${userId}:*`
            const keys = await redisClient.keys(cachePattern)
            if (keys.length > 0) {
                await redisClient.del(keys)
            }
            await redisClient.del(`unread:${userId}`)

            res.json({
                success: true,
                message: 'All notifications marked as read'
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

            // Invalidate relevant caches
            const cachePattern = `notifications:${userId}:*`
            const keys = await redisClient.keys(cachePattern)
            if (keys.length > 0) {
                await redisClient.del(keys)
            }

            res.json({
                success: true,
                message: 'Notification deleted successfully'
            })
        } catch (error) {
            next(error)
        }
    }
}
