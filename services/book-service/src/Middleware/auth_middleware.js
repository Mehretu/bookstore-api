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

        req.payload = response.data.payload
        

        next()
    } catch (error) {
        if (error.response) {
            return next(createError(error.response.status, error.response.data.error.message))
        }
        next(error)
    }
}
const checkRole = (allowedRoles) => (req, res, next) => {
    try {
        const userRole = req.payload.role
        if (!allowedRoles.includes(userRole)) {
            throw createError.Forbidden(`Role ${userRole} is not allowed to access this resource`)
        }
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = { verifyAccessToken, checkRole }