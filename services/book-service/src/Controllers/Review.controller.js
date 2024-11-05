const createError = require('http-errors')
const Review = require('../models/Review.model')
const Book = require('../models/Book.model')

module.exports = {
    // Create review
    createReview: async (req, res, next) => {
        try {
            const { bookId } = req.params
            const userId = req.payload.userId
            
            // Check if user already reviewed this book
            const existingReview = await Review.findOne({ bookId, userId })
            if (existingReview) {
                throw createError.Conflict('You have already reviewed this book')
            }
            
            const review = new Review({
                ...req.body,
                bookId,
                userId
            })
            
            const savedReview = await review.save()
            
            // Update book metadata
            await Book.findByIdAndUpdate(bookId, {
                $inc: {
                    'metadata.popularity.reviewCount': 1
                },
                $set: {
                    'metadata.popularity.rating': await calculateAverageRating(bookId)
                }
            })
            
            res.status(201).json(savedReview)
        } catch (error) {
            next(error)
        }
    },

    // Vote on review
    voteReview: async (req, res, next) => {
        try {
            const { reviewId } = req.params
            const { voteType } = req.body // 'upvote' or 'downvote'
            const userId = req.payload.userId
            
            const review = await Review.findById(reviewId)
            if (!review) throw createError.NotFound('Review not found')
            
            // Remove any existing votes by this user
            review.votes.upvotes.pull(userId)
            review.votes.downvotes.pull(userId)
            
            // Add new vote
            if (voteType === 'upvote') {
                review.votes.upvotes.push(userId)
            } else if (voteType === 'downvote') {
                review.votes.downvotes.push(userId)
            }
            
            await review.save()
            res.json(review)
        } catch (error) {
            next(error)
        }
    },

    // Report review
    reportReview: async (req, res, next) => {
        try {
            const { reviewId } = req.params
            const { reason } = req.body
            const userId = req.payload.userId
            
            const review = await Review.findById(reviewId)
            if (!review) throw createError.NotFound('Review not found')
            
            // Add report
            review.reported.isReported = true
            review.reported.reports.push({
                userId,
                reason,
                timestamp: new Date()
            })
            
            await review.save()
            res.json({ message: 'Review reported successfully' })
        } catch (error) {
            next(error)
        }
    }
}

// Helper function to calculate average rating
async function calculateAverageRating(bookId) {
    const result = await Review.aggregate([
        { $match: { bookId: mongoose.Types.ObjectId(bookId) } },
        { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ])
    return result[0]?.averageRating || 0
}
