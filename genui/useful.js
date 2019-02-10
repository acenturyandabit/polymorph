function isPhone() {
    var mobiles = [
        "Android",
        "iPhone",
        "Linux armv8l",
        "Linux armv7l",
        "Linux aarch64"
    ];
    if (mobiles.includes(navigator.platform)) {
        return true;
    }
    return false;
}

function guid() {
    let pool = "1234567890qwertyuiopasdfghjklzxcvbnm";
    tguid = "";
    for (i = 0; i < 4; i++) tguid += pool[Math.floor(Math.random() * pool.length)];
    return tguid;
}

function randcol() {
    var output = "#00";
    var ac_char = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "0",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f"
    ];
    for (var i = 0; i < 2; i++) {
        output += ac_char[Math.floor(Math.random() * 17)];
    }
    output += "00";
    return output;
}