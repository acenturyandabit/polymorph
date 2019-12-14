polymorph_core.operatorTemplate = function (container, defaultSettings) {
    this.container = container;
    Object.defineProperty(this, "settings", {
        get: () => {
            return container.settings.data;
        }
    });
    //facilitate creation of this.settings if it doesnt exist.
    Object.assign(defaultSettings, this.settings);
    this.settings = {};
    Object.assign(this.settings, defaultSettings);
}