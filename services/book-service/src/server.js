const express = require('express')
const createError = require('http-errors')
const cors = require('cors')
require('dotenv').config()
require('./Config/init_mongodb')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
const bookRoutes = require('./Routes/Book.route')
// const reviewRoutes = require('./routes/Review.route')  // Uncomment when implementing reviews

app.use('/api/books', bookRoutes)
// app.use('/api', reviewRoutes)  // Uncomment when implementing reviews

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