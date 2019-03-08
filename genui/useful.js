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

function documentReady(f) {
    if (document.readyState == 'loading') {
        document.addEventListener("DOMContentLoaded", f);
    } else f();
}

//Capacitor: for storing calls to an external api which shouldn't be called frequently (e.g. a firebase backend or XHR!)
//arguments: t: time between requests. load: the number of requests after which to submit the request. send: function to send the data to.
//call function: submit(uuid, data(optional)): submit some data to the capacitor.
function capacitor(t, limit, send, checkInterval = 100) {
    let me = this;
    let lastUID;
    let lastData;
    let tcount = 0;
    let rqcount = 0;
    let pid = undefined;
    this.forceSend = function () {
        send(lastUID, lastData);
        rqcount = 0;
        clearTimeout(pid);
        pid = undefined;
    }
    this.checkAndUpdate = function () {
        tcount -= checkInterval;
        if (tcount <= 0) {
            me.forceSend();
        } else {
            pid = setTimeout(me.checkAndUpdate, checkInterval);
        }
    }
    this.submit = function (UID, data) {
        if (lastUID != UID && lastUID) {
            me.forceSend();
        } else {
            rqcount++;
            if (rqcount > limit) {
                me.forceSend();
            }
            if (!pid) {
                tcount = t;
                pid = setTimeout(me.checkAndUpdate, checkInterval);
            }
        }
        lastUID = UID;
        lastData = data;
    }
}