require('dotenv').config()
const mongoose = require('mongoose')
const app = require('./app')
const { logger } = require('./Utils/logger')

const startServer = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        logger.info('Connected to MongoDB')

        // Start server
        const port = process.env.PORT || 8000
        app.listen(port, () => {
            logger.info(`Integration service running on port ${port}`)
        })
    } catch (error) {
        logger.error('Server startup error:', error)
        process.exit(1)
    }
}

startServer()