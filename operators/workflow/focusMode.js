function _workflow_focusMode_extend() {
    this.container.on("metaFocus", (d) => {
        if (this.settings.focusExclusionMode && this.itemRelevant(d.id)) {
            this.settings.focusExclusionID = d.id;
            this.focusModeRefresh();
        }
    });
    let bannedSign = htmlwrap(`<p>Fire an attached metaFocus to use this operator in the focusExclusion mode.</p>`);
    this.focusModeRefresh = () => {
        if (this.settings.focusExclusionMode) {
            // Remove everything from the board
            while (this.innerRoot.children.length) {
                this.innerRoot.children[0].remove();
            }
            // Render this particular item as root, and all of its children
            // Special provision to prevent enter on root-1 item (the focused one so canot create root items)
            if (this.settings.focusExclusionID) {
                bannedSign.remove();
                for (let i in polymorph_core.items) {
                    this.renderItem(i, "pd"); // dont reorganise parent here
                }
            } else {
                this.innerRoot.appendChild(bannedSign);
            }
        }
    }
}