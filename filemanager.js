let fileList = [
    "3pt/localforage.min.js",
    "utils.js",
    "core.js",
    "core_modules/ui/core.tutorial.js",
    "core_modules/core/core.docLoading.js",
    "core_modules/ui/core.dialog.js",
    "core_modules/ui/core.tutorial.js",
    "core_modules/ui/core.loadSaveUI.js",
    "core_modules/ui/core.customCSS.js",
    "core_modules/core/core.dataUtils.js",
    "core_modules/core/core.container.js",
    "core_modules/ui/core.contextMenu.js",
    "core_modules/core/core.itemfx.js",
    "core_modules/core/core.operator.js",
    "core_modules/ui/core.dragdrop.js",
    "core_modules/core/core.phone.rect.js",
    "core_modules/core/core.rect.js",
    "core_modules/ui/core.phone.main.js",
    "core_modules/ui/core.main.js",
    "core_modules/ui/ccleaner.js",
    "core_modules/ui/richText.js",
    "core_modules/core/core.clip.js",
    "operators/opSelect.js",
    "genui/dateparser.js",
    "operators/itemList.searchsort.js",
    "operators/itemList.js",
    "operators/itemList.phone.js",
    "operators/descbox.js",
    "genui/intervalParser.js",
    "operators/terminal.js",
    "operators/workflow.js",
    "operators/workflow/focusMode.js",
    "operators/workflow_gitfriendly_contextmenu.js",
    "operators/workflow_gitfriendly.js",
    //"operators/textflow.js",
    "operators/inspector.js",
    "operators/json_inspector.js",
    "operators/inspectolist.js",
    "operators/subframe.js",
    "operators/deltaLogger.js",
    "3pt/jquery.min.js",
    "3pt/moment.min.js",
    "3pt/fullcalendar.min.js",
    "genui/quickNotify.js",
    "operators/calendar.js",
    "3pt/svg.min.js",
    "3pt/svg.foreignobject.js",
    "operators/itemcluster.svg.js",
    "operators/itemcluster.contextmenu.js",
    "operators/itemcluster.scalegrid.js",
    "operators/itemcluster.rapidentry.js",
    "operators/itemcluster.js",
    "operators/welcome.js",
    "operators/litem.js",
    "operators/scriptrunner.js",
    "operators/timer.js",
    "saveSources/outputToText.js",
    "saveSources/localforage2.js",
    "saveSources/permalink.js",
    "saveSources/lobby.js",
    "saveSources/server.js",
    "saveSources/gitlite.js",
    "saveSources/gitlite2.js",
    "saveSources/broadcastsync.js",
];

try {
    //we are working in the browser context
    if (localStorage.getItem("__polymorph_debug_flag") == "true") {
        let f = 0;
        let loadNextFile = () => {
            let s = document.createElement("script");
            s.src = fileList[f];
            f++;
            if (f < fileList.length) {
                s.onload = loadNextFile;
            } else {
                s.onload = polymorph_core.start;
            }
            document.body.appendChild(s);
        }
        loadNextFile();
    } else {
        let s = document.createElement("script");
        s.src = "cat.js";
        document.body.appendChild(s);
        let start = () => {
            try {
                polymorph_core.start();
            } catch (e) {
                setTimeout(start);
            }
        }
        setTimeout(start);
    }
} catch (e) {
    console.log(e); // in case it's actually a browser error.
    let fs = require("fs");
    //this is a compilation script
    fs.writeFileSync("cat.js", fs.readFileSync(fileList[0]));
    for (let i = 1; i < fileList.length; i++) {
        fs.appendFileSync("cat.js", ";\n\n"); // #safe
        fs.appendFileSync("cat.js", fs.readFileSync(fileList[i]));
        console.log("adding file " + fileList[i] + "...");
    }
}