const socketIO = require('socket.io')

let io

module.exports = {
    init: (server) => {
        io = socketIO(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        })

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id)

            // Handle category subscriptions
            socket.on('subscribe-categories', (categories) => {
                // Leave previous category rooms
                Object.keys(socket.rooms).forEach(room => {
                    if (room.startsWith('category:')) {
                        socket.leave(room)
                    }
                })

                // Join new category rooms
                categories.forEach(category => {
                    socket.join(`category:${category}`)
                })

                console.log(`Client ${socket.id} subscribed to:`, categories)
            })

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id)
            })
        })

        return io
    },

    getIO: () => {
        if (!io) throw new Error('Socket.io not initialized')
        return io
    }
}