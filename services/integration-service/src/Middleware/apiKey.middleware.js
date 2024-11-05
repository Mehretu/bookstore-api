const createError = require('http-errors')
const ApiKey = require('../Models/ApiKey.model')
const { trace } = require('@opentelemetry/api')

const validateApiKey = async (req, res, next) => {
    const span = trace.getActiveSpan()
    try {
        const apiKey = req.headers['x-api-key']
        if (!apiKey) {
            throw createError.Unauthorized('API key is required')
        }

        const key = await ApiKey.findOne({ key: apiKey, isActive: true })
        if (!key) {
            throw createError.Unauthorized('Invalid API key')
        }

        // Check quota
        if (key.quotaUsed >= key.quotaLimit) {
            throw createError.TooManyRequests('Monthly quota exceeded')
        }

        // Update usage
        await ApiKey.findByIdAndUpdate(key._id, {
            $inc: { quotaUsed: 1 },
            lastUsed: new Date()
        })

        req.apiKey = key
        span.setAttribute('client_name', key.clientName)
        next()
    } catch (error) {
        span.recordException(error)
        next(error)
    }
}

module.exports = { validateApiKey }