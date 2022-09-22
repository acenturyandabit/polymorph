// Capacitor. Prevents multiple calls to an underlying resource-intensive or disruptive function from occuring,
// by buffering the call for a later, more appropriate time.
function capacitor(t, limit, send, settings = {}, checkInterval = 100) {
    let options = {
        fireFirst: false,
        afterLast: true,
    };
    if (typeof (settings) == "boolean") {
        options.fireFirst = settings;
    } else {
        Object.assign(options, settings);
    }
    let lastUID;
    let lastData;
    let tcount = 0;
    let rqcount = 0;
    let pid = undefined;
    let prefire = false;
    this.forceSend = () => {
        send(lastUID, lastData);
        rqcount = 0;
        clearTimeout(pid);
        pid = undefined;
    }
    this.checkAndUpdate = () => {
        tcount -= checkInterval;
        if (tcount <= 0) {
            if (!prefire) {
                this.forceSend();
            }
        } else {
            pid = setTimeout(this.checkAndUpdate, checkInterval);
        }
    }
    this.submit = (UID, data) => {
        if (options.presubmit) options.presubmit();
        if (lastUID != UID && lastUID) {
            this.forceSend();
        } else {
            if (rqcount == 0 && options.fireFirst) {
                lastUID = UID;
                this.forceSend();
                prefire = true;
            } else {
                prefire = false;
            }
            rqcount++;
            if (rqcount == limit) {
                this.forceSend();
                rqcount = 1;
            }
            if (options.afterLast && pid) {
                clearTimeout(pid);
                pid = undefined;
            }
            if (!pid) {
                tcount = t;
                pid = setTimeout(this.checkAndUpdate, checkInterval);
            }
        }
        lastUID = UID;
        lastData = data;
    }
    this.cancel = ()=>{
        rqcount = 0;
        clearTimeout(pid);
        pid = undefined;
    }
}

function htmlwrap(html, el) {
    let d = document.createElement(el || 'div');
    d.innerHTML = html;
    if (d.children.length == 1) {
        let dd = d.children[0];
        dd.remove();
        return dd;
    } else return d;
}

function waitForFn(property) {
    let me = this;
    if (!this[property]) this[property] = function (args) {
        setTimeout(() => me[property].apply(me, arguments), 1000);
    }
}