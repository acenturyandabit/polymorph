(() => {

    let fileList = [
        "src/3pt/localforage.min.js",
        "src/3pt/chart.js",
        "src/utils.js",
        "src/core.js",
        "src/core_modules/ui/core.tutorial.js",
        "src/core_modules/core/core.dedup.js",
        "src/core_modules/core/core.docLoading.js",
        "src/core_modules/ui/core.dialog.js",
        "src/core_modules/ui/core.tutorial.js",
        "src/core_modules/ui/core.loadSaveUI.js",
        "src/core_modules/ui/core.customCSS.js",
        "src/core_modules/core/core.dataUtils.js",
        "src/core_modules/core/core.container.js",
        "src/core_modules/ui/core.contextMenu.js",
        "src/core_modules/core/core.itemfx.js",
        "src/core_modules/core/core.operator.js",
        "src/core_modules/ui/core.dragdrop.js",
        "src/core_modules/core/core.phone.rect.js",
        "src/core_modules/core/core.rect.js",
        "src/core_modules/ui/core.phone.main.js",
        "src/core_modules/ui/core.main.js",
        "src/core_modules/ui/ccleaner.js",
        "src/core_modules/ui/richText.js",
        "src/core_modules/core/core.clip.js",
        "src/operators/opSelect.js",
        "src/genui/dateparser.js",
        "src/operators/itemList.searchsort.js",
        "src/operators/itemList.js",
        "src/operators/itemList.phone.js",
        "src/operators/descbox.js",
        "src/genui/intervalParser.js",
        "src/operators/terminal.js",
        "src/operators/workflow/workflow_shim.js",
        "src/operators/workflow/focusMode.js",
        "src/operators/workflow/search.js",
        "src/operators/workflow/workflow_gitfriendly_contextmenu.js",
        "src/operators/workflow/workflow_gitfriendly.js",
        "src/operators/workflow/advancedentry.js",
        //"src/operators/textflow.js",
        "src/operators/inspector.js",
        "src/operators/json_inspector.js",
        "src/operators/inspectolist.js",
        "src/operators/subframe.js",
        "src/operators/deltaLogger.js",
        "src/3pt/jquery.min.js",
        "src/3pt/moment.min.js",
        "src/3pt/fullcalendar.min.js",
        "src/genui/quickNotify.js",
        "src/operators/calendar.js",
        "src/3pt/svg.min.js",
        "src/3pt/svg.foreignobject.js",
        "src/operators/itemcluster/itemcluster.svg.js",
        "src/operators/itemcluster/contextmenu/entropic_hierarchy.js",
        "src/operators/itemcluster/contextmenu/condensed_hierarchy.js",
        "src/operators/itemcluster/contextmenu/condensed_radial_hierarchy.js",
        "src/operators/itemcluster/contextmenu/entropy.js",
        "src/operators/itemcluster/itemcluster.contextmenu.js",
        "src/operators/itemcluster/itemcluster.scalegrid.js",
        "src/operators/itemcluster/itemcluster.rapidentry.js",
        "src/operators/itemcluster/itemcluster.js",
        "src/operators/welcome.js",
        "src/operators/litem.js",
        "src/operators/scriptrunner.js",
        "src/operators/timer.js",
        "src/saveSources/outputToText.js",
        "src/saveSources/localforage2.js",
        "src/saveSources/permalink.js",
        "src/saveSources/lobby.js",
        "src/saveSources/server.js",
        "src/saveSources/gitlite.js",
        "src/saveSources/gitlite2.js",
        "src/saveSources/broadcastsync.js",
        "src/core_modules/core/core.static.js",
    ];

    let staticFileList = fileList.map(i => i);
    let filesToRemoveInStatic = [
        "src/core_modules/ui/core.loadSaveUI.js",
        "src/saveSources/outputToText.js",
        "src/saveSources/localforage2.js",
        "src/saveSources/permalink.js",
        "src/saveSources/lobby.js",
        "src/saveSources/server.js",
        "src/saveSources/gitlite.js",
        "src/saveSources/gitlite2.js",
        "src/saveSources/broadcastsync.js"
    ];
    filesToRemoveInStatic.forEach(i => {
        staticFileList.splice(staticFileList.indexOf(i), 1);
    });
    //staticFileList = [...staticFileList, ""];

    try {
        //we are working in the browser context
        window.polymorph_file_list = fileList;
        if (localStorage.getItem("__polymorph_debug_flag") == "true" || // Add a few more conditions to make editing accessible for newcomers
            window.location.href.includes("localhost") ||
            window.location.href.includes("file://")
        ) {
            let f = 0;
            let loadNextFile = () => {
                let s = document.createElement("script");
                s.src = fileList[f];
                f++;
                if (f < fileList.length) {
                    s.onload = loadNextFile;
                } else {
                    s.onload = () => polymorph_core.start();
                }
                document.body.appendChild(s);
            }
            loadNextFile();
        } else {
            let s = document.createElement("script");
            s.src = "build/cat.js";
            document.body.appendChild(s);
            // This _needs_ to have a blank argument because if you just set the onload to be start, you will get that the 
            // first argument which is the event handler is truthy, and polymorph will run in static mode.
            s.onload = () => polymorph_core.start();

        }
    } catch (e) {
        console.log(e); // in case it's actually a browser error.
        let fs = require("fs");
        //this is a compilation script
        fs.writeFileSync("build/cat.js", fs.readFileSync(fileList[0]));
        for (let i = 1; i < fileList.length; i++) {
            fs.appendFileSync("build/cat.js", ";\n\n"); // #safe
            fs.appendFileSync("build/cat.js", fs.readFileSync(fileList[i]));
            console.log("adding file " + fileList[i] + "...");
        }

        //Also build static polymorph
        fs.writeFileSync("build/polymorph_static.js", fs.readFileSync(staticFileList[0]));
        for (let i = 1; i < staticFileList.length; i++) {
            fs.appendFileSync("build/polymorph_static.js", ";\n\n"); // #safe
            fs.appendFileSync("build/polymorph_static.js", fs.readFileSync(staticFileList[i]));
            console.log("adding file " + staticFileList[i] + "...");
        }
    }
})();