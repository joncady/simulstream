const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const PORT = process.env.PORT || 3000
const { generateID, STATES, convertStringToState } = require('./helper')

app.use(express.static("landing-page"))

let users = new Set()
let userToName = {}

const TIME_FACTOR = 1000;

let sessions = {};

io.on('connection', (socket) => {

    // closure to save room code for this user
    let room;

    socket.on("join", ({ session: roomId, currentTime, state, id, name, videoId }) => {
        room = roomId
        // generates unique id based on stored values
        if (!id) {
            do {
                id = id || generateID()
                console.log(id, users.size)
                console.log("generating unique id...")
            } while (users.has(id))
        }
        // if id is unique, added to users
        if (!users.has(id)) {
            users.add(id)
        }
        if (name) {
            userToName[id] = name
        }
        let sessionData = {}
        if (!sessions[room]) {
            let newSessionData = {
                messages: [],
                users: new Set([id]),
                currentTime: currentTime,
                updatedAt: new Date().valueOf(),
                state: state || STATES.PAUSED,
                videoId
            }
            sessions[room] = newSessionData
            sessionData = { ...newSessionData, id }
            console.log(`Created room ${room}`)
        } else {
            let thisSession = sessions[room]
            let usersInSession = thisSession.users
            let sessionNames = Array.from(usersInSession).reduce((obj, userId) => {
                obj[userId] = userToName[userId]
                return obj
            }, {})
            console.log(sessionNames)
            let currentTime = new Date().valueOf()
            if (thisSession.state === STATES.PLAYING) {
                // if the video has been playing, we can assume time has continued naturally
                let estimatedTime = Math.round((currentTime - thisSession.updatedAt) / TIME_FACTOR);
                sessionData = {
                    currentTime: estimatedTime,
                    state: STATES.PLAYING,
                    id,
                    sessionNames
                }
            } else {
                // if some sort of update has occured, then the session will reflect this
                sessionData = {
                    currentTime: thisSession.currentTime,
                    state: STATES.PAUSED,
                    id,
                    sessionNames
                }
            }
        }
        socket.join(roomId, (err) => {
            if (err) {
                console.log(err)
            }
        })
        console.log(sessionData)
        socket.emit("receiveMessages", {
            messages: sessions[room].messages || [],
            ...sessionData
        })
        console.log(`User:${id} joined room ${roomId}`);
    })

    socket.on("name", ({ name, id }) => {
        userToName[id] = name
        socket.to(room).emit("name-change", {
            id,
            name
        })
    })

    socket.on("message", (msg) => {
        console.log(`${msg.id} sent message with value: ${msg.content}`)
        sessions[room].messages = [...(sessions[room].messages || []), msg]
        io.to(room).emit("message", {
            ...msg,
            id: msg.id
        })
    })

    socket.on("player", (msg) => {
        let currentSession = sessions[room];
        let newSessionData = {
            ...currentSession,
            updatedAt: new Date().valueOf(),
            state: convertStringToState(msg.type, currentSession.state)
        }
        newSessionData.currentTime = msg.data
        sessions[room] = newSessionData
        console.log(`Updated session:`, newSessionData)
        console.log(`${msg.id} sent ${msg.type} with value: ${msg.data}`)
        io.to(room).emit("player", {
            ...msg,
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

app.get("*", (req, res) => {
    res.send("simulstream server running...")
})

http.listen(3000, () => {
    console.log(`Starting server on port ${PORT}`)
})