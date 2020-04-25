const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const PORT = process.env.PORT || 3000;

app.use(express.static("landing-page"))

const STATES = {
    PAUSED: 0,
    PLAYING: 1
}

const convertStringToState = (stringState) => {
    switch (stringState) {
        case "play":
            return STATES.PLAYING;
        case "pause":
            return STATES.PAUSED;
        case "seeked":
            return STATES.PLAYING;
        default:
            return STATES.PLAYING;
    }
}

const TIME_FACTOR = 1000;

let sessions = {};

io.on('connection', (socket) => {

    // closure to save room code for this user
    let room;

    socket.on("join", ({ session: roomId, currentTime, state }) => {
        room = roomId
        let sessionData = {}
        if (!sessions[room]) {
            sessions[room] = {
                messages: [],
                users: new Set([socket.id]),
                currentTime: currentTime,
                updatedAt: new Date().valueOf(),
                state: state
            }
            console.log(`Created room ${room}`)
        } else {
            let thisSession = sessions[room];
            let currentTime = new Date().valueOf()
            if (thisSession.state === STATES.PLAYING) {
                // if the video has been playing, we can assume time has continued naturally
                let estimatedTime = Math.round((currentTime - thisSession.updatedAt) / TIME_FACTOR);
                console.log(estimatedTime)
                sessionData = {
                    currentTime: estimatedTime
                }
            } else {
                // if some sort of update has occured, then the session will reflect this
                sessionData = {
                    currentTime: thisSession.currentTime
                }
            }
        }
        socket.join(roomId, (err) => {
            if (err) {
                console.log(err)
            }
        })
        socket.emit("receiveMessages", {
            messages: sessions[room].messages || [],
            ...sessionData
        });
        console.log(`User:${socket.id} joined room ${roomId}`);
    })

    socket.on("message", (msg) => {
        console.log(`${socket.id} sent message with value: ${msg.content}`)
        sessions[room].messages = [...(sessions[room].messages || []), msg]
        io.to(room).emit("message", {
            ...msg,
            id: socket.id
        })
    })

    socket.on("updateSession", ({ currentTime, state }) => {
        sessions[room] = {
            ...sessions[room],
            currentTime,
            state,
            updatedAt: new Date().valueOf()
        } 
    })

    socket.on("player", (msg) => {
        let currentSession = sessions[room];
        let newSessionData = {
            ...currentSession,
            updatedAt: new Date().valueOf(),
            state: convertStringToState(msg.type)            
        }
        if (msg.type === "seeked") {
            newSessionData.currentTime = msg.data
        }
        sessions[room] = newSessionData
        console.log(`Updated session:`, newSessionData)
        console.log(`${socket.id} sent ${msg.type} with value: ${msg.data}`)
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

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html")
})
 
http.listen(3000, () => {
    console.log(`Starting server on port ${PORT}`)
});