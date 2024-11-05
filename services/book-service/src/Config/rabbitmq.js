const amqp = require('amqplib')

let channel

async function connectQueue() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672')
        channel = await connection.createChannel()
        
        // Declare exchange for book events
        await channel.assertExchange('book_events', 'topic', { durable: true })
        
        console.log('Connected to RabbitMQ')
        return channel
    } catch (error) {
        console.error('RabbitMQ connection error:', error)
        setTimeout(connectQueue, 5000)
    }
}

async function publishEvent(routingKey, data) {
    try {
        if (!channel) throw new Error('RabbitMQ channel not initialized')
        
        channel.publish(
            'book_events',
            routingKey,
            Buffer.from(JSON.stringify(data))
        )
        console.log('Event published:', routingKey)
    } catch (error) {
        console.error('Error publishing event:', error)
    }
}

module.exports = { connectQueue, publishEvent }