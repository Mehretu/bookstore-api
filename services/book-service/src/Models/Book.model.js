const mongoose = require('mongoose')

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    isbn: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    author: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        
    },
    category: {
        type: String,
        required: true,
        enum: ['FICTION', 'NON_FICTION', 'BIOGRAPHY', 'SELF_HELP', 'TECHNOLOGY','HISTORY','MATH','SCIENCE','RELIGION','OTHER'],
        index: true
    },
    price: {
        type: Number,
        required: true,
        index: true

    },
    metadata: {
        popularity: {
            rating: {
                type:Number,
                default:0,
                index: true
            },
           reviewCount: {
                type:Number,
                default:0
            }
        },
        genre: [{
            type: String,
            index: true
        }],
    }
},{
    timestamps: true,
    toJSON: {
        virtuals: true
    }
})

BookSchema.index({ category: 1, 'metadata.rating': -1 })
BookSchema.index({ 'metadata.genre': 1, price: 1 })


BookSchema.index({ 
    title: 'text', 
    description: 'text', 
    author: 'text' 
}, {
    weights: {
        title: 10,     
        author: 5,      
        description: 1  
    }
})

module.exports = mongoose.model('Book', BookSchema)