let workflow_recursive_paste = function () {
    const mappings = ["parentProperty","orderProperty","titleProperty","filter"];

    this.check_workflow_recursive_paste = (text, rootID) => {
        if (text.startsWith("__WORKFLOWY_IMPORT__")) {
            try {
                const jsonData = JSON.parse(text.slice("__WORKFLOWY_IMPORT__".length));
                // This will be a dict of items
                // Create the new items with new IDs
                let oldID_newID_map = {};
                for (let oldID in jsonData.items) {
                    let newID = this.createItem();
                    oldID_newID_map[oldID] = newID;
                    // Remap the properties
                    mappings.forEach(property=>{
                        polymorph_core.items[newID][this.settings[property]] = jsonData.items[oldID][property];
                    })

                    
                }
                for (let oldID in jsonData.items){
                    // Extra remapping for fromProperty
                    currentNewID=oldID_newID_map[oldID];
                    if (currentNewID == oldID_newID_map[jsonData.rootID]){
                        // Assign root level parent to current span ID
                        polymorph_core.items[currentNewID][this.settings.parentProperty] = rootID;
                    }else{
                        polymorph_core.items[currentNewID][this.settings.parentProperty]=oldID_newID_map[polymorph_core.items[currentNewID][this.settings.parentProperty]];
                    }
                    polymorph_core.fire("updateItem",{id: currentNewID, sender: this});
                    this.renderItem(currentNewID)
                }
                return true;
            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
    }

    this.copylistExternal=(e) => {
        let mappingsArray = ["parentProperty","orderProperty","titleProperty","filter"];
        const sublistAsJSON = {
            rootID: this.contextTarget.dataset.id,
            items: {}
        }


        let runStack = [this.contextTarget];
        while (runStack.length) {
            let top = runStack.pop();
            let filteredItem = {};
            mappingsArray.forEach(setting=>{
                filteredItem[setting]=polymorph_core.items[top.dataset.id][this.settings[setting]];
            })
            sublistAsJSON.items[top.dataset.id]=filteredItem;
            let childItemDiv = top.children[top.children.length - 1]; // not just 1, becuase of the rich edit mode. but always last
            for (let i = childItemDiv.children.length - 1; i >= 0; i--) {
                runStack.push(childItemDiv.children[i]);
            }
        }

        this.copyToClipboard("__WORKFLOWY_IMPORT__" + JSON.stringify(sublistAsJSON));
        return true;
    }
}