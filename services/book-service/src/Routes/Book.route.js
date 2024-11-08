const router = require('express').Router()
const BookController = require('../Controllers/Book.controller')
const { verifyAccessToken,checkRole } = require('../Middleware/auth_middleware')
const { ROLES } = require('../../../../shared/auth')
// Public routes
router.get('/', BookController.getBooks)
router.get('/:id', BookController.getBookById)


router.post('/',
    verifyAccessToken,
    checkRole([ROLES.ADMIN]), 
    BookController.createBook
)

router.post('/bulk',
    verifyAccessToken,
    checkRole([ROLES.ADMIN]),
    BookController.bulkCreateBooks
)

router.put('/:id',
    verifyAccessToken,
    checkRole([ROLES.ADMIN]),
    BookController.updateBook
)

router.delete('/:id',
    verifyAccessToken,
    checkRole([ROLES.ADMIN]),
    BookController.deleteBook
)

module.exports = router