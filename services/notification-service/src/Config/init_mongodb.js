const mongoose = require('mongoose')
const vaultHelper = require('../Config/init_vault')

async function initMongoDB() {
    try {
        const dbConfig = await vaultHelper.readSecret('database')
        console.log('Database config:', dbConfig)
        const mongoUri = dbConfig.mongodb_uri
        console.log('MongoDB URI:', mongoUri)
        
        if (!mongoUri) {
            throw new Error('MongoDB URI not found in Vault')
        }

        await mongoose.connect(mongoUri)
        console.log('MongoDB connected')
    } catch (err) {
        console.error('MongoDB connection error:', err.message)
        throw err
    }
}

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to db')
})

mongoose.connection.on('error', (err) => {
    console.error('Mongoose error:', err.message)
})

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose connection is disconnected')
})

process.on('SIGINT', async () => {
    await mongoose.connection.close()
    process.exit(0)
})

module.exports = { initMongoDB }