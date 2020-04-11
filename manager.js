var __manager_profiles = {
    base: {
        files: [
            ["filescreen", "genui/filescreen.js"],
            ["polymorph_core", "core.js"],
            ["polymorph_core_dialog", "core_modules/ui/core.dialog.js"],
            ["polymorph_core_dialog", "core_modules/ui/core.topbar.js"], // this is desktop only
            ["polymorph_core_tutorial", "core_modules/ui/core.tutorial.js"],
            ["polymorph_filescreen", "versions/filescreen.js"],
            ["polymorph_core_docLoading", "core_modules/core/core.docLoading.js"],
            ["polymorph_core_loadSaveUI", "core_modules/ui/core.loadSaveUI.js"],
            ["polymorph_core_dataUtils", "core_modules/core/core.dataUtils.js"],
            ["polymorph_core_view", "core_modules/ui/core.view.js"],
            ["polymorph_core_container", "core_modules/core/core.container.js"],
            ["polymorph_core_itemfx", "core_modules/core/core.itemfx.js"],
            ["polymorph_core_operator", "core_modules/core/core.operator.js"],
            ["polymorph_core_contextMenu", "core_modules/ui/core.contextMenu.js"],
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
            //["turmach", "operators/turmach.js"],
            //["roundshow", "operators/roundshow.js"],
            //["tester", "operators/tester.js"],
            //["ruigen", "operators/ruigen/rui_operator.js"],
            //["calendar2", "operators/calendar.2.js"],
            ["scriptrunner", "operators/scriptrunner.js"],
            ["timerOperator", "operators/timer.js"],
            ["textflow", "operators/textflow/textflow.js"]
        ]
    },
    saveSources: {
        files: [
            ["outputToText", "saveSources/outputToText.js"],
            ["localforage2", "saveSources/localforage2.js"],
            ["permalink", "saveSources/permalink.js"],
            ["firebase_savesource", "saveSources/firebase.js"],
            ["server", "saveSources/server.js"],
            ["gdrive", "saveSources/gdrive.js"],
            ["websocket", "saveSources/websocket.js"],
        ]
    },
    phone: {
        condition: () => { return isPhone() },
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
            //["influence_background", "core_modules/addons/influence_background.js"], //rip
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