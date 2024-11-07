const Book = require('../Models/Book.model')

module.exports = {
    searchBooks: async (req, res, next) => {
        try {
            const {
                q,                  
                category,           
                author,            
                genre,             
                minPrice,          
                maxPrice,
                minRating,         
                maxRating,
                sortBy = 'createdAt',  
                sortOrder = 'desc',    
                page = 1,             
                limit = 10
            } = req.query

            let query = {}

            if (q) {
                query.$text = { $search: q }
            }

            if (category) {
                query.category = category.toUpperCase()
            }

            if (author) {
                query.author = { $regex: author, $options: 'i' }
            }

            if (genre) {
                query['metadata.genre'] = { $in: Array.isArray(genre) ? genre : [genre] }
            }

            if (minPrice || maxPrice) {
                query.price = {}
                if (minPrice) query.price.$gte = parseFloat(minPrice)
                if (maxPrice) query.price.$lte = parseFloat(maxPrice)
            }

            if (minRating || maxRating) {
                query['metadata.popularity.rating'] = {}
                if (minRating) query['metadata.popularity.rating'].$gte = parseFloat(minRating)
                if (maxRating) query['metadata.popularity.rating'].$lte = parseFloat(maxRating)
            }

            const sortOptions = {}
            if (sortBy === 'price') {
                sortOptions.price = sortOrder === 'desc' ? -1 : 1
            } else if (sortBy === 'rating') {
                sortOptions['metadata.popularity.rating'] = sortOrder === 'desc' ? -1 : 1
            } else if (sortBy === 'reviewCount') {
                sortOptions['metadata.popularity.reviewCount'] = sortOrder === 'desc' ? -1 : 1
            } else {
                sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1
            }

            const books = await Book.find(query)
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))

            const total = await Book.countDocuments(query)

            res.json({
                success: true,
                data: {
                    books,
                    pagination: {
                        total,
                        totalPages: Math.ceil(total / limit),
                        currentPage: parseInt(page),
                        limit: parseInt(limit)
                    }
                }
            })
        } catch (error) {
            next(error)
        }
    },

    getSearchSuggestions: async (req, res, next) => {
        try {
            const { q } = req.query
            
            if (!q || q.length < 2) {
                return res.json({
                    success: true,
                    data: { suggestions: [] }
                })
            }

            // Create a case-insensitive regex pattern
            const searchPattern = new RegExp(q, 'i')

            // Find books matching the query
            const suggestions = await Book.find({
                $or: [
                    { title: { $regex: searchPattern }},    // Contains query anywhere in title
                    { author: { $regex: searchPattern }},   // Contains query anywhere in author
                    { description: { $regex: searchPattern }} // Contains query in description
                ]
            })
            .select('title author category price')
            .limit(5)
            .lean()

            // Log for debugging
            console.log('Search query:', q)
            console.log('Found suggestions:', suggestions.length)

            const formattedSuggestions = suggestions.map(book => ({
                id: book._id,
                title: book.title,
                author: book.author,
                category: book.category,
                price: book.price,
                displayText: `${book.title} by ${book.author}`
            }))

            res.json({
                success: true,
                data: { 
                    suggestions: formattedSuggestions,
                    query: q,
                    total: formattedSuggestions.length
                }
            })
        } catch (error) {
            console.error('Search suggestion error:', error)
            next(error)
        }
    }
}