const express = require('express')
const router = express.Router()
const AuthController = require('../Controllers/Auth.Controller')
const { verifyAccessToken } = require('../helpers/jwt_helper')
const {ROLES} = require('../../../shared/auth')

router.post('/register', AuthController.register)


router.post('/login', AuthController.login)

router.post('/refresh-token', AuthController.refreshToken)

router.delete('/logout', AuthController.logout)
router.post('/verify-token', AuthController.verifyToken)
router.post('/register-service',verifyAccessToken, AuthController.registerService)

router.post('/create-admin',
    verifyAccessToken,
    (req, res, next) => {
        if (req.payload.role !== ROLES.ADMIN) {
            throw createError.Forbidden('Only admins can create other admins')
        }
        next()
    },
     AuthController.createAdmin)


module.exports = router