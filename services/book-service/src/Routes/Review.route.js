const router = require('express').Router()
const ReviewController = require('../controllers/Review.controller')
const { verifyAccessToken } = require('../middleware/auth_middleware')
const { ROLES } = require('../../../shared/auth')

// Create review
router.post('/books/:bookId/reviews',
    verifyAccessToken,
    ReviewController.createReview
)

// Get reviews for a book
router.get('/books/:bookId/reviews',
    ReviewController.getBookReviews
)

// Update own review
router.put('/reviews/:reviewId',
    verifyAccessToken,
    ReviewController.updateReview
)

// Delete own review
router.delete('/reviews/:reviewId',
    verifyAccessToken,
    ReviewController.deleteReview
)

// Vote on review
router.post('/reviews/:reviewId/vote',
    verifyAccessToken,
    ReviewController.voteReview
)

// Report review
router.post('/reviews/:reviewId/report',
    verifyAccessToken,
    ReviewController.reportReview
)

// Admin routes for handling reported reviews
router.get('/reviews/reported',
    verifyAccessToken,
    checkRole(ROLES.ADMIN),
    ReviewController.getReportedReviews
)

router.put('/reviews/:reviewId/handle-report',
    verifyAccessToken,
    checkRole(ROLES.ADMIN),
    ReviewController.handleReportedReview
)

module.exports = router 