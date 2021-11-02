var screens = [];

var video = document.getElementById("video");
var video_preview = document.getElementById("video_preview");

var reader = new FileReader();
var auto = false;
var interval;
var initialFlag = true;
var records = [];
var blurIndex;

function manageInterval(playTime = 0) {
    (function repeat(i) {
        setTimeout(function () {
            var timestamp = playTime + 11 - i;

            video.currentTime = timestamp;

            if (--i) {
                repeat(i);
            } else {
                interval = setInterval(function () {
                    if (video.currentTime === video.duration) {
                        clearInterval(interval);
                    }

                    if (!video_preview.paused) {
                        video.currentTime = video_preview.currentTime + 10;
                    }
                }, 1000);
            }
        }, 200);
    })(11);
}

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

        video_preview.addEventListener("play", function () {
            if (!initialFlag) {
                screens = [];
                video_preview.hasLoaded = true;

                var self = this;
                var playTime = self.currentTime;

                manageInterval(playTime);
            }
        });

        video_preview.addEventListener("pause", function () {
            initialFlag = false;
            clearInterval(interval);
        });

        video.addEventListener(
            "canplay",
            function () {
                if (!video.hasLoaded) {
                    video.hasLoaded = true;

                    manageInterval();
                }
            },
            false
        );

        video.addEventListener(
            "seeked",
            function () {
                document.getElementById("time").value = setTime(
                    video_preview.currentTime
                );
                takeScreen(this.currentTime);
            },
            false
        );
    };

    if (document.querySelector("input[type=file]").files.length > 0) {
        reader.readAsDataURL(
            document.querySelector("input[type=file]").files[0]
        );
    }

    document.getElementById("time").addEventListener("keyup", function (e) {
        if (e.key === "Enter" || e.keyCode === 13) {
            let time = e.target.value;

            let timeSlots = time.split(":");
            let totalTime = 0;
            if (timeSlots.length > 1) {
                if (!isNumeric(timeSlots[0]) || !isNumeric(timeSlots[1])) {
                    alert("Wrong format for time!");
                    return;
                }

                totalTime =
                    parseFloat(timeSlots[0]) * 60 + parseFloat(timeSlots[1]);
            } else if (timeSlots.length === 1) {
                if (!isNumeric(time)) {
                    alert("Wrong format for time!");
                    return;
                }

                totalTime = parseFloat(time);
            }
            if (totalTime > video_preview.duration)
                totalTime = video_preview.duration;

            video_preview.currentTime = totalTime;
        }
    });
}

function takeScreen(time) {
    var w = video.videoWidth;
    var h = video.videoHeight;
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    var data = canvas.toDataURL("image/jpg");

    screens.push([data, time]);

    if (screens.length > 10) {
        screens.splice(0, screens.length - 10);
    }

    addScreen();
}

function clickThumb(index) {
    console.log(index);
    video_preview.currentTime = index;
}

function addScreen() {
    var str = '<div style="position:relative;width:calc(100% + .25rem)">';
    screens.forEach(function (screen) {
        str +=
            '<img src="' +
            screen[0] +
            '" style="width:calc(10% - 0.5rem); cursor: pointer " class="m-1" onclick="clickThumb(' +
            screen[1] +
            ')" />';
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

function displayRecords() {
    var tbody = document.getElementById("tbody");

    var tr = "";
    records.forEach(function (record) {
        tr +=
            '<tr onclick="clickRecord(' +
            record.id +
            ')"><th scope="row">' +
            record.id +
            "</th><td>" +
            record.time +
            "</th><td>" +
            record.concept +
            "</td><td>" +
            record.name +
            "</td><td>" +
            record.link +
            "</td></tr>";
    });

    tbody.innerHTML = tr;
}

function addRecord() {
    let time = document.getElementById("time").value;
    let concept = document.getElementById("concept").value;
    let name = document.getElementById("name").value;
    let link = document.getElementById("link").value;

    if (time == "" || concept == "" || name == "" || link == "") {
        alert("Please insert all values!");
        return;
    }

    let id = records.length + 1;
    blurIndex = id;

    records.push({
        id,
        time,
        concept,
        name,
        link,
    });

    displayRecords();
}

function clickRecord(id) {
    let clickItem = records.find((o) => o.id === id);

    document.getElementById("time").value = clickItem.time;
    document.getElementById("concept").value = clickItem.concept;
    document.getElementById("name").value = clickItem.name;
    document.getElementById("link").value = clickItem.link;

    blurIndex = id;
}

function changeRecord() {
    if (typeof blurIndex === "undefined") return;

    let time = document.getElementById("time").value;
    let concept = document.getElementById("concept").value;
    let name = document.getElementById("name").value;
    let link = document.getElementById("link").value;
    let id = blurIndex;

    records.find((o, i) => {
        if (o.id === id) {
            records[i] = { id, time, concept, name, link };
            return true;
        }
    });

    displayRecords();
}

function removeRecord() {
    if (typeof blurIndex === "undefined") return;

    for (var i = 0; i < records.length; i++) {
        if (records[i].id === blurIndex) {
            records.splice(i, 1);
            i--;

            if (blurIndex > 1) blurIndex -= 1;
        }

        if (records[i] && records[i].id > blurIndex) {
            records[i].id -= 1;
        }
    }

    displayRecords();
}

function setTime(totalSeconds) {
    totalSeconds = Math.round(totalSeconds);

    let seconds = pad(totalSeconds % 60);
    let minutes = pad(parseInt(totalSeconds / 60));

    let timeDisplay = minutes + ":" + seconds;

    return timeDisplay;
}

function pad(val) {
    var valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
}

function isNumeric(str) {
    if (typeof str != "string") return false;
    return !isNaN(str) && !isNaN(parseFloat(str));
}
