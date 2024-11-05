const createError = require('http-errors')
const mongoose = require('mongoose')
const Review = require('../Models/Review.model')
const Book = require('../Models/Book.model')

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
                
                try {
                    // Update book metadata
                    const averageRating = await calculateAverageRating(bookId)
                    await Book.findByIdAndUpdate(bookId, {
                        $inc: {
                            'metadata.popularity.reviewCount': 1
                        },
                        $set: {
                            'metadata.popularity.rating': averageRating
                        }
                    })
                } catch (error) {
                    console.log('Error updating book metadata:', error)
                    // Don't throw error as review is already saved
                }
                
                res.status(201).json(savedReview)
            } catch (error) {
                next(error)
            }
        },
        // Get reviews for a book
        getBookReviews: async (req, res, next) => {
            try {
                const { bookId } = req.params
                const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    
                const reviews = await Review.find({ bookId })
                    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                    .limit(limit * 1)
                    .skip((page - 1) * limit)
                    .populate('userId', 'name email') // Assuming you want user details
    
                const total = await Review.countDocuments({ bookId })
    
                res.json({
                    reviews,
                    totalPages: Math.ceil(total / limit),
                    currentPage: parseInt(page)
                })
            } catch (error) {
                next(error)
            }
        },
      // Update review
      updateReview: async (req, res, next) => {
        try {
            const { reviewId } = req.params
            const userId = req.payload.userId

            const review = await Review.findById(reviewId)
            if (!review) throw createError.NotFound('Review not found')
            
            // Check if user owns the review
            if (review.userId.toString() !== userId) {
                throw createError.Forbidden('You can only update your own reviews')
            }

            // Update allowed fields only
            const allowedUpdates = ['rating', 'title', 'content', 'tags']
            const updates = Object.keys(req.body)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                    obj[key] = req.body[key]
                    return obj
                }, {})

            const updatedReview = await Review.findByIdAndUpdate(
                reviewId,
                updates,
                { new: true, runValidators: true }
            )

            // Update book rating if rating changed
            if (req.body.rating) {
                await Book.findByIdAndUpdate(review.bookId, {
                    $set: {
                        'metadata.popularity.rating': await calculateAverageRating(review.bookId)
                    }
                })
            }

            res.json(updatedReview)
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
            
            // Check if user has already voted
            const hasUpvoted = review.votes.upvotes.includes(userId)
            const hasDownvoted = review.votes.downvotes.includes(userId)

            // Handle vote toggling
            if (voteType === 'upvote') {
                if (hasUpvoted) {
                    // If already upvoted, remove the upvote (toggle off)
                    review.votes.upvotes.pull(userId)
                } else {
                    // Add upvote and remove any existing downvote
                    review.votes.downvotes.pull(userId)
                    review.votes.upvotes.push(userId)
                }
            } else if (voteType === 'downvote') {
                if (hasDownvoted) {
                    // If already downvoted, remove the downvote (toggle off)
                    review.votes.downvotes.pull(userId)
                } else {
                    // Add downvote and remove any existing upvote
                    review.votes.upvotes.pull(userId)
                    review.votes.downvotes.push(userId)
                }
            }
            
            await review.save()

            // Return vote counts in response
            res.json({
                message: 'Vote recorded successfully',
                review: {
                    id: review._id,
                    upvotes: review.votes.upvotes.length,
                    downvotes: review.votes.downvotes.length,
                    userVote: hasUpvoted ? null : (hasDownvoted ? null : voteType) // Shows if vote was added or removed
                }
            })
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
    },
        // Get reported reviews (Admin only)
        getReportedReviews: async (req, res, next) => {
            try {
                const { page = 1, limit = 10 } = req.query
    
                const reviews = await Review.find({ 'reported.isReported': true })
                    .sort({ 'reported.reports.timestamp': -1 })
                    .limit(limit * 1)
                    .skip((page - 1) * limit)
                    .populate('userId', 'name email')
    
                const total = await Review.countDocuments({ 'reported.isReported': true })
    
                res.json({
                    reviews,
                    totalPages: Math.ceil(total / limit),
                    currentPage: parseInt(page)
                })
            } catch (error) {
                next(error)
            }
        },
      // Handle reported review (Admin only)
      handleReportedReview: async (req, res, next) => {
        try {
            const { reviewId } = req.params
            const { action, note } = req.body
            const adminId = req.payload.userId

            const review = await Review.findById(reviewId)
            if (!review) throw createError.NotFound('Review not found')

            if (action === 'remove') {
                // Delete the review
                await Review.findByIdAndDelete(reviewId)
                
                // Update book metadata
                await Book.findByIdAndUpdate(review.bookId, {
                    $inc: {
                        'metadata.popularity.reviewCount': -1
                    },
                    $set: {
                        'metadata.popularity.rating': await calculateAverageRating(review.bookId)
                    }
                })

                res.json({ message: 'Review removed successfully' })
            } else if (action === 'dismiss') {
                // Clear reported status
                review.reported.isReported = false
                review.reported.handledBy = {
                    adminId,
                    action,
                    note,
                    timestamp: new Date()
                }
                await review.save()
                res.json({ message: 'Report dismissed successfully' })
            } else {
                throw createError.BadRequest('Invalid action')
            }
        } catch (error) {
            next(error)
        }
    },
        // Delete review
        deleteReview: async (req, res, next) => {
            try {
                const { reviewId } = req.params
                const userId = req.payload.userId
    
                const review = await Review.findById(reviewId)
                if (!review) throw createError.NotFound('Review not found')
    
                // Check if user owns the review
                if (review.userId.toString() !== userId) {
                    throw createError.Forbidden('You can only delete your own reviews')
                }
    
                await Review.findByIdAndDelete(reviewId)
    
                // Update book metadata
                await Book.findByIdAndUpdate(review.bookId, {
                    $inc: {
                        'metadata.popularity.reviewCount': -1
                    },
                    $set: {
                        'metadata.popularity.rating': await calculateAverageRating(review.bookId)
                    }
                })
    
                res.json({ message: 'Review deleted successfully' })
            } catch (error) {
                next(error)
            }
        },
}
// Helper function to calculate average rating
async function calculateAverageRating(bookId) {
    try {
        const result = await Review.aggregate([
            { 
                $match: { 
                    bookId: new mongoose.Types.ObjectId(bookId) 
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    averageRating: { $avg: '$rating' } 
                } 
            }
        ])
        return result[0]?.averageRating || 0
    } catch (error) {
        console.log('Error calculating average rating:', error)
        return 0
    }
}
