const mongoose = require('mongoose')
const { unique } = require('next/dist/build/utils')
const { type } = require('os')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')
const {ROLES,PERMISSIONS} = require('../../../shared/auth')


const UserSchema = new Schema({
    email:{
        type:String,
        required: true,
        lowercase: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER
    }
})

UserSchema.pre('save', async function (next){
    try{
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(this.password, salt)
        this.password = hashedPassword
        next()

    }catch(error){
        next(error)
    }

})
UserSchema.methods.isValidPassword = async function (password){
    try{
        return await bcrypt.compare(password, this.password)
    }catch(error){
        throw error
    }
}

UserSchema.methods.isAdmin = function(){
    return this.role === ROLES.ADMIN
}

UserSchema.methods.hasPermission = function(permission){
    return PERMISSIONS[this.role].includes(permission)
}


const User = mongoose.model('user', UserSchema)
module.exports = User
