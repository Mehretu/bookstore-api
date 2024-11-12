const router = require('express').Router()
const IntegrationController = require('../Controllers/Integration.controller')
const { verifyAccessToken } = require('../Middleware/auth.middleware')

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})



router.post('/token', IntegrationController.generateServiceToken)


router.get('/books',verifyAccessToken,IntegrationController.getBooks)
router.post('/books/bulk',verifyAccessToken, IntegrationController.bulkCreateBooks)

module.exports = router