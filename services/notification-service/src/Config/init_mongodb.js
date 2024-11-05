const mongoose = require('mongoose')

if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables')
    process.exit(1)
}

mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('MongoDB connected...')
    })
    .catch((err) => {
        console.log(err.message)
    })

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to db...')
})

mongoose.connection.on('error', (err) => {
    console.log(err.message)
})

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose connection is disconnected...')
})

process.on('SIGINT', async () => {
    await mongoose.connection.close()
    process.exit(0)
})