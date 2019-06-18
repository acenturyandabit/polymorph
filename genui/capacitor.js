//v1.1: Added a fireFirst option specifiying the first event should be fired immediately.
//Capacitor: for storing calls to an external api which shouldn't be called frequently (e.g. a firebase backend or XHR!)
//arguments: t: time between requests. load: the number of requests after which to submit the request. send: function to send the data to.
//call function: submit(uuid(optional), data(optional)): submit some data to the capacitor.
function capacitor(t, limit, send, fireFirst = false, checkInterval = 100) {
    let me = this;
    let lastUID;
    let lastData;
    let tcount = 0;
    let rqcount = 0;
    let pid = undefined;
    let prefire = false;
    this.forceSend = function () {
        send(lastUID, lastData);
        rqcount = 0;
        clearTimeout(pid);
        pid = undefined;
    }
    this.checkAndUpdate = function () {
        tcount -= checkInterval;
        if (tcount <= 0) {
            if (!prefire) {
                me.forceSend();
            }
        } else {
            pid = setTimeout(me.checkAndUpdate, checkInterval);
        }
    }
    this.submit = function (UID, data) {
        if (lastUID != UID && lastUID) {
            me.forceSend();
        } else {
            if (rqcount == 0 && fireFirst) {
                lastUID = UID;
                me.forceSend();
                prefire = true;
            } else {
                prefire = false;
            }
            rqcount++;
            if (rqcount > limit) {
                me.forceSend();
                rqcount = 1;
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

function tryUntilTrue(f, times = 5, separation=500) {
    try {
        f();
    } catch (e) {
        console.log(e);
        if (times != 0) {
            setTimeout(()=>{tryUntilTrue(f, times - 1, separation)}, separation);
        }
    }
}