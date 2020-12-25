polymorph_core.registerSaveSource("lobby", function(save_source_data) {
    // redirect to server
    return new polymorph_core.saveSources["srv"](save_source_data);
}, {
    prettyName: "Save to local lobby",
})