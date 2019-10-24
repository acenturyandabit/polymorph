core.on("UIsetup",() => {
    document.body.appendChild(htmlwrap(`
    <style>
    #popup-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        font-size: 18px;
        line-height: 1;
        background: #000;
        color: white;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
    }
    #popup-notification.success {
        background: green;
    }
    #popup-notification.alert {
        background: red;
    }

    .showAndFadeOut {
        transition: opacity visibility 3s;
        animation: showAndFadeOut 3s;
    }

    @keyframes showAndFadeOut {
        0% {opacity: 1; visibility: visible;}
        80% {opacity: 1; visibility: visible;}
        100% {opacity: 0; visibility: hidden;}
    }
    </style>
    <div class="banner">
        <div class="installPrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Install our desktop app! It's free!</button></div>
        <div class="gdrivePrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Try our Google Drive app for quick access to your files!</button></div>
        <!--<button class="sharer" style="background:blueviolet; border-radius:3px; border:none; padding:3px; color:white; position:absolute; top: 10px; right: 10px;">Share</button>-->
        <ul class="topbar">
            <li><a class="docName" contentEditable>New Workspace</a></li>
            <li>&#128190;
                <ul>
                    <li class="open">Open</li>
                    <li class="saveSources">Preferences</li> <!-- default is always localforage for now -->
                </ul>
            </li>
            <li class="viewdialog">🖥️</li>
            <li>ℹ️
                <ul>
                    <li class="about"><a style="text-decoration:none; color:white" href="/about" target="_blank">README</a></li>
                    <li class="hleptute">Operator help</li>
                    <li class="hlepdocs">Help topics</li>
                    <li class="hlepreport">Report an issue...</li>
                    <li class="tutorial">Run the tutorial again</li>
                </ul>
            </li>
        </ul>
    </div>`));
    document.body.appendChild(htmlwrap(`
    <div class="rectspace" style="width:100%; background: url('assets/nightsky.jpg'); background-size: cover; flex:1 0 auto;position:relative">

    </div>`));
    document.body.appendChild(htmlwrap(`
    <div class="wall"
        style="position:absolute; width:100%; height:100%; top:0; left: 0; background: rgba(0,0,0,0.5); display: block">
        <div style="height:100%; display:flex; justify-content: center; flex-direction: column">
            <h1 style="color:white; text-align:center">Hold on, we're loading your data...</h1>
        </div>
    </div>`));
    core.fire("titleButtonsReady");
})

core.on("UIstart", () => {

    document.querySelector(".topbar .open").addEventListener("click", () => {
        if (core.isNewDoc)core.filescreen.showSplash();
        else{
            window.open(window.location.pathname+"?o","_blank");
        }
    })
    document.querySelector(".topbar .tutorial").addEventListener("click", () => {
        core.resetTutorial();
    })
    //register some handlers
    window.addEventListener("resize", () => {
        core.baseRect.refresh();
    })
    document.body.addEventListener("keydown", e => {
        if (e.ctrlKey && e.key == "s") {
            e.preventDefault();
            core.userSave();
            core.unsaved = false;
            //also do the server save
            
            // success for green notification box, alert for red box. If second parameter is left out, the box is black
            core.showNotification('Saved', 'success');
        }
    });

    ///////////////////////////////////////////////////////////////////////////////////////
    //Top bar
    let tbman = new _topbarManager();
    tbman._init();
    //select the topbar
    document.addEventListener("DOMContentLoaded", function () {
        let t = document.querySelector(".banner");
        tbman.checkTopbars(t);
    });
    tbman.checkTopbars();
});

core.showNotification = function (notificationMessage, notificationType = 'default') {
    
    if(!document.getElementById("popup-notification")) {
        const popupNotification = document.createElement("div");
        popupNotification.setAttribute("id", "popup-notification");
        document.body.appendChild(popupNotification);        
    }

    const popupNotificationBox = document.getElementById("popup-notification"); 
    popupNotificationBox.innerHTML = notificationMessage;
    popupNotificationBox.classList.add(notificationType);
    popupNotificationBox.classList.add('showAndFadeOut');
    const hideNotificationBox = setTimeout(()=>{
        popupNotificationBox.classList = '';
    },2800)
}
