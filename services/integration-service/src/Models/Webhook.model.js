const mongoose = require('mongoose')

const webhookSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+/.test(v)
            },
            message: 'URL must be a valid HTTP/HTTPS endpoint'
        }
    },
    events: [{
        type: String,
        enum: ['book.created', 'book.updated', 'order.created', 'review.created']
    }],
    apiKeyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ApiKey',
        required: true
    },
    metadata: {
        type: Map,
        of: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    failureCount: {
        type: Number,
        default: 0
    },
    lastFailure: {
        timestamp: Date,
        error: String
    }
}, { timestamps: true })

module.exports = mongoose.model('Webhook', webhookSchema)