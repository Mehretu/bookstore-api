const router = require('express').Router()
const ReviewController = require('../Controllers/Review.controller')
const { verifyAccessToken } = require('../Middleware/auth_middleware')
const { ROLES } = require('../../../../shared/auth')

// Helper middleware for role checking
const checkRole = (allowedRoles) => (req, res, next) => {
    try {
        const userRole = req.payload.role
        if (!allowedRoles.includes(userRole)) {
            throw createError.Forbidden(`Role ${userRole} is not allowed`)
        }
        next()
    } catch (error) {
        next(error)
    }
}

router.post('/book/:bookId',
    verifyAccessToken,
    ReviewController.createReview
)

// Get reviews for a book
router.get('book/:bookId',
    ReviewController.getBookReviews
)

// Other review routes stay the same
router.put('/:reviewId',
    verifyAccessToken,
    ReviewController.updateReview
)

router.delete('/:reviewId',
    verifyAccessToken,
    checkRole(ROLES.ADMIN),
    ReviewController.deleteReview
)

router.post('/:reviewId/vote',
    verifyAccessToken,
    ReviewController.voteReview
)

router.post('/:reviewId/report',
    verifyAccessToken,
    ReviewController.reportReview
)

router.get('/reported',
    verifyAccessToken,
    checkRole(ROLES.ADMIN),
    ReviewController.getReportedReviews
)

router.put('/:reviewId/handle-report',
    verifyAccessToken,
    checkRole(ROLES.ADMIN),
    ReviewController.handleReportedReview
)

module.exports = router