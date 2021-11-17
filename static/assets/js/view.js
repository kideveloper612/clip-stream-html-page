var screens = [];

var video = document.getElementById("video");
var video_preview = document.getElementById("video_preview");

var reader = new FileReader();
var auto = false;
var interval;
var intervalHighlight;
var initialFlag = true;
var records = [];
var videoName;
var isVideoPlaying;

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

function manageHighlight() {
    if (isVideoPlaying) {
        intervalHighlight = setInterval(function () {
            displayRecords();
        }, 1000);
    }
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

function clickThumb(index) {
    video_preview.currentTime = index;
}

async function toggleLoad() {
    screens = [];

    video.autoplay = video_preview.autoplay = true;
    video.hasLoaded = video_preview.hasLoaded = false;

    video_preview.addEventListener("canplay", function () {
        video_preview.hasLoaded = true;
    });

    video_preview.addEventListener("play", function () {
        if (!initialFlag) {
            screens = [];
            video_preview.hasLoaded = true;

            var self = this;
            var playTime = self.currentTime;

            manageInterval(playTime);
        }
        manageHighlight();
    });

    video_preview.addEventListener("pause", function () {
        initialFlag = false;
        clearInterval(interval);
        clearInterval(intervalHighlight);
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
            displayRecords();
            takeScreen(this.currentTime);
        },
        false
    );

    videoName = sessionStorage.getItem("videoFile") || "";

    await ajaxCall("/fetch", JSON.stringify({ videoName }))
        .then((res) => {
            if (res.status === "ok") {
                records = [...res.lists];
            } else alert("Error on adding new record");
        })
        .catch((err) => console.log(err));

    isVideoPlaying = (video_preview) =>
        !!(
            video_preview.currentTime > 0 &&
            !video_preview.paused &&
            !video_preview.ended &&
            video_preview.readyState > 2
        );
}

async function manageToggle() {
    videoName = sessionStorage.getItem("videoFile");

    if (videoName !== undefined && videoName !== null) {
        await ajaxCall("/fetch", JSON.stringify({ videoName }))
            .then((res) => {
                if (res.status === "ok") {
                    records = [...res.lists];
                } else alert("Error on adding new record");
            })
            .catch((err) => console.log(err));
    }
}

function compareTimeSlot(recordTime, videoTime) {
    let recordSlots = recordTime.split(":");
    let totalRecordTime =
        parseInt(recordSlots[0] * 60) + parseInt(recordSlots[1]);

    if (totalRecordTime === Math.floor(videoTime)) return true;
    return false;
}

function displayRecords() {
    console.log(records);
    records.forEach(function (record) {
        if (compareTimeSlot(record.time, video_preview.currentTime)) {
            let $listItem = $(
                '<a href="' +
                    record["link"] +
                    '" class="list-group-item list-group-item-action flex-column align-items-start" target=”_blank”>' +
                    '<div class="d-flex w-100 justify-content-between">' +
                    '<h5 class="mb-1">' +
                    record.time +
                    "</h5>" +
                    '<small class="text-muted">' +
                    record.concept +
                    "</small>" +
                    "</div>" +
                    '<p class="mb-1">' +
                    record.name +
                    "</p>" +
                    '<small class="text-muted">' +
                    record.link +
                    "</small>" +
                    "</a>"
            );

            $("#highlight").append($listItem);

            setTimeout(function () {
                $listItem.remove();
            }, 4000);
        }
    });
}

function ajaxCall(url, data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: "POST",
            data: data,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            async: false,
            success: function (res) {
                resolve(res);
            },
            error: function (err) {
                reject(err);
            },
        });
    });
}

$(document).ready(function () {
    let videoFile = sessionStorage.getItem("videoFile");

    if (videoFile !== undefined || videoFile !== null) {
        document
            .querySelector("#video_preview > source")
            .setAttribute("src", "static/videos/sample.mp4");

        document.getElementById("video_preview").load();
        toggleLoad();
    }
});
