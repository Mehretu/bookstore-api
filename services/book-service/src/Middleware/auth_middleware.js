const axios = require('axios')
const createError = require('http-errors')

const verifyAccessToken = async (req, res, next) => {
    try {
        if (!req.headers['authorization']) {
            return next(createError.Unauthorized())
        }

        const token = req.headers['authorization']

        const response = await axios.post(
            `${process.env.AUTH_SERVICE_URL}/auth/verify-token`,
            {},  // empty body
            {
                headers: {
                    'Authorization': token
                }
            }
        )

        // Set the verified payload from auth service to req.payload
        req.payload = response.data.payload
        
        // Now you can use req.payload.role for role-based access
        // And uncomment the checkRole middleware in your routes
        next()
    } catch (error) {
        if (error.response) {
            return next(createError(error.response.status, error.response.data.error.message))
        }
        next(error)
    }
}

module.exports = { verifyAccessToken }