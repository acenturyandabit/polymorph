documentReady(() => {
    document.body.appendChild(htmlwrap(`
    <div class="banner">
        <h1 class="docName" contentEditable>Pad name</h1>
        <div class="installPrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Install our desktop app! It's free!</button></div>
        <div class="gdrivePrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Try our Google Drive app for quick access to your files!</button></div>
        <!--<button class="sharer" style="background:blueviolet; border-radius:3px; border:none; padding:3px; color:white; position:absolute; top: 10px; right: 10px;">Share</button>-->
        <ul class="topbar">
            <li>File
                <ul>
                    <li class="saveSources">Load/Save...</li> <!-- default is always localforage for now -->
                    <li class="new">New</li>
                </ul>
            </li>
            <li class="viewdialog">Views</li>
            <li class="hlep">Help</li>
        </ul>
    </div>`));
    document.body.appendChild(htmlwrap(`
    <div class="rectspace" style="width:100%; flex:1 0 auto;position:relative">
    
    </div>`));
    document.body.appendChild(htmlwrap(`
    <div class="wall"
        style="position:absolute; width:100%; height:100%; top:0; left: 0; background: rgba(0,0,0,0.5); display: block">
        <div style="height:100%; display:flex; justify-content: center; flex-direction: column">
            <h1 style="color:white; text-align:center">Hold on, we're loading your data...</h1>
        </div>
    </div>`));
})

core.startUI = function () {
    document.querySelector(".topbar .new").addEventListener("click", () => {
        window.open(window.location.pathname);
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

}