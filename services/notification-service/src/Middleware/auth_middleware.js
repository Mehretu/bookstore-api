const axios = require('axios')
const createError = require('http-errors')

const verifyAccessToken = async (req, res, next) => {
    try {
        if (!req.headers['authorization']) {
            return next(createError.Unauthorized())
        }

        const token = req.headers['authorization']

        if(!global.AUTH_SERVICE_URL){
            console.error('AUTH_SERVICE_URL is not set')
            return next(createError.InternalServerError('Auth service configuration is missing'))
        }

        const response = await axios.post(
            `${global.AUTH_SERVICE_URL}/auth/verify-token`,
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
        console.error('Token verification error:', {
            message:error.message,
            response:error.response?.data,
            code:error.code

        })
        if (error.response) {
            return next(createError(error.response.status, error.response.data.error.message))
        }
        if(error.code === 'ECONNREFUSED'){
            return next(createError.ServiceUnavailable('Auth service is not available'))
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