//line as item operator
// it has a focused state and a defocus state. focusability?
// gotta deal with the cursor too great
// um use a bunch of spans. constant width font, get up and down arrows working (hmm, sounds familiar)


polymorph_core.registerOperator("lynerlist", {
    displayName: "Lynerlist",
    description: "An advanced item listing tool."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        filter: polymorph_core.guid(),
        rowsOrder: ["----"]
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
    this.itemRelevant=(id)=>this.settings.rowsOrder.indexOf(id)!=-1;
    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `<style>
    span{
        font-family:monospace;
        color:white;
    }
    [data-id]{
        width:100%;
        display:inline-flex;
    }
    [contenteditable]{
        flex: 1 0 10%;
    }
    </style>
    <span data-id="----"><span>----</span>&nbsp;&nbsp;<span contenteditable></span></span> <!--this is always final line-->
    `;
    Object.defineProperty(this, 'currentFocusedLine', {
        get: () => {
            let r = this.rootdiv.getRootNode();
            if (!r.activeElement) return undefined;
            else {
                //construct an object
                let obj = {};
                obj.id = r.activeElement.parentElement.dataset.id;
                obj.contents = r.activeElement.innerText;
                obj.editableSpan = r.activeElement;
                obj.backTag = r.activeElement.parentElement.children[0];
                obj.root = r.activeElement.parentElement;
                return obj;
            }
        }
    }
    )

    this.updateRowsOrder = () => {
        this.settings.rowsOrder = [];
        Array.from(this.rootdiv.children).forEach(i => {
            if (i.dataset.id) this.settings.rowsOrder.push(i.dataset.id);
        })
        if (this.settings.rowsOrder.length == 0) this.settings.rowsOrder = ["----"];
    }

    let renderise = (id, prevItem) => {
        let copydiv = this.rootdiv.querySelector(`[data-id="----"]`).cloneNode(true);
        if (id != "----") {
            if (this.rootdiv.querySelector(`[data-id="${id}"]`)) {
                copydiv = this.rootdiv.querySelector(`[data-id="${id}"]`);
            }
            copydiv.children[0].innerText = " " + id.slice(id.length - 4);
            copydiv.dataset.id = id;
            copydiv.children[1].innerText = polymorph_core.items[id].contents;
        }
        this.rootdiv.insertBefore(copydiv, prevItem);
        if (id != "----" && polymorph_core.items[id].to) {
            for (let i in polymorph_core.items[id].to) {
                if (this.settings.rowsOrder.indexOf(i) != -1) {
                    copydiv=renderise(i, copydiv.nextElementSibling);
                }
            }
        }
        return copydiv;
    }

    //initial render
    let baseItem = this.rootdiv.querySelector(`[data-id="----"]`);
    this.settings.rowsOrder.forEach(i => {
        baseItem = renderise(i, baseItem.nextElementSibling);
        this.rootdiv.appendChild(baseItem);
    })
    //there will be an extra ---- so we can just remove it.
    this.rootdiv.children[1].remove();


    let processCommands = (c) => {
        c = c.split("\\")[1];
        c = c.split(" ");
        switch (c[0]) {
            case "sort":
                let sortables = [];
                for (let i of this.settings.rowsOrder) {
                    if (i == "----") continue;
                    if (polymorph_core.items[i].contents[0] != " " && polymorph_core.items[i][c[1]]) {
                        sortables.push({
                            id: i,
                            d: polymorph_core.items[i][c[1]]
                        });
                    }
                }
                if (c[2]=="date"){
                    sortables.forEach(i=>{
                        let d=i.d;
                        d=d.split("/").map(Number);
                        let r=0; //in days
                        while (d.length){
                            switch (d.length){
                                case 3:
                                    r+=d[d.length-1]*365;
                                    break;
                                case 2:
                                    r+=d[d.length-1]*31;//better than 30
                                    break;
                                case 1:
                                    r+=d[d.length-1];
                            }
                            d.pop();
                        }
                        i.d=r;
                    })   
                }
                if (c.includes("reverse")){
                    sortables.sort((a, b) => (a.d > b.d) ? 1 : -1);
                }else{
                    sortables.sort((a, b) => (a.d > b.d) ? -1 : 1);
                }
                let cd=this.rootdiv.children[2];
                for (let i of sortables) {
                    renderise(i.id, cd);
                    //arrange
                }
                break;
            case "depsort":
                let allItems = this.settings.rowsOrder.map(i=>i);
                let toSort = {};
                let nextToAnchor=undefined;
                allItems.forEach(i=>{
                    if (i=="----")return;
                    if (polymorph_core.items[i][c[2]]){
                        toSort[polymorph_core.items[i][c[2]]]={
                            id:i
                        }
                        if (polymorph_core.items[i][c[1]]){
                            toSort[polymorph_core.items[i][c[2]]].deps=polymorph_core.items[i][c[1]].split(",");
                        }else{
                            toSort[polymorph_core.items[i][c[2]]].deps=[];
                        }
                    }else{
                        nextToAnchor=renderise(i,nextToAnchor).nextElementSibling;
                    }
                })
                let tsk = Object.keys(toSort);
                let emplaced={};
                while (tsk.length){
                    console.log(tsk);
                    let top=tsk.shift();
                    if (toSort[top]){
                        //items will be deleted once they have been seen
                        if (emplaced[top]){
                            //there is a loop, abort
                            //render now
                            nextToAnchor=renderise(toSort[top].id,nextToAnchor).nextElementSibling;
                            console.log("got "+top);
                            delete toSort[top];
                        }else{
                            emplaced[top]=true;
                            toSort[top].deps=toSort[top].deps.filter(i=>!emplaced[i]);
                            toSort[top].deps.forEach(i=>tsk.push(i));
                            tsk.push(top);
                        }
                    }
                }
                Array.from(this.rootdiv.querySelectorAll("[data-id='----']")).forEach(i=>this.rootdiv.appendChild(i));
                //move all newlines to bottom
        }
    }

    this.parseLine = (id) => {
        if (id == "----") return;
        let itm = this.rootdiv.querySelector(`[data-id="${id}"]`);
        let itmt = itm.children[1].innerText;

        let precedingSpaceCount = 0;
        while (/\s/.exec(itmt[precedingSpaceCount])) precedingSpaceCount++;
        if (precedingSpaceCount > 0) {
            let prepointer = itm.previousElementSibling;
            while (prepointer.tagName == "SPAN") {
                let pre_precedingSpaceCount = 0;
                let itmpt = prepointer.children[1].innerText;
                while (/\s/.exec(itmpt[pre_precedingSpaceCount])) pre_precedingSpaceCount++;
                if (pre_precedingSpaceCount < precedingSpaceCount) {
                    //anchor the to
                    if (!polymorph_core.items[prepointer.dataset.id].to) polymorph_core.items[prepointer.dataset.id].to = {};
                    polymorph_core.items[prepointer.dataset.id].to[id] = true;
                    break;
                } else {
                    prepointer = prepointer.previousElementSibling;
                }
            }
        }
        polymorph_core.items[id].contents = itmt;
        let str = itmt;
        let parser = /\[(.+?):(.+?)\]/g;
        let res;
        while (res = parser.exec(str)) {
            polymorph_core.items[id][res[1]] = res[2];
        }
        container.fire('updateItem', { id: id, sender: this });
    }

    this.hardReparseAll = () => { //debugging function. not called by user, unless in devtools.
        for (let i of this.settings.rowsOrder) {
            this.parseLine(i);
        }
    }

    let candidateDie = false;

    this.rootdiv.addEventListener('keydown', (e) => {
        if (e.key == "Enter") {
            e.preventDefault();
            //create a new line
            let prevstr = this.currentFocusedLine.contents;
            let pretab = /^(\s+)/.exec(prevstr);
            if (!pretab) pretab = "";
            else pretab = pretab[0];
            pretab = Array.from(pretab).map(i => "&nbsp;").join("");
            let copydiv = this.rootdiv.querySelector(`[data-id="----"]`).cloneNode(true);
            copydiv.children[1].innerHTML = pretab;
            this.rootdiv.insertBefore(copydiv, this.currentFocusedLine.root.nextElementSibling);
            //go up a line
            var selection = this.rootdiv.getRootNode().getSelection();
            var range = document.createRange();
            if (this.currentFocusedLine.root.nextElementSibling.children[1].firstChild) range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1].firstChild, this.currentFocusedLine.root.nextElementSibling.children[1].firstChild.length);
            else range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1], 0);
            //range.setEnd(copydiv.children[1].firstChild, 0);
            selection.removeAllRanges();
            selection.addRange(range);
            e.preventDefault();
            //check the tab state of the previous line and match it.
            this.updateRowsOrder();
        } else if (e.key == "ArrowUp") {
            if (this.currentFocusedLine && this.currentFocusedLine.root.previousElementSibling && this.currentFocusedLine.root.previousElementSibling.tagName=="SPAN") {
                var selection = this.rootdiv.getRootNode().getSelection();
                let oldRange = selection.getRangeAt(0);
                var range = document.createRange();
                let newStartOffset = oldRange.startOffset;
                if (this.currentFocusedLine.root.previousElementSibling.children[1].firstChild) {
                    if (newStartOffset > this.currentFocusedLine.root.previousElementSibling.children[1].firstChild.length) newStartOffset = this.currentFocusedLine.root.previousElementSibling.children[1].firstChild.length;
                    range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1].firstChild, newStartOffset);
                } else {
                    range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1], 0);
                }
                //range.setEnd(copydiv.children[1].firstChild, 0);
                selection.removeAllRanges();
                selection.addRange(range);
                e.preventDefault();
            }
        } else if (e.key == "ArrowDown") {
            if (this.currentFocusedLine && this.currentFocusedLine.root.nextElementSibling) {
                var selection = this.rootdiv.getRootNode().getSelection();
                let oldRange = selection.getRangeAt(0);
                var range = document.createRange();
                let newStartOffset = oldRange.startOffset;
                if (this.currentFocusedLine.root.nextElementSibling.children[1].firstChild) {
                    if (newStartOffset > this.currentFocusedLine.root.nextElementSibling.children[1].firstChild.length) newStartOffset = this.currentFocusedLine.root.nextElementSibling.children[1].firstChild.length;
                    range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1].firstChild, newStartOffset);
                } else {
                    range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1], 0);
                }
                //range.setEnd(copydiv.children[1].firstChild, 0);
                selection.removeAllRanges();
                selection.addRange(range);
                e.preventDefault();
            }
        } else if (e.key == "ArrowLeft") {
            var selection = this.rootdiv.getRootNode().getSelection();
            let oldRange = selection.getRangeAt(0);
            if (oldRange.startOffset == 0 && this.currentFocusedLine.root.previousElementSibling && this.currentFocusedLine.root.previousElementSibling.tagName == "SPAN") {
                //go up a line
                var selection = this.rootdiv.getRootNode().getSelection();
                var range = document.createRange();
                if (this.currentFocusedLine.root.previousElementSibling.children[1].firstChild) range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1].firstChild, this.currentFocusedLine.root.previousElementSibling.children[1].firstChild.length);
                else range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1], 0);
                //range.setEnd(copydiv.children[1].firstChild, 0);
                selection.removeAllRanges();
                selection.addRange(range);
                e.preventDefault();
            }
        } else if (e.key == "ArrowRight") {
            var selection = this.rootdiv.getRootNode().getSelection();
            let oldRange = selection.getRangeAt(0);
            if ((!(oldRange.startContainer.length) || oldRange.startOffset == oldRange.startContainer.length) && this.currentFocusedLine.root.nextElementSibling) {
                //go up a line
                var selection = this.rootdiv.getRootNode().getSelection();
                var range = document.createRange();
                if (this.currentFocusedLine.root.nextElementSibling.children[1].firstChild) range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1].firstChild, 0);
                else range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1], 0);
                //range.setEnd(copydiv.children[1].firstChild, 0);
                selection.removeAllRanges();
                selection.addRange(range);
                e.preventDefault();
            }
        } else if (e.key == "Backspace") {
            if (this.currentFocusedLine && this.currentFocusedLine.contents.length == 0) {
                candidateDie = true;
            }
        } else if (e.key == "Tab") {
            e.preventDefault();
            e.stopPropagation();
            document.execCommand('insertText', false /*no UI*/, "    ");
        }
    });
    this.rootdiv.addEventListener('keyup', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key == "s") {
            return; //so that saving works
        }
        //create new items when a --- line is touched
        if (this.currentFocusedLine) {
            if (this.currentFocusedLine.id == "----") {
                if (/\S/.exec(this.currentFocusedLine.contents)) {
                    //create a new item
                    let oldContents = this.currentFocusedLine.contents;
                    let newID = polymorph_core.insertItem({ contents: oldContents });
                    let copydiv = renderise(newID, this.currentFocusedLine.root);

                    this.currentFocusedLine.editableSpan.innerText = "";

                    if (this.currentFocusedLine.root.nextElementSibling) {
                        this.currentFocusedLine.root.remove();
                    }
                    this.updateRowsOrder();
                    copydiv.children[1].focus();
                    var selection = window.getSelection();
                    var range = document.createRange();
                    range.setStart(copydiv.children[1].firstChild, copydiv.children[1].firstChild.length);
                    //range.setEnd(copydiv.children[1].firstChild, 0);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    container.fire('updateItem', { id: this.currentFocusedLine.id, sender: this });
                }
            } else {
                let cid = this.currentFocusedLine.id;
                this.parseLine(cid);
                //also parse commands
                let str=this.currentFocusedLine.contents;
                parser = /\\.+\\/g;
                if (res = parser.exec(str)) {
                    let bits = str.split(res[0]);
                    bits = bits.join("");

                    var selection = this.rootdiv.getRootNode().getSelection();
                    var crange = selection.getRangeAt(0).startOffset;
                    this.currentFocusedLine.root.children[1].innerText = bits || " ";
                    

                    var range = document.createRange();
                    range.setStart(this.currentFocusedLine.root.children[1].firstChild, crange - res[0].length);
                    //range.setEnd(copydiv.children[1].firstChild, 0);
                    selection.removeAllRanges();
                    selection.addRange(range);

                    polymorph_core.items[cid].contents = bits;

                    //process last, as processing may reshuffle rows                    
                    processCommands(res[0]);
                    container.fire('updateItem', { id: cid, sender: this });
                }

            }
        }
        //catch enter keys
        if (e.key == "Backspace") {
            if (candidateDie) {
                // go up a line
                let prevLine = { id: this.currentFocusedLine.id, root: this.currentFocusedLine.root };
                if (this.currentFocusedLine.root.previousElementSibling && this.currentFocusedLine.root.previousElementSibling.tagName != "STYLE") {
                    var selection = this.rootdiv.getRootNode().getSelection();
                    var range = document.createRange();
                    if (this.currentFocusedLine.root.previousElementSibling.children[1].firstChild) range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1].firstChild, this.currentFocusedLine.root.previousElementSibling.children[1].firstChild.length);
                    else range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1], 0);
                    //range.setEnd(copydiv.children[1].firstChild, 0);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else if (this.currentFocusedLine.root.nextElementSibling) {
                    var selection = this.rootdiv.getRootNode().getSelection();
                    var range = document.createRange();
                    if (this.currentFocusedLine.root.nextElementSibling.children[1].firstChild) range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1].firstChild, 0);
                    else range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1], 0);
                    //range.setEnd(copydiv.children[1].firstChild, 0);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    e.preventDefault();
                } else {
                    //no spare lines; return
                    return;
                }


                if (prevLine.id == "----") {

                } else {
                    polymorph_core.items[prevLine.id] = {};
                    container.fire('updateItem', { id: prevLine.id, sender: this });
                }
                prevLine.root.remove();
                this.updateRowsOrder();
                candidateDie = false;
            }
        }
    })
    // for each line, you can define a linestructure. You can change the linestructure by using hyper>changeLineStructure.
    // There is also the default LHS, which unobtrusively shows item id's (just cos).
    //for each line: there is the LHS, which is unobtrusive item ids(used for debugging); the tabspace [literally used for tabs]; the middlespace (used for anything); the orgspac

    //return true if we care about an item and dont want it garbage-cleaned :(


    container.on("createItem", (id) => {

    })

    container.on("deleteItem", (id) => {

    })

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", (d) => {
        let id = d.id;
        if (this.itemRelevant(id)) {
            //render the item, if we care about it.
        }
        //do stuff with the item.
    });

    this.refresh = function () {
        // This is called when the parent container is resized.
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});