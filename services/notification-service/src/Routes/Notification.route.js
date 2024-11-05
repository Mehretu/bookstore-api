const router = require('express').Router()
const NotificationController = require('../Controllers/Notification.controller')
const { verifyAccessToken } = require('../Middleware/auth_middleware')

// Public routes
router.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Notification Service' })
})

// Protected routes
router.get('/', 
    verifyAccessToken, 
    NotificationController.getNotifications
)

// Get notifications by category
router.get('/category/:category', 
    verifyAccessToken, 
    NotificationController.getNotificationsByCategory
)

// Get unread notifications count
router.get('/unread/count', 
    verifyAccessToken, 
    NotificationController.getUnreadCount
)

// Mark notification as read
router.put('/:notificationId/read', 
    verifyAccessToken, 
    NotificationController.markAsRead
)

// Mark all notifications as read
router.put('/mark-all-read', 
    verifyAccessToken, 
    NotificationController.markAllAsRead
)

// Delete notification
router.delete('/:notificationId', 
    verifyAccessToken, 
    NotificationController.deleteNotification
)

module.exports = router