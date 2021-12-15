// core.static allows the polymorph to boot up loading a static file if configured to do so.
_polymorph_core.prototype.isStaticMode = () => {
    return !(window.polymorph_file_list);
}

_polymorph_core.prototype.handleStaticData = () => {
    // check for static item
    if (window.polymorph_static_data) {
        let data = window.polymorph_static_data;
        // prevent alert errors downstream in integrateData
        polymorph_core.currentDocID = data._meta.id;
        polymorph_core.integrateData(data, "");
    }
}

if (polymorph_core.isStaticMode()) {
    // We aren't being piloted by a fileManager
    // patch some save functions that shouldn't run
    polymorph_core.addCreationOption = () => {}; // do nothing

    // start the polymorph_core ourselves, in static mode (any editable deployment of polymorph_core should have a filemanager);
    polymorph_core.start(true);

    //unshow the wall
    document.querySelector(".wall").style.display = "none";
    // light shade of purple for the body since purplestars are gone
    document.querySelector(".rectspace").style.background = "purple";

    // Remove the top bar
    document.querySelector(".banner").remove();
}