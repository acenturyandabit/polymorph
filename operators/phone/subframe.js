polymorph_core.registerOperator("subframe", { targetForward: true, hidden: true }, function (container) {
    polymorph_core.operatorTemplate.call(this, container, {});
    this.rdv = document.createElement("div");
    this.rdv.style.marginLeft = "10px";
    this.container.rect.listContainer.querySelector(`[data-containerid="${this.container.id}"]`).appendChild(this.rdv);
    //////////////////Handle polymorph_core item updates//////////////////

    this.refresh = function () {
        polymorph_core.rects[this.rectID].refresh();
    }

    //////////////////Handling local changes to push to polymorph_core//////////////////
    Object.defineProperty(this, "rect", {
        get: () => {
            return polymorph_core.rects[this.rectID];
        }
    })

    this.tieRect = function (rectID) {
        this.rectID = rectID;
        this.rdv.appendChild(polymorph_core.rects[rectID].listContainer);
        polymorph_core.rects[rectID].refresh();
    }

    //Check if i have any rects waiting for pickup
    if (polymorph_core.rectLoadCallbacks[container.id]) {
        this.tieRect(polymorph_core.rectLoadCallbacks[container.id][0]);
        delete polymorph_core.rectLoadCallbacks[container.id];
    } else if (!this.settings.operatorClonedFrom) {
        let rectID = polymorph_core.newRect(container.id);
        this.tieRect(rectID);
    }
    //////////////////Handle polymorph_core item updates//////////////////

    this.refresh = function () {
        this.rect.refresh();
    }
    //For interoperability between views you may fire() and on() your own events. You may only pass one object to the fire() function; use the properties of that object for additional detail.
    this.processSettings = function () {
    }

    //////////////////Handling local changes to push to polymorph_core//////////////////

    //Saving and loading
    this.toSaveData = function () {
        this.settings.rectUnderData = this.rect.toSaveData();
        return this.settings;
    }

    this.fromSaveData = function (d) {
        Object.assign(this.settings, d);
        this.rect.fromSaveData(this.settings.rectUnderData);
        this.rect.refresh();
        this.processSettings();
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `Nothing to show yet :3`;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

    this.getOperator = function (id) {
        return this.rect.getOperator(id);
    }
    this.getOperatorPath = function (id) {
        return this.rect.getOperatorPath(id);
    }
    this.listOperators = function (list) {
        this.rect.listOperators(list);
    }
});