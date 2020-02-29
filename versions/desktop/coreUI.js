polymorph_core.on("UIsetup", () => {
    document.body.appendChild(htmlwrap(/*html*/`
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

    @keyframes precessBackground {
        0% {background-position-x: 0%}
        100% {background-position-x: 100%}
    }
    </style>`));
    document.body.appendChild(htmlwrap(/*html*/`
    <div style="display:flex; flex-direction:column; height:100%">
        <div class="banner">
            <div class="installPrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Install our desktop app! It's free!</button></div>
            <div class="gdrivePrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Try our Google Drive app for quick access to your files!</button></div>
            <!--<button class="sharer" style="background:blueviolet; border-radius:3px; border:none; padding:3px; color:white; position:absolute; top: 10px; right: 10px;">Share</button>-->
        </div>
        <div class="rectspace" style="width:100%; background: url('assets/purplestars.jpeg'); flex:1 0 auto;position:relative">
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
    polymorph_core.topbar.add("File/Open").addEventListener("click", () => {
        window.open(window.location.pathname + "?o", "_blank");
    })
    polymorph_core.topbar.add("Tutorial").addEventListener("click", () => {
        polymorph_core.resetTutorial();
    })
    window.addEventListener("resize", () => {
        polymorph_core.baseRect.refresh();
    })
});

polymorph_core.showNotification = function (notificationMessage, notificationType = 'default') {

    if (!document.getElementById("popup-notification")) {
        const popupNotification = document.createElement("div");
        popupNotification.setAttribute("id", "popup-notification");
        document.body.appendChild(popupNotification);
    }

    const popupNotificationBox = document.getElementById("popup-notification");
    popupNotificationBox.innerHTML = notificationMessage;
    popupNotificationBox.classList.add(notificationType);
    popupNotificationBox.classList.add('showAndFadeOut');
    const hideNotificationBox = setTimeout(() => {
        popupNotificationBox.classList = '';
    }, 2800)
}
