(function () {

    class StreamingProvider {

        player = null

        constructor(player) {
            this.player = player;
        }

        play() {
            this.player.play();
        }

        pause() {
            this.player.pause();
        }

        seek(time) {
            this.player.currentTime = time;
        }

        setUpListeners() {
            this.player.addEventListener("play", () => {
                console.log("send play");
                sendPlayerMessage("play")
            })
            this.player.addEventListener("pause", (e) => {
                console.log("sent pause");
                sendPlayerMessage("pause")
            })
            this.player.addEventListener("seeked", (e) => {
                let time = e.target.currentTime;
                sendPlayerMessage("seeked", time);
            })
        }

    }

    class AmazonPrime extends StreamingProvider {

        injectCSS() {
            // finish later
        }

    }

    class Netflix extends StreamingProvider {

        seek() {
            // this will be interesting
        }

        injectCSS() {
            let sizingElement = document.querySelector(".nf-kb-nav-wrapper > .sizing-wrapper");
            if (sizingElement) {
                sizingElement.classList.add("wp-size");
            }
        }

    }

    const TIMEOUT = 10;
    const SOCKET_URL = "http://localhost:3000";
    const STREAMING_OPTIONS = {
        amazon: AmazonPrime,
        netflix: Netflix,
        crunchyroll: "CRUNCHYROLL"
    }

    let player;
    let socket;
    let messages = [];
    let seeking = false;
    let streamingType;
    let id;

    window.onload = function () {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        let wpSession = urlParams.get("wpSession");
        if (wpSession) {

            let counter = 0;
            let playerElement;
            let interval = setInterval(() => {
                playerElement = document.querySelector("video")
                counter += 1;

                if (playerElement) {
                    clearInterval(interval);
                    detectStreamingSrc(window.location, playerElement);
                    startParty(wpSession);
                } else if (counter > TIMEOUT) {
                    clearInterval(interval);
                }
            }, 1000);
        }
    }

    function detectStreamingSrc(url, playerElement) {
        for (src in STREAMING_OPTIONS) {
            if (url.host.includes(src)) {
                player = new STREAMING_OPTIONS[src](playerElement);
                streamingType = src;
                player.injectCSS();
                constructChatBox();
            }
        }
    }

    function toggleChat() {
        let sizingElement = document.querySelector(".nf-kb-nav-wrapper > .sizing-wrapper");
        let chatBox = document.querySelector("chat-box");
        if (sizingElement && chatBox) {
            sizingElement.classList.toggle("wp-size");
            chatBox.classList.toggle("hide");
        }
    }

    function startParty(session) {
        if (window.io) {
            console.log("started watch party...")
            socket = io(SOCKET_URL);
            socket.on('connect', () => {
                id = socket.id;
            });
            socket.emit("join", "testing");
            socket.on("message", receiveChatMessage);
            socket.on("player", receivePlayerMessage);

            player.setUpListeners();
        }
    }

    function sendPlayerMessage(type, data) {
        if (socket) {
            socket.emit("player", {
                type,
                data,
                id
            });
        }
    }

    function receivePlayerMessage(message) {
        if (message.id !== id) {
            console.log("received", message.type);
            let { type, data } = message;
            switch (type) {
                case "play":
                    console.log("played")
                    player.play();
                    break;
                case "pause":
                    console.log("paused")
                    player.pause();
                    break;
                case "seeked":
                    player.setTime(data);
                    break;
                default:
                    break;
            }
        }
    }

    function nextEpisode() {
        player.play().then(() => {
            player.currentTime = player.duration;
        })
    }

    // 
    // var eventOptions, scrubber;
    // return showControls().then(function() {
    //   // compute the parameters for the mouse events
    //   scrubber = document.querySelector(".scrubber-bar");
    //   let factor = milliseconds / player.duration;
    //   let mouseX = scrubber.offset().left + Math.round(scrubber.width() * factor); // relative to the document
    //   let mouseY = scrubber.offset().top + scrubber.height() / 2;                  // relative to the document
    //   eventOptions = {
    //     'bubbles': true,
    //     'button': 0,
    //     'screenX': mouseX - $(window).scrollLeft(),
    //     'screenY': mouseY - $(window).scrollTop(),
    //     'clientX': mouseX - $(window).scrollLeft(),
    //     'clientY': mouseY - $(window).scrollTop(),
    //     'offsetX': mouseX - scrubber.offset().left,
    //     'offsetY': mouseY - scrubber.offset().top,
    //     'pageX': mouseX,
    //     'pageY': mouseY,
    //     'currentTarget': scrubber[0]
    //   };

    //   // make the "trickplay preview" show up
    //   scrubber.dispatchEvent(new MouseEvent('mouseover', eventOptions));

    // // const videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
    // // const netflixPlayer = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
    // // netflixPlayer.seek(time);
    // // player.currentTime = time;
    // })

    function sendMessage(type, content) {
        if (socket) {
            socket.emit("message", {
                content,
                time: new Date(),
                name: "ex"
            });
        }
    }

    function constructChatBox() {
        let element = document.createElement("div");
        element.classList.add("chat-box", "ui", "card");
        element.id = "chatBoxCP";
        let header = document.createElement("header");
        let h1 = document.createElement("h3");
        h1.textContent = "Watch Party"
        header.appendChild(h1);
        let messageArea = document.createElement("ul");
        messageArea.classList.add("message-area", "ui", "list");
        messageArea.id = "messageAreaCP";
        let inputArea = document.createElement("form");
        inputArea.addEventListener("submit", (e) => {
            e.preventDefault();
        })
        inputArea.classList.add("input-area", "ui", "input");
        let input = document.createElement("input");
        input.type = "text";
        inputArea.appendChild(input);
        input.placeholder = "Enter message!";
        let button = document.createElement("button");
        button.classList.add("ui", "button");
        button.textContent = "Send Message";
        button.addEventListener("click", () => {
            sendMessage("message", input.value)
            input.value = "";
        });
        inputArea.appendChild(button);
        element.appendChild(header);
        element.appendChild(messageArea);
        element.appendChild(inputArea);
        (document.querySelector(".nf-kb-nav-wrapper") || document.querySelector("body")).appendChild(element);
    }

    function receiveChatMessage(message) {
        messages.push(message);
        renderChats();
    }

    function renderChats() {
        let messageArea = document.getElementById("messageAreaCP");
        if (messageArea) {
            messageArea.innerHTML = "";
            messages.forEach((message) => {
                messageArea.appendChild(renderChat(message))
            })
        }
    }

    function renderChat(chatObj) {
        let chat = document.createElement("li");
        chat.classList.add("chat", "item");
        let sender = document.createElement("div");
        sender.classList.add("header");
        sender.textContent = chatObj.name;
        let content = document.createElement("div");
        content.classList.add("content");
        content.textContent = chatObj.content;
        let time = document.createElement("div");
        time.classList.add("extra");
        time.textContent = window.moment(chatObj.time).fromNow();
        let top = document.createElement("div");
        top.classList.add("top");
        top.appendChild(sender);
        top.appendChild(time);
        chat.appendChild(top);
        chat.appendChild(content);
        return chat;
    }

})();