//v4.0: added capacitor.
function isPhone() {
    var mobiles = [
        "Android",
        "iPhone",
        "Linux armv8l",
        "Linux armv7l",
        "Linux aarch64"
    ];
    if (mobiles.includes(navigator.platform) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
    }
    return false;
}

function guid(count = 6) {
    let pool = "1234567890qwertyuiopasdfghjklzxcvbnm";
    tguid = "";
    for (i = 0; i < count; i++) tguid += pool[Math.floor(Math.random() * pool.length)];
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

function randCSSCol(){
    let rgb=[0,0,0];
    rgb[0] = Math.round(Math.random() * 255);
    rgb[1] = Math.round(Math.random() * 255);
    rgb[2] = Math.round(Math.random() * 255);
    return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
}

// http://www.w3.org/TR/AERT#color-contrast
function matchContrast(col){
    //returns either black or white from either a #COLOR or a rgb(color)
    cols=/\#(..)(..)(..)/i.exec(col)
    if (!cols){
        cols=/rgba?\s*\((\d+),(\d+),(\d+)/i.exec(col);
    }else{
        cols=[cols[0],cols[1],cols[2],cols[3]];
        cols[1]=parseInt(cols[1],16);
        cols[2]=parseInt(cols[2],16);
        cols[3]=parseInt(cols[3],16);
    }
    if (!cols) throw "Invalid color";
    let value=Math.round(((parseInt(cols[1]) * 299) +
                      (parseInt(cols[2]) * 587) +
                      (parseInt(cols[3]) * 114)) / 1000);
    return (value > 125) ? 'black' : 'white';
}

function documentReady(f) {
    if (document.readyState == 'loading') {
        document.addEventListener("DOMContentLoaded", f);
    } else f();
}
