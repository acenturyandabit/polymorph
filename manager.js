window.addEventListener('error', function (e) {
    if (e.target.tagName == "SCRIPT" && e.target.onclick) e.target.onclick();//click the script element to push an event to it
}, true);

var __assert_states = {};
function scriptassert(list, done, sroot) {//shadow root option
    if (!sroot) sroot = window; // TODO: add 404 support, auto detect 
    let _list = [];
    if (list.length == undefined) {
        for (i in list) {
            _list.push([i, list[i].p, list[i].s]);
        }
        list = _list;
    }
    if (list.length) {
        let varname = list[0][0];
        let path = list[0][1];
        let csspath = list[0][2];
        list.splice(0, 1);
        if (!__assert_states[varname]) {
            //first check if the script already exists in the document.
            let scripts = document.querySelectorAll("script");
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].src == path) {
                    //ok we done here
                    __assert_states[varname] = { state: 'done' };
                    //add the css to the root anyways?
                    done();
                }
            }
            __assert_states[varname] = { state: 'loading' };
            __assert_states[varname].callbacks = [];
            __assert_states[varname].callbacks.push(() => { scriptassert(list, done) });
            //append script to root
            //wait until script is done loading?
            // if there is a css file load that as well.
            if (csspath) {
                let l = document.createElement("link");
                l.href = csspath;
                l.rel = "stylesheet";
                l.type = "text/css";
                document.head.appendChild(l);
            }
            let s = document.createElement("script");
            document.head.appendChild(s);
            s.onload = function () {
                __assert_states[varname].state = 'done';
                for (var i = 0; i < __assert_states[varname].callbacks.length; i++) {
                    __assert_states[varname].callbacks[i]();
                    //console.log("done");
                }
            }
            s.onclick = () => {
                console.log("scriptassert: ERROR 404 from " + varname);
                //something went wrong
                __assert_states[varname].state = 'failed'
                for (var i = 0; i < __assert_states[varname].callbacks.length; i++) {
                    __assert_states[varname].callbacks[i]();
                    //console.log("done");
                }
            }

            try {
                s.src = path;
            } catch (e) {
                console.log(e);
            }
            //while(waiting);
            //console.log("started...");
        } else if (__assert_states[varname].state == 'loading') {
            __assert_states[varname].callbacks.push(() => { scriptassert(list, done) });
            //console.log("skipped, waiting");
        } else {
            //console.log("skipped, ready");
            scriptassert(list, done)
        }
    } else if (done) done();
}


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
        if (options.presubmit) options.presubmit();
        if (lastUID != UID && lastUID) {
            me.forceSend();
        } else {
            if (rqcount == 0 && options.fireFirst) {
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
            if (options.afterLast && pid) {
                clearTimeout(pid);
                pid = undefined;
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

function htmlwrap(html, el) {
    let d = document.createElement(el || 'div');
    d.innerHTML = html;
    if (d.children.length == 1) {
        let dd=d.children[0];
        dd.remove();
        return dd;
    }
    else return d;
}

function waitForFn(property) {
    let me = this;
    if (!this[property]) this[property] = function (args) {
        setTimeout(() => me[property].apply(me, arguments), 1000);
    }
}

var __manager_profiles = {
    base: {
        files: [
            ["polymorph_core", "core.js"],
            ["polymorph_core_dialog", "core_modules/ui/core.dialog.js"],
            ["polymorph_core_tutorial", "core_modules/ui/core.tutorial.js"],
            ["polymorph_core_docLoading", "core_modules/core/core.docLoading.js"],
            ["polymorph_core_loadSaveUI", "core_modules/ui/core.loadSaveUI.js"],
            ["polymorph_core_dataUtils", "core_modules/core/core.dataUtils.js"],
            ["polymorph_core_container", "core_modules/core/core.container.js"],
            ["polymorph_core_contextMenu", "core_modules/ui/core.contextMenu.js"],
            ["polymorph_core_itemfx", "core_modules/core/core.itemfx.js"],
            ["polymorph_core_operator", "core_modules/core/core.operator.js"],
            ["polymorph_core_dragdrop", "core_modules/ui/core.dragdrop.js"],
            //["templates", "core_modules/core.templates.js"],
        ]
    },
    operators: {
        files: [
            ["opSelect", "operators/opSelect.js"],
            ["itemList", "operators/itemList.js"],
            ["descbox", "operators/descbox.js"],
            ["calendar", "operators/calendar.js"],
            //["stack", "operators/stack.js"],
            ["terminal", "operators/terminal.js"],
            ["collapsigant", "operators/collapsigant.js"],
            ["richbox", "operators/richbox.js"],
            ["inspector", "operators/inspector.js"],
            ["inspectolist", "operators/inspectolist.js"],
            //["sorter", "operators/sorter.js"],
            //["httree", "operators/httree.js"],
            //["chat", "operators/chat.js"],
            ["itemcluster", "operators/itemcluster.js"],
            ["welcome", "operators/welcome.js"],
            ["litem", "operators/litem.js"],
            //["turmach", "operators/turmach.js"],
            //["roundshow", "operators/roundshow.js"],
            //["tester", "operators/tester.js"],
            //["ruigen", "operators/ruigen/rui_operator.js"],
            //["calendar2", "operators/calendar.2.js"],
            ["scriptrunner", "operators/scriptrunner.js"],
            ["timerOperator", "operators/timer.js"],
            //["textflow", "operators/textflow/textflow.js"]
        ]
    },
    saveSources: {
        files: [
            ["outputToText", "saveSources/outputToText.js"],
            ["localforage2", "saveSources/localforage2.js"],
            ["permalink", "saveSources/permalink.js"],
            //["firebase_savesource", "saveSources/firebase.js"],
            ["server", "saveSources/server.js"],
            //["gdrive", "saveSources/gdrive.js"],
            //["websocket", "saveSources/websocket.js"],
        ]
    },
    phone: {
        condition: () => {
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
        },
        files: [
            //["polymorph_core_dialog", "versions/phone/core.dialog.js"],
            { r: "base" },
            ["polymorph_coreUI", "versions/phone/coreUI.js"],
            ["rect", "versions/phone/rect.js"],
            ["subframe", "operators/phone/subframe.js"],
            { r: "operators" },
            { r: "saveSources" },
        ]
    },
    default: {
        files: [
            { r: "base" },
            ["polymorph_core_rect", "core_modules/core/core.rect.js"],
            //["polymorph_core_palette", "core_modules/core.palette.js"],
            ["polymorph_coreUI", "versions/desktop/coreUI.js"],
            { r: "operators" },
            ["subframe", "operators/subframe.js"],
            ["metasubframe", "operators/metasubframe.js"],
            { r: "saveSources" },
        ]
    }
};
(function () {
    //function to expand a profile
    function expand(files) {
        let expanded = true;
        while (expanded) {
            expanded = false;
            for (let i = 0; i < files.length; i++) {
                if (files[i].r) {
                    for (let j = __manager_profiles[files[i].r].files.length - 1; j >= 0; j--) {
                        files.splice(i + 1, 0, __manager_profiles[files[i].r].files[j]);
                    }
                    files.splice(i, 1);//get rid of the r one
                    expanded = true;
                }
            }
        }
        return files;
    }


    //first, find the tag that contains me. If it has a parameter that determines version, load that version
    let loaded = false;
    let mscpt = document.querySelector("script[src*='manager.js']");
    if (mscpt && mscpt.dataset.version) {
        if (__manager_profiles[mscpt.dataset.version])
            scriptassert(expand(__manager_profiles[mscpt.dataset.version].files), () => {
                document.getElementById("preloadRemove").remove();
                polymorph_core.start();
            });
        loaded = true;
    } else {
        for (i in __manager_profiles) {
            if (__manager_profiles[i].condition && __manager_profiles[i].condition()) {
                //load all files from phone
                scriptassert(expand(__manager_profiles[i].files), () => {
                    document.getElementById("preloadRemove").remove();
                    polymorph_core.start();
                });
                loaded = true;
            }
        }
    }

    if (!loaded) {
        scriptassert(expand(__manager_profiles['default'].files), () => {
            document.getElementById("preloadRemove").remove();
            polymorph_core.start();
        });
    }
})()