const createError = require('http-errors')
const Book = require('../Models/Book.model')
const Review = require('../Models/Review.model')
const { publishEvent } = require('../Config/rabbitmq')
const { type } = require('os')

async function getInterestedUsers(category) {
    try {
        const booksInCategory = await Book.find({ category })
        const bookIds = booksInCategory.map(book => book._id)

        const reviews = await Review.find({
            bookId: { $in: bookIds },
            'votes.upvotes': { $exists: true, $ne: [] }
        })

        const interestedUsers = [...new Set(
            reviews.flatMap(review => review.votes.upvotes)
        )]

        return interestedUsers
    } catch (error) {
        console.error('Error getting interested users:', error)
        return []
    }
}

const BookController = {
    // Get all books
    getBooks: async (req, res, next) => {
        try {
            const { 
                category, 
                page = 1, 
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query
            
            const query = {}
            if (category) query.category = category
            
            const books = await Book.find(query)
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                
            const total = await Book.countDocuments(query)
            
            res.json({
                books,
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page)
            })
        } catch (error) {
            next(error)
        }
    },

    // Get single book
    getBookById: async (req, res, next) => {
        try {
            const book = await Book.findById(req.params.id)
            if (!book) {
                throw createError.NotFound('Book not found')
            }
            res.json(book)
        } catch (error) {
            next(error)
        }
    },

    // Create book
    createBook: async (req, res, next) => {
        try {
            const { isbn } = req.body
            
            // Check for duplicate ISBN
            const existingBook = await Book.findOne({ isbn })
            if (existingBook) {
                throw createError.Conflict('ISBN already exists')
            }
            
            const book = new Book(req.body)
            const savedBook = await book.save()

            const interestedUsers = await getInterestedUsers(savedBook.category)

            await publishEvent('book.created',{
                type: 'NEW_BOOK',
                payload: {
                    book:{
                        id: savedBook._id,
                        title: savedBook.title,
                        author: savedBook.author,
                        category: savedBook.category,
                        price: savedBook.price
                    },
                    interestedUsers
                }
            })
            
            res.status(201).json(savedBook)
        } catch (error) {
            next(error)
        }
    },

    // Update book
    updateBook: async (req, res, next) => {
        try {
            const book = await Book.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            )
            if (!book) {
                throw createError.NotFound('Book not found')
            }
            res.json(book)
        } catch (error) {
            next(error)
        }
    },

    // Delete book
    deleteBook: async (req, res, next) => {
        try {
            const book = await Book.findByIdAndDelete(req.params.id)
            if (!book) {
                throw createError.NotFound('Book not found')
            }
            await Review.deleteMany({ bookId: req.params.id })
            res.json({ message: 'Book deleted successfully' })
        } catch (error) {
            next(error)
        }
    },

    // Bulk create books
    bulkCreateBooks: async (req, res, next) => {
        try {
            const { books } = req.body
            const savedBooks = await Book.insertMany(books)
            res.status(201).json(savedBooks)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = BookController