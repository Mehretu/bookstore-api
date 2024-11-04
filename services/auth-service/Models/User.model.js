const mongoose = require('mongoose')
const { unique } = require('next/dist/build/utils')
const { type } = require('os')
const Schema = mongoose.Schema


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
    }
})

const User = mongoose.model('user', UserSchema)
module.exports = User