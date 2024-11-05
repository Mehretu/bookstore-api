const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    type: {
        type: String,
        enum: ['NEW_BOOK', 'PRICE_DROP', 'NEW_REVIEW'],
        required: true
    },
    data: {
        bookId: mongoose.Schema.Types.ObjectId,
        title: String,
        author: String,
        category: String,
        price: Number,
        genre: [String],
        rating: Number,
        message: String
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Notification', notificationSchema)