const mongoose = require('mongoose')
const vaultHelper = require('./vault_helper')

async function initMongoDB() {
    try {
        const dbConfig = await vaultHelper.readSecret('database')
        
        await mongoose.connect(dbConfig.uri, {
            dbName: dbConfig.db_name
        })
        console.log("mongodb connected")
    } catch (err) {
        console.log(err.message)
        process.exit(1)
    }
}

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to db')
})

mongoose.connection.on('error', (err) => {
    console.log(err.message)
})

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose connection is disconnected.')
})

process.on('SIGINT', async () => {
    await mongoose.connection.close()
    process.exit(0)
})

initMongoDB()

module.exports = { initMongoDB }