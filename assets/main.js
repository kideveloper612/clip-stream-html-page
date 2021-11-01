var screens = [];

var video = document.getElementById("video");
var video_preview = document.getElementById("video_preview");

var reader = new FileReader();
var auto = false;

function initialLoad() {
    screens = [];

    reader.onload = function (e) {
        video.src = video_preview.src = e.target.result;
        video.autoplay = video_preview.autoplay = true;
        video.hasLoaded = video_preview.hasLoaded = false;

        video_preview.addEventListener("canplay", function () {
            video_preview.hasLoaded = true;
            video.play();
        });

        video.addEventListener(
            "canplay",
            function () {
                if (!video.hasLoaded) {
                    video.hasLoaded = true;

                    var self = this;

                    (function repeat(i) {
                        setTimeout(function () {
                            var timestamp = i;

                            self.currentTime = timestamp;

                            if (--i) {
                                repeat(i);
                            } else {
                                setInterval(function () {
                                    let currentTime = video_preview.currentTime;

                                    self.currentTime = currentTime + 10;
                                }, 1000);
                            }
                        }, 200);
                    })(11);
                }
            },
            false
        );

        video.addEventListener(
            "seeked",
            function () {
                console.log("grabbing screen for", this.currentTime);
                takeScreen();
            },
            false
        );
    };

    if (document.querySelector("input[type=file]").files.length > 0) {
        reader.readAsDataURL(
            document.querySelector("input[type=file]").files[0]
        );
    }
}

function takeScreen() {
    var w = video.videoWidth;
    var h = video.videoHeight;
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    var data = canvas.toDataURL("image/jpg");

    screens.push(data);

    if (screens.length > 10) {
        screens.splice(0, screens.length - 10);
    }

    addScreen();
}

function addScreen() {
    var str = '<div style="position:relative;width:calc(100% + .25rem)">';
    screens.forEach(function (screen) {
        str +=
            '<img src="' +
            screen +
            '" style="width:calc(10% - 0.5rem)" class="m-1" />';
    });
    str += "</div>";
    document.getElementById("screens-container").innerHTML = str;
}

function failed(e) {
    switch (e.target.error.code) {
        case e.target.error.MEDIA_ERR_ABORTED:
            console.log("You aborted the video playback.");
            break;
        case e.target.error.MEDIA_ERR_NETWORK:
            console.log(
                "A network error caused the video download to fail part-way."
            );
            break;
        case e.target.error.MEDIA_ERR_DECODE:
            console.log(
                "The video playback was aborted due to a corruption problem or because the video used features your browser did not support."
            );
            break;
        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            console.log(
                "The video could not be loaded, either because the server or network failed or because the format is not supported."
            );
            break;
        default:
            console.log("An unknown error occurred.");
            break;
    }
}
