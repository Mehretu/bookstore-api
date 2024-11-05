const { trace } = require('@opentelemetry/api')
const createError = require('http-errors')
const Book = require('../Models/Book.model')
const Review = require('../Models/Review.model')
const { publishEvent } = require('../Config/rabbitmq')
const { type } = require('os')

async function getInterestedUsers(category) {
    const span = trace.getActiveSpan()
    try {
        span.setAttribute('operation', 'get_Interested_Users')
        span.setAttribute('category', category)
        const booksInCategory = await Book.find({ category })
        const bookIds = booksInCategory.map(book => book._id)

        const reviews = await Review.find({
            bookId: { $in: bookIds },
            'votes.upvotes': { $exists: true, $ne: [] }
        })

        const interestedUsers = [...new Set(
            reviews.flatMap(review => review.votes.upvotes)
        )]
        span.setAttribute('interested_users_count', interestedUsers.length)

        return interestedUsers
    } catch (error) {
        span.recordException(error)
        console.error('Error getting interested users:', error)
        return []
    }
}

const BookController = {
    // Get all books
    getBooks: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'get_Books')
            const { 
                category, 
                page = 1, 
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query

           span.setAttributes({
            'query.category': category || 'all',
            'query.page': page,
            'query.limit': limit,
            'query.sortBy': sortBy,
            'query.sortOrder': sortOrder
           })
            
            const query = {}
            if (category) query.category = category
            
            const books = await Book.find(query)
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                
            const total = await Book.countDocuments(query)

            span.setAttributes({
                'books.count': books.length,
                'books.total': total,
                'books.pages': Math.ceil(total / limit)
            })
            
            res.json({
                books,
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page)
            })
        } catch (error) {
            span.recordException(error)
            next(error)
        }
    },

    // Get single book
    getBookById: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'get_Book_By_Id')
            span.setAttribute('book_id', req.params.id)
            const book = await Book.findById(req.params.id)
            if (!book) {
                span.setAttribute('error', 'Book not found')
                throw createError.NotFound('Book not found')
            }
            span.setAttributes({
                'book.title': book.title,
                'book.author': book.author,
                'book.category': book.category
            })
            res.json(book)
        } catch (error) {
            next(error)
        }
    },

    // Create book
    createBook: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'create_Book')
            span.setAttributes({
                'book.isbn': req.body.isbn,
                'book.title': req.body.title,
                'book.author': req.body.author,
                'book.category': req.body.category
            })
            const { isbn } = req.body
            
            // Check for duplicate ISBN
            const existingBook = await Book.findOne({ isbn })
            if (existingBook) {
                span.setAttribute('error', 'ISBN already exists')
                throw createError.Conflict('ISBN already exists')
            }
            
            const book = new Book(req.body)
            const savedBook = await book.save()

            const interestedUsers = await getInterestedUsers(savedBook.category)

            span.setAttribute('interested_users_count', interestedUsers.length)
            span.setAttribute('event', 'book.created')

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
            span.setAttribute('success', true) 
            res.status(201).json(savedBook)
        } catch (error) {
            span.recordException(error)
            next(error)
        }
    },

    // Update book
    updateBook: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'update_book')
            span.setAttributes({
                'book.id': req.params.id,
                'update_fields': Object.keys(req.body).join(',')
            })
            const book = await Book.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            )
            if (!book) {
                span.setAttribute('error', 'Book not found')
                throw createError.NotFound('Book not found')
            }
            span.setAttribute('success', true)
            res.json(book)
        } catch (error) {
            span.recordException(error)
            next(error)
        }
    },

    // Delete book
    deleteBook: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'delete_book')
            span.setAttribute('book_id', req.params.id)
            const book = await Book.findByIdAndDelete(req.params.id)
            if (!book) {
                span.setAttribute('error', 'Book not found')
                throw createError.NotFound('Book not found')
            }
            await Review.deleteMany({ bookId: req.params.id })
            span.setAttributes({
                'success': true,
                'book.title': book.title,
                'book.category': book.category
            })
            res.json({ message: 'Book deleted successfully' })
        } catch (error) {
            span.recordException(error)
            next(error)
        }
    },

    // Bulk create books
    bulkCreateBooks: async (req, res, next) => {
        const span = trace.getActiveSpan()
        try {
            span.setAttribute('operation', 'bulk_create_books')
            span.setAttribute('books.count', req.body.books.length)
            const { books } = req.body
            const savedBooks = await Book.insertMany(books)
            span.setAttributes({
                'success': true,
                'books.saved_count': savedBooks.length
            })
            res.status(201).json(savedBooks)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = BookController