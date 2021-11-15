var screens = [];

var video = document.getElementById("video");
var video_preview = document.getElementById("video_preview");

var reader = new FileReader();
var auto = false;
var interval;
var initialFlag = true;
var records = [];
var blurIndex;
var videoName;
var toastBody = document.getElementsByClassName("toast-body")[0];

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
                document.getElementById("time").value = setTime(
                    video_preview.currentTime
                );
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
        initialize(0);

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
            } else {
                alert("Wrong format for time!");

                return;
            }
            if (totalTime > video_preview.duration) {
                alert("Maximum time is limited by " + video_preview.duration);

                return;
            }

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
    video_preview.currentTime = index;
    document.getElementById("time").value = setTime(index);
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
    let listGroup = document.getElementById("highlight");

    var tr = "";
    let listItem = "";
    records.forEach(function (record) {
        tr +=
            '<tr onclick="clickRecord(' +
            record.id +
            ')"><th scope="row">' +
            record.time +
            "</th><td>" +
            record.concept +
            "</td><td>" +
            record.name +
            "</td><td>" +
            record.link +
            "</td></tr>";

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

    tbody.innerHTML = tr;
    listGroup.innerHTML = listItem;
}

function initialize(index) {
    if (index >= 0) {
        document.getElementById("time").value = "00:00";
    }
    document.getElementById("concept").value = "";
    document.getElementById("name").value = "";
    document.getElementById("link").value = "";
}

async function addRecord() {
    let time = document.getElementById("time").value;
    let concept = document.getElementById("concept").value;
    let name = document.getElementById("name").value;
    let link = document.getElementById("link").value;

    if (time == "" || concept == "" || name == "" || link == "") {
        alert("Please insert all values!");
        return;
    }

    if (!isValidHttpUrl(link)) {
        alert("Please put valid url!");
        return;
    }

    if (typeof videoName === "undefined") {
        alert("Please upload video first!");
        return;
    }

    let id = records.length + 1;
    blurIndex = id;

    let newRecord = {
        id,
        videoName,
        time,
        concept,
        name,
        link,
    };

    await ajaxCall("/add", JSON.stringify(newRecord))
        .then((res) => {
            alertMessage(res);
            if (res.status === "ok") {
                records.push(newRecord);
            }
        })
        .catch((err) => {
            console.log(err);
        });

    displayRecords();
    initialize(0);
}

function alertMessage(res) {
    toastBody.innerText = res.message;

    if (res.status === "ok") {
        document
            .getElementsByClassName("toast")[0]
            .classList.remove("bg-danger");
        document.getElementsByClassName("toast")[0].classList.add("bg-primary");

        $(".toast").toast("show");
    } else {
        document
            .getElementsByClassName("toast")[0]
            .classList.remove("bg-primary");

        $(".toast").toast("show");

        document.getElementsByClassName("toast")[0].classList.add("bg-danger");
    }
}

function clickRecord(id) {
    let clickItem = records.find((o) => parseInt(o.id) === parseInt(id));

    document.getElementById("time").value = clickItem.time;
    document.getElementById("concept").value = clickItem.concept;
    document.getElementById("name").value = clickItem.name;
    document.getElementById("link").value = clickItem.link;

    blurIndex = id;
}

async function changeRecord() {
    if (typeof blurIndex === "undefined") return;

    let time = document.getElementById("time").value;
    let concept = document.getElementById("concept").value;
    let name = document.getElementById("name").value;
    let link = document.getElementById("link").value;
    let id = blurIndex;

    await ajaxCall("/change", JSON.stringify({ id, time, concept, name, link }))
        .then((res) => {
            alertMessage(res);

            records.find((o, i) => {
                if (o.id === id) {
                    records[i] = { id, time, concept, name, link };
                    return true;
                }
            });
        })
        .catch((err) => {
            console.log(err);
        });

    displayRecords();
    initialize(0);
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

async function removeRecord() {
    if (typeof blurIndex === "undefined") return;

    await ajaxCall("/remove", JSON.stringify({ id: blurIndex }))
        .then((res) => {
            alertMessage(res);

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
        })
        .catch((err) => {
            console.log(err);
        });

    displayRecords();
    initialize(0);
}

function toEdit() {
    console.log("---");
    $(".edit-page").css("display", "none");
    $(".view-page").css("display", "initial");
}

function toView() {
    console.log("====");
    $(".view-page").css("display", "none");
    $(".edit-page").css("display", "initial");
}

$(document).ready(function () {
    $(".toast").toast({
        delay: 3000,
    });
});
