const JWT = require('jsonwebtoken')
const createError = require('http-errors')
const client = require('./init_redis')
const {ROLES, PERMISSIONS} = require('../../../shared/auth')

module.exports = {
    signAccessToken: (userId, role = ROLES.USER) => {
        return new Promise((resolve, reject) => {
            const payload = {
                userId,
                role,
                permissions: PERMISSIONS[role]
                
            }
            const secret = process.env.ACCESS_TOKEN_SECRET
            const options = {
                expiresIn: "30m",
                issuer: "mehretu.com",
                audience: userId
            }
            JWT.sign(payload,secret,options,(err,token) => {
                if(err) {
                    console.log(err.message)
                    reject(createError.InternalServerError())
                }
                resolve(token)
            })
        })
    },
    verifyAccessToken: (req, res, next) => {
        if(!req.headers['authorization']) 
            return next(createError.Unauthorized())
        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]

        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if(err) {   
                 const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
                 return next(createError.Unauthorized(message))   
            }
            req.payload = payload
            next()
        })
    },

    signRefreshToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {
                
            }
            const secret = process.env.REFRESH_TOKEN_SECRET
            const options = {
                expiresIn: "30d",
                issuer: "mehretu.com",
                audience: userId
            }
            JWT.sign(payload,secret,options,(err,token) => {
                if(err) {
                    console.log(err.message)
                    reject(createError.InternalServerError())
                }
                client.set(userId,token, 'EX', 30*24*60*60, (err,reply) => {
                    if(err) {
                        console.log(err.message)
                        reject(createError.InternalServerError())
                        return

                    }
                    resolve(token)
                })
            })
        })
    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
                if(err) return reject(createError.Unauthorized())
                const userId = payload.aud
                
                client.GET(userId,(err,result) => {
                    if(err){
                        console.log(err.message)
                        reject(createError.InternalServerError)
                        return
                    }
                    if (refreshToken === result) return resolve(userId)
                        reject(createError.Unauthorized)
                })
            })
        })
    },

    checkRole: (allowedRoles) => (req, res, next) => {
        try{
            const userRole = req.payload.role
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
            if(!roles.includes(userRole))
                throw createError.Forbidden(`Role ${userRole} is not allowed to access this resource`)
            next()
        }catch(error){
            next(error)
        }
    },
    checkPermission: (requiredPermission) => (req, res, next) => {
        try{
            const userRole = req.payload.role
            const userPermissions = PERMISSIONS[userRole]

            if(!userPermissions || !userPermissions.includes(requiredPermission)){
                throw createError.Forbidden(`Permission ${requiredPermission} is not allowed to access this resource`)
            }
            next()
        }catch(error){
            next(error)
        }
    }



}