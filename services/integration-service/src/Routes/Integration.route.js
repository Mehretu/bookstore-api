const router = require('express').Router()
const IntegrationController = require('../Controllers/ Integration.controller')

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})



router.post('/token', IntegrationController.generateServiceToken)


router.get('/books', IntegrationController.getBooks)
router.post('/books/bulk', IntegrationController.bulkCreateBooks)

module.exports = router