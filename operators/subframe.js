polymorph_core.registerOperator("subframe", {}, function (container) {
    polymorph_core.operatorTemplate.call(this, container, {});
    this.outerDiv = document.createElement("div");
    //Add div HTML here
    this.outerDiv.innerHTML = ``;
    this.outerDiv.style.cssText = `width:100%; height: 100%; position:relative`;
    container.div.appendChild(this.outerDiv);

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
        this.outerDiv.appendChild(polymorph_core.rects[rectID].outerDiv);
        polymorph_core.rects[rectID].refresh();
    }

    //Check if i have any rects waiting for pickup
    if (polymorph_core.rectLoadCallbacks[container.id]) {
        this.tieRect(polymorph_core.rectLoadCallbacks[container.id][0]);
    } else {
        let rectID = polymorph_core.newRect(container.id);
        this.tieRect(rectID);
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

});