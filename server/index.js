const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {

    // closure to save room code for this user
    let room;

    socket.on("join", (roomId) => {
        room = roomId
        socket.join(roomId, (err) => {
            console.log(err)
        })
        console.log(`User:${socket.id} joined room ${roomId}`);
    })

    socket.on("message", (msg) => {
        console.log(`${socket.id} sent message with value: ${msg.content}`)
        io.to(room).emit("message", {
            ...msg,
            id: socket.id
        })
    })

    socket.on("player", (msg) => {
        console.log(`${socket.id} sent message with value: ${msg.data}`)
        io.to(room).emit("player", {
            ...msg,
            id: socket.id
        })
    })

});

http.listen(3000, () => {
    console.log(`Starting server on port ${PORT}`)
});