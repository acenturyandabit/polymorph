function workflowy_advanced_entry() {
    let plaintextContenteditableRender = htmlwrap(`
<span class="plaintextCER">
    <span class="utils">
    <span class="arrow">*</span>
    </span>
    <span contenteditable>&nbsp;</span>
    <style>
        .plaintextCER{
            display: flex;
        }
        .plaintextCER>:nth-child(2){
            width: calc(100% - 30px);
        }
    </style>
</span>
    `);
    this.plaintextContenteditableRender=plaintextContenteditableRender;
    let plaintextOperatingOnID;
    this.setShowPlaintext = (focusOnElement, event) => {
        if (this.settings.advancedInputMode && this.settings.isEditable) {
            if (focusOnElement == plaintextContenteditableRender.children[1]) {
                // this happens when you type \ to summon a \{}
                // don't update
                return;
            } else {
                let resolvedObject = this.resolveSpan(focusOnElement);
                plaintextOperatingOnID = resolvedObject.id;
                resolvedObject.el.insertBefore(plaintextContenteditableRender, resolvedObject.el.children[1]);
                plaintextContenteditableRender.children[1].innerText = polymorph_core.items[plaintextOperatingOnID][this.settings.titleProperty];
                // send a click event to a few px below, which will cause us to focus in the right place
                // let shiftedEvent = new PointerEvent(event.type);
                // for (let i in event) {
                //     try {
                //         shiftedEvent[i] = event[i]
                //     } catch (e) {}
                // }
                // shiftedEvent.clientY += 10;
                // shiftedEvent.screenY += 10;
                // shiftedEvent.pageY += 10;
                // this.rootdiv.dispatchEvent(shiftedEvent);
                plaintextContenteditableRender.children[1].focus();
            }
        } else {
            plaintextContenteditableRender.remove();
        }
    }
    plaintextContenteditableRender.addEventListener("input", (e) => {
        this.parse(e.target, plaintextOperatingOnID);
        polymorph_core.items[plaintextOperatingOnID][this.settings.titleProperty] = e.target.innerText; // polymorph_core.RTParseElement(e.target, id, this.settings.titleProperty);
        this.container.fire("updateItem", { id: plaintextOperatingOnID, sender: this });
        this.renderItem(plaintextOperatingOnID, "d");
    });
}