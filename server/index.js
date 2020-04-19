const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const PORT = process.env.PORT || 3000;

let sessions = {};

io.on('connection', (socket) => {

    // closure to save room code for this user
    let room;

    socket.on("join", ({ session: roomId, currentTime }) => {
        room = roomId
        if (!sessions[room]) {
            sessions[room] = {
                messages: [],
                users: new Set([socket.id]),
                currentTime: currentTime
            }
            console.log(`Created room ${room}`)
        }
        socket.join(roomId, (err) => {
            if (err) {
                console.log(err)
            }
        })
        console.log("Messages in room:", sessions[room].messages);
        socket.emit("receiveMessages", {
            messages: sessions[room].messages || [],

        });
        console.log(`User:${socket.id} joined room ${roomId}`);
    })

    socket.on("message", (msg) => {
        console.log(`${socket.id} sent message with value: ${msg.content}`)
        sessions[room].messages = [...(sessions[room].messages || []), msg];
        io.to(room).emit("message", {
            ...msg,
            id: socket.id
        })
    })

    socket.on("updateSession", ({ currentTime }) => {
        sessions[room] = {
            ...sessions[room],
            currentTime
        }
    })

    socket.on("player", (msg) => {
        console.log(`${socket.id} sent message with value: ${msg.data}`)
        io.to(room).emit("player", {
            ...msg,
            id: socket.id
        })
    })

    socket.on("disconnect", () => {
        if (sessions[room]) {
            let users = sessions[room].users
            // users.delete(socket.id)
            // if (users.size === 0) {
            //     sessions[room] = null
            //     console.log(`Room ${room} deleted.`)
            // }
        }
    })

});

http.listen(3000, () => {
    console.log(`Starting server on port ${PORT}`)
});