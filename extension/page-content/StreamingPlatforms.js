class StreamingProvider {

    player = null
    seeking = false
    receivedSession = false
    streamingType = null

    constructor(player, streamingType) {
        this.streamingType = streamingType;
        this.player = player;
    }

    play() {
        this.player.play();
    }

    getCurrentTime() {
        return this.player.currentTime;
    }

    pause() {
        this.player.pause();
    }

    setTime(time) {
        this.player.currentTime = time;
    }

    setUpListeners(sm) {
        this.player.addEventListener("play", () => {
            console.log("played", new Date().getSeconds())
            if (this.receivedSession && !this.seeking) {
                console.log("send play");
                sm.sendPlayerMessage("play", this.getCurrentTime())
            }
            if (this.seeking) {
                this.seeking = false;
            }
        })
        this.player.addEventListener("pause", () => {
            console.log("paused", new Date().getSeconds())
            if (this.receivedSession && !this.seeking) {
                console.log("sent pause");
                sm.sendPlayerMessage("pause", this.getCurrentTime());
            }
        })
        this.player.addEventListener("seeked", (e) => {
            console.log("seeked", new Date().getSeconds())
            if (this.receivedSession) {
                let time = e.target.currentTime;
                sm.sendPlayerMessage("seeked", time);
            }
        })
    }

}

export class AmazonPrime extends StreamingProvider {

    injectCSS() {
        // finish later
        let videoPlayer = document.getElementById("dv-web-player");
        if (videoPlayer) {
            videoPlayer.classList.add("wp-amazon");
        }
    }

}

export class YouTube extends StreamingProvider {

    injectCSS() {
        let videoPlayer = document.querySelector("video");
        if (videoPlayer) {
            videoPlayer.classList.add("wp-youtube");
        }
    }

}

export class Netflix extends StreamingProvider {

    setTime(time) {
        this.showControls().then(() => {
            let scrubber = $('.scrubber-bar');
            let factor = time / this.player.duration;
            let mouseX = scrubber.offset().left + Math.round(scrubber.width() * factor); // relative to the document
            let mouseY = scrubber.offset().top + scrubber.height() / 2;            // relative to the document
            let eventOptions = {
                'bubbles': true,
                'button': 0,
                'screenX': mouseX - $(window).scrollLeft(),
                'screenY': mouseY - $(window).scrollTop(),
                'clientX': mouseX - $(window).scrollLeft(),
                'clientY': mouseY - $(window).scrollTop(),
                'offsetX': mouseX - scrubber.offset().left,
                'offsetY': mouseY - scrubber.offset().top,
                'pageX': mouseX,
                'pageY': mouseY,
                'currentTarget': scrubber[0]
            };
            // scrubber[0].dispatchEvent(new MouseEvent('mouseover', eventOptions));
            scrubber[0].dispatchEvent(new MouseEvent('mousedown', eventOptions));
            scrubber[0].dispatchEvent(new MouseEvent('mouseup', eventOptions));
            scrubber[0].dispatchEvent(new MouseEvent('mouseout', eventOptions));
        });
    }

    showControls() {
        let promise = new Promise((resolve) => {
            document.querySelector(".VideoContainer").dispatchEvent(new MouseEvent("mousemove", {
                'bubbles': true,
                'button': 0,
                'currentTarget': document.querySelector(".VideoContainer")
            }))
            setInterval(() => {
                resolve();
            }, 10);
        });
        return promise;
    }

    injectCSS() {
        let sizingElement = document.querySelector(".nf-kb-nav-wrapper > .sizing-wrapper");
        if (sizingElement) {
            sizingElement.classList.add("wp-size");
        }
    }

}