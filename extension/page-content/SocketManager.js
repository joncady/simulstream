import io from 'socket.io-client';

export default class SocketManager {

    socket = null
    idsToNames = {}
    id = null
    name = null
    messages = []
    player = null
    cb = null

    constructor(url, playerRef, constructChatBoxCB) {
        this.socket = io(url);
        this.player = playerRef;
        this.cb = constructChatBoxCB;
    }

    fetchIdAndName(session) {
        chrome.storage.local.get(["userId", "name"], (results) => this.getResults(results, session));
    }

    getResults(result, session) {
        this.id = result.userId;
        this.name = result.name;
        this.socket.emit("join", {
            currentTime: this.player.getCurrentTime(),
            session: session,
            state: this.player.paused ? 0 : 1,
            id: this.id,
            name: this.name
        })
    }

    setUpListeners(chatCallback) {
        this.socket.on("message", (msg) => this.receiveChatMessage(msg, chatCallback));
        this.socket.on("player", (msg) => this.receivePlayerMessage(msg));
        this.socket.on("receiveMessages", (msg) => this.receiveMessages(msg));
        this.socket.on("name-change", ({ id, name }) => {
            this.idsToNames[id] = name;
            chatCallback();
        })
    }

    receiveChatMessage(message, chatCallback) {
        this.messages.push(message);
        chatCallback();
    }

    sendPlayerMessage(type, data) {
        this.socket.emit("player", {
            type,
            data,
            id: this.id
        });
    }

    sendMessage(content) {
        this.socket.emit("message", {
            content,
            time: new Date(),
            id: this.id
        });
    }

    receiveMessages(msgs) {
        this.messages = msgs.messages;
        if (msgs.sessionNames) {
            this.idsToNames = msgs.sessionNames
        }

        if (!this.id) {
            // setting persistent id
            chrome.storage.local.set({ "userId": msgs.id });
        }
        if (msgs.currentTime) {
            this.player.setTime(msgs.currentTime);
        }
        if (msgs.state === 0) {
            this.player.pause();
        } else if (msgs.state === 1) {
            this.player.play();
        }
        // ignore any events in the first couple seconds of initialization
        setTimeout(() => {
            this.player.receivedSession = true;
        }, 2000)
        // inject the correct CSS for the platform
        this.player.injectCSS();
        this.cb();
    }

    receivePlayerMessage(message) {
        if (message.id !== this.id) {
            console.log("received", message.type);
            let { type, data } = message;
            switch (type) {
                case "play":
                    console.log(this.player.seeking)
                    if (!this.player.seeking) {
                        console.log("played")
                        this.player.play();
                    }
                    break;
                case "pause":
                    if (!this.player.seeking) {
                        console.log("played")
                        this.player.pause();
                    }
                    break;
                case "seeked":
                    if (!this.player.seeking) {
                        this.player.seeking = true;
                        this.player.setTime(data);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    changeName(nameValue, chatCallback) {
        if (nameValue) {
            this.socket.emit("name", {
                id: this.id,
                name: nameValue
            })
            this.name = nameValue;
            chrome.storage.local.set({ "name": nameValue })
            this.idsToNames[this.id] = this.name;
            chatCallback();
        }
    }

}