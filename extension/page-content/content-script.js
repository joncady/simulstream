import { AmazonPrime, Netflix, YouTube } from './StreamingPlatforms';
import SocketManager from './SocketManager';
import moment from 'moment';

const TIMEOUT = 15;
const SOCKET_URL = "http://localhost:3000";
const STREAMING_OPTIONS = {
    amazon: AmazonPrime,
    netflix: Netflix,
    youtube: YouTube,
    crunchyroll: "CRUNCHYROLL"
}

// overall player that interacts with the page
let player;
// socket manager to communicate with server
let socketManager;

window.onload = function () {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let wpSession = urlParams.get("wpSession");
    if (wpSession) {
        let counter = 0;
        let playerElement;
        let interval = setInterval(() => {
            playerElement = document.querySelector("video");
            counter += 1;
            if (playerElement) {
                clearInterval(interval);
                detectStreamingSrc(window.location, playerElement, wpSession);
            } else if (window.location.host.includes("amazon")) {
                let playButton = document.querySelector(".dv-dp-node-playback a");
                if (playButton) {
                    playButton.click();
                }
            } else if (counter > TIMEOUT) {
                clearInterval(interval);
            }
        }, 1000);
    }
}

function detectStreamingSrc(url, playerElement, session) {
    for (let src in STREAMING_OPTIONS) {
        if (url.host.includes(src)) {
            player = new STREAMING_OPTIONS[src](playerElement, src);
        }
    }
    if (player) {
        console.log("starting simulstream...")
        startParty(session);
    } else {
        console.log("unable to start simulstream.");
    }
}

function startParty(session) {
    socketManager = new SocketManager(SOCKET_URL, player, constructChatBox);
    socketManager.fetchIdAndName(session);
    socketManager.setUpListeners(renderChats);
    player.setUpListeners(socketManager);
}

function constructChatBox() {
    let element = document.createElement("div");
    element.classList.add("wp-chat-box", "ui", "card");
    element.id = "chatBoxCP";
    let header = document.createElement("header");
    let h1 = document.createElement("h3");
    h1.textContent = "simulstream";
    header.appendChild(h1);
    let nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Name";
    nameInput.value = socketManager.name || socketManager.id;
    let nameSubmit = document.createElement("button");
    nameSubmit.textContent = "Submit";
    nameSubmit.addEventListener("click", () => socketManager.changeName(nameInput.value, renderChats));
    header.appendChild(nameInput);
    header.appendChild(nameSubmit);
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
        socketManager.sendMessage(input.value);
        input.value = "";
    });
    inputArea.appendChild(button);
    element.appendChild(header);
    element.appendChild(messageArea);
    element.appendChild(inputArea);
    (document.querySelector(".nf-kb-nav-wrapper") || document.querySelector("body")).appendChild(element);
    renderChats();
}

function renderChats() {
    let messageArea = document.getElementById("messageAreaCP");
    if (messageArea) {
        messageArea.innerHTML = "";
        socketManager.messages.forEach((message) => {
            messageArea.appendChild(renderChat(message))
        })
    }
}

function renderChat(chatObj) {
    let chat = document.createElement("li");
    chat.classList.add("chat", "item");
    let sender = document.createElement("div");
    sender.classList.add("header");
    let name = socketManager.idsToNames[chatObj.id] || socketManager.id;
    sender.textContent = name;
    let content = document.createElement("div");
    content.classList.add("content");
    content.textContent = chatObj.content;
    let time = document.createElement("div");
    time.classList.add("extra");
    time.textContent = moment(chatObj.time).fromNow();
    let top = document.createElement("div");
    top.classList.add("top");
    top.appendChild(sender);
    top.appendChild(time);
    chat.appendChild(top);
    chat.appendChild(content);
    return chat;
}

function toggleChat() {
    let sizingElement = document.querySelector(".nf-kb-nav-wrapper > .sizing-wrapper");
    let chatBox = document.querySelector("chat-box");
    if (sizingElement && chatBox) {
        sizingElement.classList.toggle("wp-size");
        chatBox.classList.toggle("hide");
    }
}