const express = require('express')
const cors = require('cors')
const createError = require('http-errors')
const integrationRoutes = require('./Routes/Integration.route')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api', integrationRoutes)

// 404 handler
app.use((req, res, next) => {
    next(createError.NotFound('Route not found'))
})

// Error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        error: {
            status: err.status || 500,
            message: err.message
        }
    })
})

module.exports = app