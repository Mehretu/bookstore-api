const express = require('express')
const router = express.Router()
const AuthController = require('../Controllers/Auth.Controller')
const { verifyAccessToken } = require('../helpers/jwt_helper')

router.post('/register', AuthController.register)


router.post('/login', AuthController.login)

router.post('/refresh-token', AuthController.refreshToken)

router.delete('/logout', AuthController.logout)
router.post('/verify-token', AuthController.verifyToken)
router.post('/register-service',verifyAccessToken, AuthController.registerService)



module.exports = router