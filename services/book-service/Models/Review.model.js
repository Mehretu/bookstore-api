const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ReviewSchema = new Schema({
    bookId: {
        type: Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    votes:{
        upvotes: [{
            type: [Schema.Types.ObjectId],
            ref: 'User'
        }],
        downvotes: [{
            type: [Schema.Types.ObjectId],
            ref: 'User'
        }]
    },
    reported:{
        isReported: {
            type: Boolean,
            default: false
        },
        reports:[{
            userId: String,
            reason: String,
            timestamp: Date
        }],
        status: {
            type: String,
            enum: ['PENDING', 'REVIEWED', 'RESOLVED'],
            default: 'PENDING'
        }
    }
    
},{
    timestamps: true
})

module.exports = mongoose.model('Review', ReviewSchema)