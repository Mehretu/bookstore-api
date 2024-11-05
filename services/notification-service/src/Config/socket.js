const socketIO = require('socket.io')

let io

function init(server) {
    io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    })

    io.use((socket, next) => {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.split(' ')[1]

        console.log('Socket connection attempt:', {
            socketId: socket.id,
            hasToken: !!token
        })

        if (!token) {
            console.log('No token provided for socket connection')
            return next(new Error('Authentication token missing'))
        }

        // Store token in socket for later use
        socket.token = token
        next()
    })

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id)

        // Join a room based on the token/user
        if (socket.token) {
            socket.join(`user:${socket.token}`)
            console.log(`Socket ${socket.id} joined room user:${socket.token}`)
        }

        // Debug: Log all incoming events
        socket.onAny((eventName, ...args) => {
            console.log(`Received event "${eventName}":`, args)
        })

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id)
        })
    })

    return io
}

function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized!')
    }
    return io
}

module.exports = { init, getIO }