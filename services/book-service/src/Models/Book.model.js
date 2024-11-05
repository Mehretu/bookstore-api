const mongoose = require('mongoose')

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    isbn: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['FICTION', 'NON_FICTION', 'BIOGRAPHY', 'SELF_HELP', 'TECHNOLOGY','HISTORY','MATH','SCIENCE','RELIGION','OTHER']
    },
    price: {
        type: Number,
        required: true
    },
    metadata: {
        popularity: {
            rating: {
                type:Number,
                default:0
            },
           reviewCount: {
                type:Number,
                default:0
            }
        },
        genre: [String]
    }
},{
    timestamps: true,
    toJSON: {
        virtuals: true
    }
})

module.exports = mongoose.model('Book', BookSchema)