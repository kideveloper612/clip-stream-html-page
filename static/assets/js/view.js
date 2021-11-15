var screens = [];

var video = document.getElementById("video");
var video_preview = document.getElementById("video_preview");

var reader = new FileReader();
var auto = false;
var interval;
var initialFlag = true;
var records = [];
var videoName;

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

async function initialLoad() {
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
                takeScreen(this.currentTime);
            },
            false
        );
    };

    if (document.querySelector("input[type=file]").files.length > 0) {
        const file = document.querySelector("input[type=file]").files[0];
        reader.readAsDataURL(file);

        videoName = file.name || "";

        await ajaxCall("/fetch", JSON.stringify({ videoName }))
            .then((res) => {
                if (res.status === "ok") {
                    records = [...res.lists];
                } else alert("Error on adding new record");
            })
            .catch((err) => console.log(err));

        displayRecords();

        let formData = new FormData();
        formData.append("file", file);
        fetch("/upload", {
            method: "POST",
            body: formData,
        })
            .then((res) => {
                if (res.status === 200) {
                    console.log("Successfully uploaded!");
                } else {
                    console.log("Failed for uploading file!");
                }
            })
            .catch((err) => console.log(err));
    }
}

function displayRecords() {
    let listGroup = document.getElementById("highlight");

    let listItem = "";
    records.forEach(function (record) {
        listItem +=
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
            "</a>";
    });

    listGroup.innerHTML = listItem;
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
