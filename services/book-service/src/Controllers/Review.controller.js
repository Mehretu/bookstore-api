const createError = require('http-errors')
const mongoose = require('mongoose')
const Review = require('../Models/Review.model')
const Book = require('../Models/Book.model')
const { trace } = require('@opentelemetry/api')

module.exports = {
        // Create review
        createReview: async (req, res, next) => {
            const span = trace.getActiveSpan()
            try {
                span.setAttribute('operation', 'create_review')
                const { bookId } = req.params
                const userId = req.payload.userId

                span.setAttributes({
                    'book.id': bookId,
                    'user.id': userId,
                    'review.rating': req.body.rating
                })
                
                // Check if user already reviewed this book
                const existingReview = await Review.findOne({ bookId, userId })
                if (existingReview) {
                    span.setAttribute('error', 'Review already exists')
                    throw createError.Conflict('You have already reviewed this book')
                }
                
                const review = new Review({
                    ...req.body,
                    bookId,
                    userId
                })
                
                const savedReview = await review.save()
                span.setAttribute('review.id', savedReview._id.toString())
                
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
                    span.setAttribute('book.new_rating', averageRating)
                } catch (error) {
                    span.recordException(error)
                    console.log('Error updating book metadata:', error)
                    // Don't throw error as review is already saved
                }
                span.setAttribute('success', true)
                res.status(201).json(savedReview)
            } catch (error) {
                span.recordException(error)
                next(error)
            }
        },
        // Get reviews for a book
        getBookReviews: async (req, res, next) => {
            const span = trace.getActiveSpan()
            try {
                const { bookId } = req.params
                const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
                span.setAttributes({
                    'operation': 'get_book_reviews',
                    'book.id': bookId,
                    'query.page': page,
                    'query.limit': limit,
                    'query.sortBy': sortBy,
                    'query.sortOrder': sortOrder
                })
    
                const reviews = await Review.find({ bookId })
                    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                    .limit(limit * 1)
                    .skip((page - 1) * limit)
                    .populate('userId', 'name email') 
    
                const total = await Review.countDocuments({ bookId })

                span.setAttributes({
                    'reviews.count': reviews.length,
                    'reviews.total': total,
                    'success': true
                })
    
                res.json({
                    reviews,
                    totalPages: Math.ceil(total / limit),
                    currentPage: parseInt(page)
                })
            } catch (error) {
                span.recordException(error)
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


    voteReview: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            const { reviewId } = req.params
            const { voteType } = req.body
            const userId = req.payload.userId

            span.setAttributes({
                'operation': 'vote_review',
                'review.id': reviewId,
                'user.id': userId,
                'vote.type': voteType
            })

            const review = await Review.findById(reviewId)
            if (!review) {
                span.setAttribute('error', 'review_not_found')
                throw createError.NotFound('Review not found')
            }

            const hasUpvoted = review.votes.upvotes.includes(userId)
            const hasDownvoted = review.votes.downvotes.includes(userId)

            span.setAttributes({
                'vote.previous_upvoted': hasUpvoted,
                'vote.previous_downvoted': hasDownvoted
            })

            // Handle vote logic...
            if (voteType === 'upvote') {
                if (hasUpvoted) {
                    review.votes.upvotes.pull(userId)
                } else {
                    review.votes.downvotes.pull(userId)
                    review.votes.upvotes.push(userId)
                }
            } else if (voteType === 'downvote') {
                if (hasDownvoted) {
                    review.votes.downvotes.pull(userId)
                } else {
                    review.votes.upvotes.pull(userId)
                    review.votes.downvotes.push(userId)
                }
            }

            await review.save()

            span.setAttributes({
                'vote.final_upvotes': review.votes.upvotes.length,
                'vote.final_downvotes': review.votes.downvotes.length,
                'success': true
            })

            res.json({
                message: 'Vote recorded successfully',
                review: {
                    id: review._id,
                    upvotes: review.votes.upvotes.length,
                    downvotes: review.votes.downvotes.length,
                    userVote: hasUpvoted ? null : (hasDownvoted ? null : voteType)
                }
            })
        } catch (error) {
            span.recordException(error)
            next(error)
        }
    },

    // Report review
    reportReview: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'report_review')
            const { reviewId } = req.params
            const { reason } = req.body
            const userId = req.payload.userId

            span.setAttributes({
                'review.id': reviewId,
                'user.id': userId,
                'report.reason': reason
            })

            const review = await Review.findById(reviewId)
            if (!review) {
                span.setAttribute('error', 'review_not_found')
                throw createError.NotFound('Review not found')
            }
            
            // Add report
            review.reported.isReported = true
            review.reported.reports.push({
                userId,
                reason,
                timestamp: new Date()
            })

            span.setAttributes({
                'success': true
            })
            
            await review.save()
            res.json({ message: 'Review reported successfully' })
        } catch (error) {
            span.recordException(error)
            next(error)
        }
    },
        // Get reported reviews (Admin only)
        getReportedReviews: async (req, res, next) => {
            const span = trace.getActiveSpan()
            try {
                span.setAttribute('operation', 'get_reported_reviews')
                const { page = 1, limit = 10 } = req.query
                span.setAttributes({
                    'query.page': page,
                    'query.limit': limit
                })
    
                const reviews = await Review.find({ 'reported.isReported': true })
                    .sort({ 'reported.reports.timestamp': -1 })
                    .limit(limit * 1)
                    .skip((page - 1) * limit)
                    .populate('userId', 'name email')

                span.setAttributes({
                    'reviews.count': reviews.length,
                    'success': true
                })

                const total = await Review.countDocuments({ 'reported.isReported': true })

                span.setAttributes({
                    'reviews.total': total,
                })
    
                res.json({
                    reviews,
                    totalPages: Math.ceil(total / limit),
                    currentPage: parseInt(page)
                })
            } catch (error) {
                span.recordException(error)
                next(error)
            }
        },
      // Handle reported review (Admin only)
      handleReportedReview: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'handle_reported_review')
            const { reviewId } = req.params
            const { action, note } = req.body
            const adminId = req.payload.userId

            const review = await Review.findById(reviewId)
            if (!review) {
                span.setAttribute('error', 'review_not_found')
                throw createError.NotFound('Review not found')
            }

            if (action === 'remove') {
                // Delete the review
                await Review.findByIdAndDelete(reviewId)

                span.setAttributes({
                    'success': true
                })
                
                // Update book metadata
                await Book.findByIdAndUpdate(review.bookId, {
                    $inc: {
                        'metadata.popularity.reviewCount': -1
                    },
                    $set: {
                        'metadata.popularity.rating': await calculateAverageRating(review.bookId)
                    }
                })

                span.setAttributes({
                    'success': true
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

                span.setAttributes({
                    'success': true
                })

                res.json({ message: 'Report dismissed successfully' })
            } else {
                span.setAttribute('error', 'invalid_action')
                throw createError.BadRequest('Invalid action')
            }
        } catch (error) {
            span.recordException(error)
            next(error)
        }
    },
        // Delete review
        deleteReview: async (req, res, next) => {
            const span = trace.getActiveSpan()
            try {
                span.setAttribute('operation', 'delete_review')
                const { reviewId } = req.params
                const userId = req.payload.userId

                span.setAttributes({
                    'review.id': reviewId,
                    'user.id': userId
                })
    
                const review = await Review.findById(reviewId)
                if (!review) {
                    span.setAttribute('error', 'review_not_found')
                    throw createError.NotFound('Review not found')
                }
    
                // Check if user owns the review
                if (review.userId.toString() !== userId) {
                    span.setAttribute('error', 'forbidden')
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
                span.recordException(error)
                next(error)
            }
        },
}
// Helper function to calculate average rating
async function calculateAverageRating(bookId) {
    const span = trace.getActiveSpan()
    try {
        span.setAttribute('operation', 'calculate_average_rating')
        span.setAttribute('book_id', bookId)
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
        const rating = result[0]?.averageRating || 0
        span.setAttribute('calculated_rating', rating)
        return rating
    } catch (error) {
        span.recordException(error)
        console.log('Error calculating average rating:', error)
        return 0
    }
}
