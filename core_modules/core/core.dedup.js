{
    // Dedup detection
    const broadcast = new BroadcastChannel('channel1');
    let instance_uuid = polymorph_core.guid();
    let checkerPromiseResolve = undefined;
    broadcast.onmessage = (event) => {
        if (event.data.url.replace("#", "") == window.location.href.replace("#", "") && event.data.uuid != instance_uuid) {
            if (checkerPromiseResolve) {
                checkerPromiseResolve(true);
                checkerPromiseResolve = undefined;
            } else if (!event.data.echo) {
                broadcast.postMessage({
                    url: window.location.href,
                    uuid: instance_uuid,
                    echo: true
                });
            }
        }
    };
    let checkForURLConflict = async() => {
        return new Promise((res) => {
            checkerPromiseResolve = res;
            broadcast.postMessage({
                url: window.location.href,
                uuid: instance_uuid
            })
            setTimeout(() => {
                if (checkerPromiseResolve) {
                    checkerPromiseResolve(false);
                    checkerPromiseResolve = undefined;
                }
            }, 500);
        });
    }

    polymorph_core.blockIfURLConflict = async() => {
        let hasUrlConflict = await checkForURLConflict();
        if (hasUrlConflict) {
            alt_alive_warning.style.visibility = "visible";
            return;
        }
    }

    let alt_alive_warning = document.createElement("div");
    alt_alive_warning.innerHTML = `
        <div style="padding:10vw">
            <h1>Warning! This document is already open in another window. Please use the other window instead.</h1>
        </div>
    `;
    alt_alive_warning.style.cssText = `
    display:flex;
    visibility:hidden;
    place-items: center center;
    position:absolute;
    height:100%;
    width:100%;
    z-index:5;
    background: rgba(0,0,0,0.8);
    color:white;
    text-align:center;
    `;
    document.body.appendChild(alt_alive_warning);

}