const createError = require('http-errors')
const jwt = require('jsonwebtoken')
const VaultHelper = require('../helpers/vault-helper')

module.exports = {
    verifyAccessToken: async (req, res, next) => {
        if (!req.headers['authorization']) {
            return next(createError.Unauthorized())
        }

        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]

        const jwtConfig = await VaultHelper.readSecret('jwt')

        jwt.verify(token, jwtConfig.access_token_secret, (err, payload) => {
            if (err) {
                return next(createError.Unauthorized())
            }
            
            if (payload.role !== 'service') {
                return next(createError.Forbidden('Only service accounts allowed'))
            }

            req.payload = payload
            next()
        })
    }
}