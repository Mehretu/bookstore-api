const router = require('express').Router()
const NotificationController = require('../Controllers/Notification.controller')
const { verifyAccessToken } = require('../Middleware/auth_middleware')


router.get('/', 
    verifyAccessToken, 
    NotificationController.getNotifications
)

router.get('/category/:category', 
    verifyAccessToken, 
    NotificationController.getNotificationsByCategory
)

router.get('/unread/count', 
    verifyAccessToken, 
    NotificationController.getUnreadCount
)

router.put('/:notificationId/read', 
    verifyAccessToken, 
    NotificationController.markAsRead
)

router.put('/mark-all-read', 
    verifyAccessToken, 
    NotificationController.markAllAsRead
)

router.delete('/:notificationId', 
    verifyAccessToken, 
    NotificationController.deleteNotification
)

module.exports = router