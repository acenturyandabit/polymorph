{// Simple Block for closure

    // Hack polymorph_core to replace some of the registration functions so we immediately load the operator and savesource
    polymorph_core.start = function (userSave) {
        this.resetDocument();
        let debugUserSave = localStorage.getItem("__unitcore_debug_from");
        if (debugUserSave) {
            userSave = JSON.parse(debugUserSave);
        }
    }


    // Load the savesource and operator if not in debug mode
    let debugOperator = localStorage.getItem("__unitcore_debug_operator");
    if (debugOperator) {
        appendScript(debugOperator);
    } else {
        appendScript("operator.js");
    }
    let debugSavesource = localStorage.getItem("__unitcore_debug_savesource");
    if (debugSavesource) {
        appendScript(debugSavesource);
    } else {
        appendScript("savesource.js");
    }
}