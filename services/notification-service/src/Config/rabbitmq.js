const amqp = require('amqplib')
const NotificationController = require('../Controllers/Notification.controller')

let channel

async function connectQueue() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672')
        channel = await connection.createChannel()
        
        // Declare exchange
        await channel.assertExchange('book_events', 'topic', { durable: true })

        // Declare queue
        const { queue } = await channel.assertQueue('notification_queue', {
            durable: true
        })

        // Bind queue to book events
        await channel.bindQueue(queue, 'book_events', 'book.created')

        // Consume messages
        channel.consume(queue, async (data) => {
            try {
                const event = JSON.parse(data.content)
                await NotificationController.handleEvent(event)
                channel.ack(data)
            } catch (error) {
                console.error('Error processing message:', error)
                channel.nack(data, false, true)
            }
        })

        console.log('RabbitMQ: Ready to receive messages')
    } catch (error) {
        console.error('RabbitMQ connection error:', error)
        setTimeout(connectQueue, 5000)
    }
}

module.exports = { connectQueue }