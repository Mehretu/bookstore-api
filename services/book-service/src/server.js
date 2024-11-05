const express = require('express')
const createError = require('http-errors')
const cors = require('cors')
require('dotenv').config()
require('./Config/init_mongodb')
const {connectQueue} = require('./Config/rabbitmq')

const app = express()

connectQueue()

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
const bookRoutes = require('./Routes/Book.route')
const reviewRoutes = require('./Routes/Review.route')
const searchRoutes = require('./Routes/Search.route')

app.use('/api/books', bookRoutes)
app.use('/api/reviews', reviewRoutes)  
app.use('/api/search', searchRoutes)
// 404 handler
app.use((req, res, next) => {
    next(createError.NotFound('Route not found'))
})

// Error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    })
})

const PORT = process.env.PORT || 6000

app.listen(PORT, () => {
    console.log(`Book service running on port ${PORT}`)
})