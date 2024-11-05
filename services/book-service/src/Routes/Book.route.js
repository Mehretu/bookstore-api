const router = require('express').Router()
const BookController = require('../Controllers/Book.controller')
const { verifyAccessToken } = require('../Middleware/auth_middleware')
const { ROLES } = require('../../../../shared/auth')
const { checkRole } = require('../Middleware/auth_middleware')
// Public routes
router.get('/', BookController.getBooks)
router.get('/:id', BookController.getBookById)

// Protected routes - Admin only
router.post('/',
    verifyAccessToken,
    checkRole(ROLES.ADMIN),  // Temporarily comment this out until we implement role checking
    BookController.createBook
)

router.post('/bulk',
    verifyAccessToken,
    checkRole(ROLES.ADMIN),
    BookController.bulkCreateBooks
)

router.put('/:id',
    verifyAccessToken,
    checkRole(ROLES.ADMIN),
    BookController.updateBook
)

router.delete('/:id',
    verifyAccessToken,
    checkRole(ROLES.ADMIN),
    BookController.deleteBook
)

module.exports = router