const express = require('express')
const createError = require('http-errors')
require('./tracing')

const app = express()

// Middleware
app.use(express.json())

// Mount routes
app.use('/api/integrations', require('./Routes/Integration.route'))

// Error handling
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: false,
        message: err.message
    })
})

module.exports = app