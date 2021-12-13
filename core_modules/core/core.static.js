// core.static allows the polymorph to boot up loading a static file if configured to do so.

_polymorph_core.prototype.handleStaticData = () => {
    // check for static item
    if (window.polymorph_static_data) {
        let data = window.polymorph_static_data;
        // prevent alert errors downstream in integrateData
        polymorph_core.currentDocID = data._meta.id;
        polymorph_core.integrateData(data, "");
    }
}

if (!window.polymorph_file_list) {
    // We aren't being piloted by a fileManager
    // start the polymorph_core ourselves, in static mode (any editable deployment of polymorph_core should have a filemanager);
    polymorph_core.start();
}