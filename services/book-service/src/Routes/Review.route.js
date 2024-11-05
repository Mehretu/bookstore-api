const router = require('express').Router()
const ReviewController = require('../Controllers/Review.controller')
const { verifyAccessToken } = require('../Middleware/auth_middleware')
const { checkRole } = require('../Middleware/auth_middleware')
const { ROLES } = require('../../../../shared/auth')


router.post('/book/:bookId',
    verifyAccessToken,
    ReviewController.createReview
)

router.get('book/:bookId',
    ReviewController.getBookReviews
)

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