const router = require('express').Router()
const IntegrationController = require('../Controllers/Integration.controller')
const { verifyAccessToken } = require('../Middleware/auth.middleware')

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})


/**
 * @swagger
 * /token:
 *   post:
 *     summary: Generate service authentication token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Service token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 */
router.post('/token', IntegrationController.generateServiceToken)

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for books
 *     responses:
 *       200:
 *         description: List of books
 *       401:
 *         description: Unauthorized
 */
router.get('/books',verifyAccessToken,IntegrationController.getBooks)
/**
 * @swagger
 * /books/bulk:
 *   post:
 *     summary: Bulk create books
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               books:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     author:
 *                       type: string
 *                     price:
 *                       type: number
 *                     isbn:
 *                       type: string
 *     responses:
 *       201:
 *         description: Books created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/books/bulk',verifyAccessToken, IntegrationController.bulkCreateBooks)

module.exports = router