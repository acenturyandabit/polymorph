var __manager_profiles = {
    base: {
        files: [
            ["filescreen", "genui/filescreen.js"],
            ["templates", "templates.js"],
            ["core", "core.js"],
            ["core_tutorial", "core_modules/core.tutorial.js"],
            ["polymorph_filescreen", "versions/filescreen.js"],
            ["core_docLoading", "core_modules/core.docLoading.js"],
            ["core_dataUtils", "core_modules/core.dataUtils.js"],
            ["core_view", "core.view.js"],
            ["container", "container.js"],
        ]
    },
    operators: {
        files: [
            ["opSelect", "operators/opSelect.js"],
            ["itemList", "operators/itemList.js"],
            ["descbox", "operators/descbox.js"],
            ["calendar", "operators/calendar.js"],
            ["stack", "operators/stack.js"],
            ["terminal", "operators/terminal.js"],
            ["inspector", "operators/inspector.js"],
            ["sorter", "operators/sorter.js"],
            ["httree", "operators/httree.js"],
            ["chat", "operators/chat.js"],
            ["itemcluster", "operators/itemcluster.js"],
            ["turmach", "operators/turmach.js"],
            ["roundshow", "operators/know/roundshow.js"],
            ["tester", "operators/know/tester.js"],
            ["ruigen", "operators/ruigen/rui_operator.js"],
            ["calendar2", "operators/calendar.2.js"],
            ["scriptrunner", "operators/scriptrunner.js"]
        ]
    },
    saveSources: {
        files: [
            ["outputToText", "saveSources/outputToText.js"],
            ["localforage2", "saveSources/localforage2.js"],
            ["firebase", "saveSources/firebase.js"],
            ["server", "saveSources/server.js"],
            ["gdrive", "saveSources/gdrive.js"],
            ["websocket", "saveSources/websocket.js"],
        ]
    },
    phone: {
        condition: () => { return isPhone() },
        files: [
            ["core_dialog", "versions/phone/core.dialog.js"],
            { r: "base" },
            ["coreUI", "versions/phone/coreUI.js"],
            ["rect", "versions/phone/rect.js"],
            ["subframe", "operators/phone/subframe.js"],
            { r: "operators" },
            { r: "saveSources" },
        ]
    },
    default: {
        files: [
            ["core_dialog", "core_modules/core.dialog.js"],
            { r: "base" },
            ["rect", "rect.js"],
            ["core_palette", "core_modules/core.palette.js"],
            ["coreUI", "versions/desktop/coreUI.js"],
            { r: "operators" },
            ["subframe", "operators/subframe.js"],
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
                core.start();
            });
        loaded = true;
    } else {
        for (i in __manager_profiles) {
            if (__manager_profiles[i].condition && __manager_profiles[i].condition()) {
                //load all files from phone
                scriptassert(expand(__manager_profiles[i].files), () => {
                    document.getElementById("preloadRemove").remove();
                    core.start();
                });
                loaded = true;
            }
        }
    }

    if (!loaded) {
        scriptassert(expand(__manager_profiles['default'].files), () => {
            document.getElementById("preloadRemove").remove();
            core.start();
        });
    }
})()