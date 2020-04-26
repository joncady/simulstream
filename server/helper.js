const { v4: uuid } = require('uuid')

const STATES = {
    PAUSED: 0,
    PLAYING: 1
}

exports.generateID = () => {
    let newId = uuid()
    return newId
}

exports.convertStringToState = (stringState, lastState) => {
    if (stringState === "seeked") {
        return lastState
    }
    switch (stringState) {
        case "play":
            return STATES.PLAYING;
        case "pause":
            return STATES.PAUSED;
        default:
            return STATES.PLAYING;
    }
}

exports.STATES = STATES