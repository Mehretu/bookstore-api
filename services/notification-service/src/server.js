const express = require('express')
const createError = require('http-errors')
const cors = require('cors')
const http = require('http')
require('dotenv').config()
require('./Config/init_mongodb')
const { connectRedis } = require('./Config/init_redis')
const { connectQueue } = require('./Config/rabbitmq')
const socketConfig = require('./Config/socket')

const app = express()
const server = http.createServer(app)

// Initialize socket.io
const io = socketConfig.init(server)

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
const notificationRoutes = require('./Routes/Notification.route')
app.use('/api/notifications', notificationRoutes)

// Connect to Redis
connectRedis()

// Connect to RabbitMQ
connectQueue()

// Error handling
app.use((req, res, next) => {
    next(createError.NotFound('Route not found'))
})

app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    })
})

const PORT = process.env.PORT || 6001

server.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`)
})