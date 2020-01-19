polymorph_core.initiateDragDrop = function (itemID, _settings) {
    if (polymorph_core._dragdropdata.tempItemDiv) return;
    let settings = {
        x: polymorph_core._dragdropdata.mouseX,
        y: polymorph_core._dragdropdata.mouseY,
        property: "title",
        displayText: undefined, //define to overwrite the property
        sender: undefined
    };
    Object.assign(settings, _settings);
    let tempItemDiv = htmlwrap(`<div style="position:absolute; top:${settings.y}px; left: ${settings.x}px;"></div>`);
    tempItemDiv.innerText = polymorph_core.items[itemID][settings.property];
    document.body.appendChild(tempItemDiv);
    polymorph_core._dragdropdata.tempItemDiv = tempItemDiv;
    settings.itemID = itemID;
    polymorph_core._dragdropdata.settings = settings;
    //when mouseup, fire a createItem on the new operator. If not ctrl, fire a deleteItem on the old operator.
}

polymorph_core._dragdropdata = {};

document.addEventListener("mousemove", (e) => {
    polymorph_core._dragdropdata.mouseX = e.clientX;
    polymorph_core._dragdropdata.mouseY = e.clientY;
    if (polymorph_core._dragdropdata.tempItemDiv) {
        polymorph_core._dragdropdata.tempItemDiv.style.top = e.clientY;
        polymorph_core._dragdropdata.tempItemDiv.style.left = e.clientX;
    }
})

document.addEventListener("mouseup", (e) => {
    if (polymorph_core._dragdropdata.tempItemDiv) {
        polymorph_core._dragdropdata.tempItemDiv.remove();
        let elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
        while (elementUnderMouse.shadowRoot) {
            elementUnderMouse = elementUnderMouse.shadowRoot.elementFromPoint(e.clientX, e.clientY);
        }
        console.log(elementUnderMouse);
        //Figure out which container this belongs to...
        //todo: make this work for non shadow roots.
        let rootNode = elementUnderMouse.getRootNode();
        let container_id = rootNode.host.parentElement.parentElement.dataset.containerid; //actually the rect's container for it. This will need to change if we remove rects.
        console.log(container_id);
        let settings = polymorph_core._dragdropdata.settings;
        if (container_id != settings.sender) {
            polymorph_core.containers[container_id]._fire("createItem", { id: settings.itemID, sender: "dragdrop" });
            let targetContainerOptions = polymorph_core.operators[polymorph_core.containers[container_id].settings.t].options
            if (!targetContainerOptions.single_store) polymorph_core.containers[settings.sender]._fire("deleteItem", { id: settings.itemID, sender: "dragdrop" });
            delete polymorph_core._dragdropdata.tempItemDiv;
        }
    }
})

//edge case: drop onto not a container