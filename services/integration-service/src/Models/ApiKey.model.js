const mongoose = require('mongoose')
const crypto = require('crypto')

const apiKeySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    clientName: {
        type: String,
        required: true
    },
    permissions: [{
        type: String,
        enum: ['read', 'write', 'admin'],
        default: ['read']
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastUsed: Date,
    quotaLimit: {
        type: Number,
        default: 1000 // requests per month
    },
    quotaUsed: {
        type: Number,
        default: 0
    },
    quotaResetDate: Date
}, { timestamps: true })

apiKeySchema.statics.generate = async function(clientName, permissions = ['read']) {
    const key = crypto.randomBytes(32).toString('hex')
    return this.create({
        key,
        clientName,
        permissions,
        quotaResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    })
}

module.exports = mongoose.model('ApiKey', apiKeySchema)