function setTime(totalSeconds) {
    totalSeconds = Math.floor(totalSeconds);

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

function initialRecords(lists) {
    records = [...lists];
}

function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}
