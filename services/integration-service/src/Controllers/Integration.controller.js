const createError = require('http-errors')
const axios = require('axios')
const BookService = require('../services/BookService')
const VaultHelper = require('../helpers/vault-helper')

const IntegrationController = {
    // Get service token using service account
    generateServiceToken: async (req, res, next) => {
        try {
            // Get credentials from Vault
            const credentials = await VaultHelper.readSecret('credentials')
            const services = await VaultHelper.readSecret('services')

            console.log('Auth_URL:', services.auth_url)
            console.log("Service Email:", credentials.service_email)

            // Make login request to auth service
            const response = await axios.post(`${services.auth_url}/login`, {
                email: credentials.service_email,
                password: credentials.service_password
            })

            res.json({
                success: true,
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken
            })
        } catch (error) {
            console.error('Service token generation error:', 
                error.response?.data || error.message,
                '\nStatus:', error.response?.staus,
                '\nURL:', error.config?.url
            )
            if(error.response?.status === 404){
                next(createError(404, 'Auth service endpoint not found'))
            }else{
                next(error)
            }
        }
    },

    // Get books using service token
    getBooks: async (req, res, next) => {
        try {
            const bookService = new BookService(req.payload.token)
            const books = await bookService.getBooks(req.query)
            
            res.json({
                success: true,
                data: books
            })
        } catch (error) {
            next(error)
        }
    },

    // Bulk create books
    bulkCreateBooks: async (req, res, next) => {
        try {
            if (!Array.isArray(req.body.books)) {
                throw createError.BadRequest('Books array is required')
            }

            const bookService = new BookService(req.payload.token)
            const result = await bookService.bulkCreateBooks(req.body.books)
            
            res.status(201).json({
                success: true,
                message: 'Books created successfully',
                data: result
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = IntegrationController