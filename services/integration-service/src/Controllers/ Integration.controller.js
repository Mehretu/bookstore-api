const createError = require('http-errors')
const axios = require('axios')
const { trace } = require('@opentelemetry/api')

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000/auth'
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:6000/api'

let authToken = null
let refreshToken = null

const IntegrationController = {
    generateServiceToken: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'generate_service_token')
            
            // Check if we have service credentials in env
            if (!process.env.SERVICE_EMAIL || !process.env.SERVICE_PASSWORD) {
                throw createError.InternalServerError('Service credentials not configured')
            }
            
            // Use service credentials from .env
            const response = await axios.post(`${AUTH_SERVICE_URL}/login`, {
                email: process.env.SERVICE_EMAIL,
                password: process.env.SERVICE_PASSWORD
            })

            authToken = response.data.accessToken
            refreshToken = response.data.refreshToken

            res.json({
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken
            })
        } catch (error) {
            console.error('Auth error:', error.response?.data || error.message)
            span.recordException(error)
            if (error.response?.status === 401) {
                next(createError.Unauthorized('Invalid service credentials'))
            } else {
                next(error)
            }
        }
    },

    getBooks: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'get_books')
            
            const token = req.headers.authorization
            if (!token) {
                throw createError.Unauthorized('Token is required')
            }
            
            // Call book service with client's token
            const response = await axios.get(`${BOOK_SERVICE_URL}/books`, {
                headers: {
                    'Authorization': token
                },
                params: req.query
            })

            res.json(response.data)
        } catch (error) {
            span.recordException(error)
            next(error)
        }
    },

    bulkCreateBooks: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'bulk_create_books')
            
            // Get token from request header
            const token = req.headers.authorization
            if (!token) {
                throw createError.Unauthorized('Token is required')
            }
            
            const response = await axios.post(
                `${BOOK_SERVICE_URL}/books/bulk`,
                req.body,
                {
                    headers: {
                        'Authorization': token
                    }
                }
            )

            res.status(201).json(response.data)
        } catch (error) {
            span.recordException(error)
            next(error)
        }
    }
}

module.exports = IntegrationController