const express = require('express')
const cors = require('cors')
const createError = require('http-errors')
const integrationRoutes = require('./Routes/Integration.route')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./swagger')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

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