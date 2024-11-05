const createError = require('http-errors')
const User = require('../Models/User.model')
const {authSchema, loginSchema} = require('../helpers/validation_schema')
const {signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken} = require('../helpers/jwt_helper')
const client = require('../helpers/init_redis')
const { ROLES } = require('../../../shared/auth')
module.exports = {
    registerService: async (req, res, next) => {
        try {
            // Check payload instead of user
            if (!req.payload || req.payload.role !== ROLES.ADMIN) {
                throw createError.Unauthorized('Only admins can register service accounts')
            }
    
            const { email, password, name } = req.body
    
            // Validate input
            if (!email || !password || !name) {
                throw createError.BadRequest('All fields are required')
            }
    
            const exists = await User.findOne({ email })
            if (exists) {
                throw createError.Conflict('Service account already exists')
            }
    
            const user = new User({
                email,
                password,
                name,
                role: ROLES.SERVICE
            })
            
            const savedUser = await user.save()
            
            res.status(201).json({
                message: 'Service account created successfully',
                service: {
                    email: savedUser.email,
                    name: savedUser.name,
                    role: savedUser.role
                }
            })
        } catch (error) {
            next(error)
        }
    },
    register: async(req,res,next) => {
    
        try {
    
            const result = await authSchema.validateAsync(req.body)
            
            
            const doesExist = await User.findOne({email: result.email})
            if (doesExist) 
                throw createError.Conflict(`${result.email} is already been registered`)
            
            const user = new User(result)
            const savedUser = await user.save()
            const accessToken = await signAccessToken(savedUser.id, savedUser.role)
            const refreshToken = await signRefreshToken(savedUser.id)
    
            res.send({accessToken, refreshToken})
            
             
        }catch(error){
            if(error.isJoi === true) error.status = 422
            next(error)
        }
    },
    login:async(req,res,next) => {
        try{
            const result = await loginSchema.validateAsync(req.body)
    
            const user = await User.findOne({email: result.email})
            if(!user) throw createError.NotFound('User not registered')
            const isMatch = await user.isValidPassword(result.password)
            if(!isMatch) throw createError.Unauthorized('Username/password not valid')
            
            const accessToken = await signAccessToken(user.id, user.role)
            const refreshToken = await signRefreshToken(user.id)
            res.send({accessToken,refreshToken})
    
        }catch(error){
            if(error.isJoi === true) return next(createError.BadRequest('Invalid username or password'))
            next(error)
        }
    },
    refreshToken:async(req,res,next) => {
        try{
            const {refreshToken} = req.body
            if(!refreshToken) throw createError.BadRequest()
    
            const userId = await verifyRefreshToken(refreshToken)
            const user = await User.findById(userId)
            const accessToken = await signAccessToken(userId,user.role)
            const newRefreshToken = await signRefreshToken(userId)
            res.send({accessToken, refreshToken: newRefreshToken})
    
        }catch(error){
            next(error)
        }
    },
    logout: async(req,res,next) => {
        try{
            const {refreshToken} = req.body
            if(!refreshToken) throw createError.BadRequest()
    
            const userId = await verifyRefreshToken(refreshToken)
            client.DEL(userId, (err,value) => {
                if(err) {
                    console.log(err.message)
                    throw createError.InternalServerError()
                }
                console.log(value)
                res.sendStatus(204)
    
            })
        }catch(error){
            next(error)
        }
    },
    verifyToken: async(req, res, next) => {
        verifyAccessToken(req, res, (err)=> {
            if(err) return next(err)
            res.json({payload: req.payload})
        })
    }
}
