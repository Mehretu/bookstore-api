const JWT = require('jsonwebtoken')
const createError = require('http-errors')
const client = require('./init_redis')
const {ROLES, PERMISSIONS} = require('../../../shared/auth')
const vault_helper = require('./vault_helper')

let ACCESS_TOKEN_SECRET
let REFRESH_TOKEN_SECRET

async function initializeSecrets() {
    try{
        const jwtSecrets = await vault_helper.readSecret('jwt')
        ACCESS_TOKEN_SECRET = jwtSecrets.access_token_secret
        REFRESH_TOKEN_SECRET = jwtSecrets.refresh_token_secret
        if(!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET){
            throw new Error('Failed to load JWT secrets from Vault')
        }
        console.log('JWT secrets loaded from Vault')
    } catch (error) {
        console.error('Failed to load JWT secrets from Vault:', error)
        throw error
    }
}

initializeSecrets()

module.exports = {
    initializeSecrets,
    signAccessToken: (userId, role = ROLES.USER) => {
        return new Promise((resolve, reject) => {
            const payload = {
                userId,
                role,
                permissions: PERMISSIONS[role]
                
            }
            console.log('Using ACCESS_TOKEN_SECRET:', !!ACCESS_TOKEN_SECRET)
            if(!ACCESS_TOKEN_SECRET){
                return reject(createError.InternalServerError('JWT secret not found'))
            }
            const options = {
                expiresIn: "30m",
                issuer: "mehretu.com",
                audience: userId
            }
            JWT.sign(payload,ACCESS_TOKEN_SECRET,options,(err,token) => {
                if(err) {
                    console.log('JWT sign error:', err.message)
                    reject(createError.InternalServerError())
                    return
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

        JWT.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
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
            const secret = REFRESH_TOKEN_SECRET
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
            JWT.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, payload) => {
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