if (!isPhone()) {

    function _topbar(parent, options) {
        this.node = document.createElement("ul");
        this.node.classList.add("topbar");
        //check if we need to inject style
        if (!document.querySelector("style.topbar")) {
            let s = document.createElement("style");
            s.classList.add("topbar");
            s.innerHTML = `
            /*General styling*/
            ul.topbar, ul.topbar ul {
                list-style-type: none;
                margin: 0;
                padding: 0;
                background: black;
                overflow: auto;
                font-size: 1em;
                z-index: 1000;
            }
            
            ul.topbar li>a {
                user-select: none;
                cursor: pointer;
                display: inline-block;
                z-index: 1000;
            }
    
            ul.topbar li{
                background:black;
            }
    
            ul.topbar li:hover{
                background-color: lightskyblue;
                z-index: 1000;
            }
    
            /*Top level specific styling*/
            ul.topbar>li>a{
                color: white;
                text-align: center;
                text-decoration: none;
                padding: 0.5em 16px;
                z-index: 1000;
            }
            
            ul.topbar>li{
                float:left;
                background:black;
                z-index: 1000;
            }
    
            ul.topbar>li>ul {
                font-size: 1em;
                z-index: 1000;
            }
            /*sublist specific styling*/
            ul.topbar ul {
                display: none;
                color:black;
                text-align:left;
                position: absolute;
                background-color: #f9f9f9;
                z-index: 1;
                list-style: none;
                z-index: 1000;
            }
            
            ul.topbar>li:hover>ul {
                display: block;
                z-index: 1000;
            }
    
            ul.topbar ul>li>a{
                display:block;
                color:white;
                padding: 0.5em;
                z-index: 1000;
            }
            `;
            this.node.appendChild(s);
        }
        if (parent) parent.appendChild(this.node);

        let addToList = (el, base, pathName) => {
            let a = document.createElement("a");
            let li = document.createElement("li");
            li.dataset.topbarname = pathName;
            a.appendChild(el);
            li.appendChild(a);
            base.appendChild(li);
            return li;
        }
        this.add = this.appendChild = (string, domEl) => {
            // string is domel; string is one string, string is path, string is path and domel is domel
            if (typeof(string) != "string") {
                domEl = string;
                string = "";
            }
            let bits = string.split("/");
            if (!domEl) {
                domEl = document.createElement("a");
                domEl.innerText = bits[bits.length - 1];
            }
            let base = this.node;
            while (bits.length > 1) {
                let nextBit = bits.shift();
                if (nextBit) {
                    let newBase = base.querySelector(`[data-topbarname="${nextBit}"]>ul`);
                    if (!newBase) {
                        let newBaseLi = base.querySelector(`[data-topbarname="${nextBit}"]`);
                        if (!newBaseLi) {
                            let tempA = document.createElement("a");
                            tempA.innerText = nextBit;
                            newBaseLi = addToList(tempA, base, nextBit);
                        }
                        base = document.createElement("ul");
                        newBaseLi.appendChild(base);
                    } else {
                        base = newBase;
                    }
                }
            }
            //check if the domelement already exists; it might
            if (!base.querySelector(`[data-topbarname="${bits[0]}"]`)) {
                return addToList(domEl, base, bits[0]);
            }
        }
    }

    polymorph_core.on("UIsetup", () => {
        document.body.appendChild(htmlwrap( /*html*/ `
        <style>
    
        .showAndFadeOut {
            transition: opacity visibility 3s;
            animation: showAndFadeOut 3s;
        }
    
        @keyframes showAndFadeOut {
            0% {opacity: 1; visibility: visible;}
            80% {opacity: 1; visibility: visible;}
            100% {opacity: 0; visibility: hidden;}
        }
    
        @keyframes precessBackground {
            0% {background-position-x: 0%}
            100% {background-position-x: 100%}
        }
        </style>`));
        document.body.appendChild(htmlwrap( /*html*/ `
        <div style="display:flex; flex-direction:column; height:100vh">
            <div class="banner" style="z-index:100">
                <div class="installPrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Install our desktop app! It's free!</button></div>
                <div class="gdrivePrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Try our Google Drive app for quick access to your files!</button></div>
                <!--<button class="sharer" style="background:blueviolet; border-radius:3px; border:none; padding:3px; color:white; position:absolute; top: 10px; right: 10px;">Share</button>-->
            </div>
            <div class="rectspace" style="width:100%; flex:0 1 100vh; max-height: calc(100% - 2.1em); position:relative">
            </div>
        </div>
        `));
        document.body.appendChild(htmlwrap(`
        <div class="wall"
            style="position:absolute; width:100%; height:100%; top:0; left: 0; background: rgba(0,0,0,0.5); display: block">
            <div style="height:100%; display:flex; justify-content: center; flex-direction: column">
                <h1 style="color:white; text-align:center">Hold on, we're loading your data...</h1>
            </div>
        </div>`));
        ///////////////////////////////////////////////////////////////////////////////////////
        //Top bar
        polymorph_core.topbar = new _topbar(document.querySelector(".banner"));
    })

    polymorph_core.on("UIstart", () => {
        if (!polymorph_core.isStaticMode()) {
            polymorph_core.topbar.add("File/Open").addEventListener("click", () => {
                window.open(window.location.pathname + "?o", "_blank");
            })
            polymorph_core.topbar.add("File/New").addEventListener("click", () => {
                window.open(window.location.pathname + "?o", "_blank");
            })
            polymorph_core.topbar.add("Help/Tutorial").addEventListener("click", () => {
                polymorph_core.resetTutorial();
            })
            polymorph_core.topbar.add("Help/Date Syntax").addEventListener("click", () => {
                polymorph_core.dialog.prompt(htmlwrap(`
                    <div>
                        <h1>Date syntax</h1>
                        <table>
                            <tr>
                                <td>(10:00)</td>
                                <td>Every 10:00am (smart allocator assumes you'll probably mean the morning.).</td>
                            </tr>
                            <tr>
                                <td>
                                    ( start date || next date generator | number of repetitions OR end date)
                                </td>
                                <td> Repetition structure </td>
                            </tr>
                        </table>
                    </div>
                `));
            })
            polymorph_core.topbar.add("Feedback").addEventListener("click", () => {
                let emaila = htmlwrap(`<a target="_blank" href="mailto:steeven.liu2@gmail.com?body=Hey%20there,%20I'm%20using%20polymorph%20and..." style="display:none"></a>`);
                document.body.appendChild(emaila);
                emaila.click();
            });
            let dbm = polymorph_core.topbar.add("File/Debug Mode");

            function updateDBM() {
                if (localStorage.getItem("__polymorph_debug_flag") == "true") {
                    dbm.children[0].children[0].innerText = "Debug Mode (now ON)";
                } else {
                    dbm.children[0].children[0].innerText = "Debug Mode";
                }
            }
            updateDBM();
            dbm.addEventListener("click", () => {
                localStorage.setItem("__polymorph_debug_flag", !(localStorage.getItem("__polymorph_debug_flag") == "true"));
                updateDBM();
            });
        }
        window.addEventListener("resize", () => {
            polymorph_core.baseRect.refresh();
        })
    });

    polymorph_core.on("UIsetup", () => {

        let notifArea = htmlwrap( /*html*/ `
        <div class="notifArea">
        <style>
        .notifArea{
            position: fixed;
            right: 10px;
            top: 10px;
            z-index: 150;
        }

        .notifArea>div{
            margin: 0 1vh;
            font-size: 1.5vh;
            line-height: 1;
            background: #000;
            color: white;
            transition: all 0.3s;
            height: 0px; /* Start hidden */
            overflow: hidden;
        }
        .notifArea>div>div{
            padding: 0.5vh 0.5vw;
        }

        .notifArea>div.success{
            background: green;
        }

        .notifArea>div.error{
            background: red;
        }

        </style>
        </div>
        `);
        document.body.appendChild(notifArea);
        polymorph_core.showNotification = function(notificationMessage, notificationType = 'default') {
            // Spawn a new notif bubble
            // Require wrapping otherwise scrollHeight below fails
            let notifBubble = htmlwrap(`<div>
                <div>${notificationMessage}
                </div>
            </div>`);
            notifArea.appendChild(notifBubble);
            let targetHeight = notifBubble.scrollHeight;
            notifBubble.style.height = targetHeight + "px";
            notifBubble.style.marginTop = "1vh";
            notifBubble.classList.add(notificationType);
            setTimeout(() => {
                notifBubble.style.height = "";
                notifBubble.style.marginTop = "0";
                setTimeout(() => {
                    notifBubble.remove();
                }, 1000);
            }, 5000);
        }
    });

}

// dirty little hack that allows shadow root code to work better on firefox
if (!ShadowRoot.prototype.getSelection) ShadowRoot.prototype.getSelection = () => document.getSelection()