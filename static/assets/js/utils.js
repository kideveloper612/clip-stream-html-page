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
    const pattern = new RegExp(
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
            "(\\#[-a-z\\d_]*)?$",
        "i"
    );
    return !!pattern.test(string);
}

function addProtocol(domain) {
    if (domain.indexOf("http") === -1) {
        return "http://" + domain;
    }

    return domain;
}
