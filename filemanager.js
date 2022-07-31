(() => {

    let fileList = [
        "src/3pt/localforage.min.js",
        "src/3pt/chart.js",
        "src/3pt/showdown.js",
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
        "src/operators/scriptrunner.js",
        "src/operators/timer.js",
        "src/saveSources/outputToText.js",
        "src/saveSources/localforage2.js",
        "src/saveSources/permalink.js",
        "src/saveSources/lobby.js",
        "src/saveSources/server.js",
        "src/saveSources/hilagit.js",
        "src/saveSources/monogit.js",
        "src/saveSources/broadcastsync.js",
        "src/core_modules/core/core.static.js",
    ];


    // Polymorph static
    let staticFileList = fileList.map(i => i);
    let filesToRemoveInStatic = [
        "src/core_modules/ui/core.loadSaveUI.js",
        "src/saveSources/outputToText.js",
        "src/saveSources/localforage2.js",
        "src/saveSources/permalink.js",
        "src/saveSources/lobby.js",
        "src/saveSources/server.js",
        "src/saveSources/hilagit.js",
        "src/saveSources/monogit.js",
        "src/saveSources/broadcastsync.js"
    ];
    filesToRemoveInStatic.forEach(i => {
        staticFileList.splice(staticFileList.indexOf(i), 1);
    });
    //staticFileList = [...staticFileList, ""];

    // Polymorph unit_core
    let unitCoreFileList = fileList.map(i => i);
    let filesToRemoveInUnitCore = [
        "src/core_modules/ui/core.loadSaveUI.js",
        "src/saveSources/outputToText.js",
        "src/saveSources/localforage2.js",
        "src/saveSources/permalink.js",
        "src/saveSources/lobby.js",
        "src/saveSources/server.js",
        "src/saveSources/hilagit.js",
        "src/saveSources/monogit.js",
        "src/saveSources/broadcastsync.js"
    ];
    filesToRemoveInUnitCore.forEach(i => {
        unitCoreFileList.splice(unitCoreFileList.indexOf(i), 1);
    });
    filesToRemoveInUnitCore=filesToRemoveInUnitCore.filter(i=>!(i.startsWith("src/operators")));
    unitCoreFileList.splice(unitCoreFileList.indexOf("src/core.js")+1, 0, "src/unit_core.js");

    try {
        //we are working in the browser context

        // Indicate to static that it is not in static mode
        // Also causes failure in node.js since window doesn't exist, which will lead to catch
        window.polymorph_file_list = fileList;

        // For unit_core mode
        let debug_mode = false;
        // Use the unit_core file list instead
        if (localStorage.getItem("__unitcore_debug_from")) {
            fileList = unitCoreFileList;
            // also add a ../ in front of the src to escape from the versions folder
            fileList = fileList.map(i => "../" + i);
            debug_mode = true;
        }

        // General modes
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
            debug_mode = true;
        }

        if (!debug_mode){
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

        //Also build unit core
        fs.writeFileSync("build/unit_core.js", fs.readFileSync(unitCoreFileList[0]));
        for (let i = 1; i < unitCoreFileList.length; i++) {
            fs.appendFileSync("build/unit_core.js", ";\n\n"); // #safe
            fs.appendFileSync("build/unit_core.js", fs.readFileSync(unitCoreFileList[i]));
            console.log("adding file " + unitCoreFileList[i] + "...");
        }
    }
})();