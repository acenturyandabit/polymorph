polymorph_core.registerOperator("welcome", {
    displayName: "Welcome",
    description: "The Welcome Operator. If you're reading this, thanks for messing around with my code, adventurer.",
    hidden: true
}, function (container) {
    let templates={
        brainstorming: `{"default_operator":{"_od":{"t":"itemcluster2","data":{"itemcluster":{"cx":0,"cy":0,"scale":1},"filter":"ltkar5","tray":false,"createAcrossViews":true,"showNewViewButton":false,"textProp":"title","focusExtendProp":"description","currentViewName":"1l3u"},"inputRemaps":{},"outputRemaps":{},"tabbarName":"Itemcluster 2","p":"default_container"}},"1l3u":{"itemcluster":{"viewName":"New View","cx":1030,"cy":961,"scale":1,"XZoomFactor":1,"grid":0},"ltkar5":true},"drbeqvh_N6l6l1x_0":{"title":"Double click to add new items!","itemcluster":{"viewData":{"1l3u":{"x":943,"y":556}}},"ltkar5":true,"to":{"drbeqvh_N6l6nBA_1":true,"drbeqvh_N6l6uOp_3":true}},"drbeqvh_N6l6nBA_1":{"title":"Shift-click on an item and drag to connect items.","itemcluster":{"viewData":{"1l3u":{"x":1416.6589578662847,"y":671.7387220367473}}},"ltkar5":true,"to":{"drbeqvh_N6l6xv3_4":true}},"drbeqvh_N6l6qP3_2":{"title":"Right-click on an item to remove it. ","itemcluster":{"viewData":{"1l3u":{"x":520.1611849165822,"y":981.2783833785711}}},"ltkar5":true,"to":{"drbeqvh_N6l79/f_5":true}},"drbeqvh_N6l6uOp_3":{"title":"Click and drag the background to pan around.","itemcluster":{"viewData":{"1l3u":{"x":516.7613141248236,"y":729.517884079592}}},"ltkar5":true,"to":{"drbeqvh_N6l6qP3_2":true}},"drbeqvh_N6l6xv3_4":{"title":"Click an item and drag to move it around. ","itemcluster":{"viewData":{"1l3u":{"x":1426.8761410281654,"y":981.278383432773}}},"ltkar5":true,"to":{"drbeqvh_N6l79/f_5":true}},"drbeqvh_N6l79/f_5":{"title":"To edit an item, click and type.","itemcluster":{"viewData":{"1l3u":{"x":953.0792405689535,"y":1153.2980189590594}}},"ltkar5":true,"to":{"drbeqvh_N6l7Gaq_6":true,"drbeqvh_N6l7UWI_7":true,"drbeqvh_N6l7b4h_8":true,"drbeqvh_N6l7eg+_9":true}},"drbeqvh_N6l7Gaq_6":{"title":"Right click on the background for auto-arrangement options.","itemcluster":{"viewData":{"1l3u":{"x":763.4382906893444,"y":871.9076775296288}}},"ltkar5":true},"drbeqvh_N6l7UWI_7":{"title":"Control click-and-drag to select multiple items.","itemcluster":{"viewData":{"1l3u":{"x":1060.8296831010819,"y":903.4111007452011}}},"ltkar5":true},"drbeqvh_N6l7b4h_8":{"title":"Scroll to zoom in and out.","itemcluster":{"viewData":{"1l3u":{"x":612.4554171500922,"y":1256.4920671495831}}},"ltkar5":true},"drbeqvh_N6l7eg+_9":{"title":"Press G and scroll to activate a grid to snap to. ","itemcluster":{"viewData":{"1l3u":{"x":1242.7876903306637,"y":1254.9513507410031}}},"ltkar5":true}}`,
        tasklist:`{"_meta":{"displayName":"New Polymorph Document","id":"fmufz3","contextMenuItems":["Delete::polymorph_core.deleteItem","Background::item.edit(style.background)","Foreground::item.edit(style.color)"],"currentView":"default_container","globalContextMenuOptions":["Style::Item Background::item.edit(item.style.background)","Style::Text color::item.edit(item.style.color)"]},"default_operator":{"_od":{"t":"itemList","data":{"properties":{"title":"text","Importance":"text","date":"date"},"propertyWidths":{"title":263,"Importance":160},"filter":"ecacp4","enableEntry":true,"implicitOrder":false,"linkProperty":"to","currentID":"drbeqvh_N6lhZeN_5","sortby":"date"},"inputRemaps":{},"outputRemaps":{"focusItem":["listFocusItem"]},"tabbarName":"itemList","p":"drbeqvh_N6lhYyb_3"}},"drbeqvh_N6lhAQx_0":{"title":"Adding new items","ecacp4":1587790259898,"description":"Type the things you want to do in the first row to the left; then press Enter to add.","Importance":"Very","date":{"datestring":"+1d","date":[{"date":1587877251008,"part":"+1d","opart":"+1d","refdate":1587790851008,"endDate":1587880851008}],"prettyDateString":"26/04/2020"}},"drbeqvh_N6lhFfL_1":{"title":"Adding more columns","ecacp4":1587790281301,"description":"You can change the columns that are displayed using the cog next to 'Itemlist'.","Importance":"Moderate","date":{"datestring":"now","date":[{"date":1587790892068,"part":"now","opart":"now","refdate":1587790892068,"endDate":1587794492068}],"prettyDateString":"15:01:32"}},"drbeqvh_N6lhX4+_2":{"title":"Searching","ecacp4":1587790352702,"description":"You can also search for items using the box with the little magnifying glass.","date":{"datestring":"+2h","date":[{"date":1587798097727,"part":"+2h","opart":"+2h","refdate":1587790897727,"endDate":1587801697727}],"prettyDateString":"17:01:37"}},"drbeqvh_N6lhYyb_3":{"_rd":{"p":"default_container","x":0,"f":0,"ps":0.4276351720371382,"s":"default_operator","containerOrder":["default_operator"]}},"drbeqvh_N6lhYyb_4":{"_rd":{"p":"default_container","x":0,"f":1,"ps":0.4276351720371382,"s":"drbeqvh_N6lhZeN_5","containerOrder":["drbeqvh_N6lhZeN_5"]}},"drbeqvh_N6lhZeN_5":{"_od":{"t":"descbox","data":{"property":"description","operationMode":"focus","staticItem":"","auxProperty":"title","showTags":false,"currentID":"drbeqvh_N6li9SN_7"},"inputRemaps":{"listFocusItem":"focusItem"},"outputRemaps":{"createItem":["createItem_drbeqvh_N6lhZeN_5"],"deleteItem":["deleteItem_drbeqvh_N6lhZeN_5"],"focusItem":["focusItem_drbeqvh_N6lhZeN_5"]},"tabbarName":"descbox","p":"drbeqvh_N6ljJEG_0"}},"drbeqvh_N6lhsLS_6":{"title":"Resizing the UI","ecacp4":1587790439772,"description":"You can resize the UI by dragging on the borders of the UI.\\n\\nIf you want more lists, descriptions or otherwise, hold Shift and drag the borders "},"drbeqvh_N6li9SN_7":{"title":"Saving","Importance":"","ecacp4":1587790518039,"description":"Press CTRL-S to save."},"drbeqvh_N6ljJEG_0":{"_rd":{"p":"drbeqvh_N6lhYyb_4","x":1,"f":0,"ps":0.3828207847295864,"s":"drbeqvh_N6lhZeN_5"}},"drbeqvh_N6ljJEG_1":{"_rd":{"p":"drbeqvh_N6lhYyb_4","x":1,"f":1,"ps":0.3828207847295864,"s":"drbeqvh_N6ljK08_2","containerOrder":["drbeqvh_N6ljK08_2"]}},"drbeqvh_N6ljK08_2":{"_od":{"t":"calendar","data":{"dateproperties":["date"],"titleproperty":"title","defaultView":"agendaWeek"},"inputRemaps":{},"outputRemaps":{"createItem":["createItem_drbeqvh_N6ljK08_2"],"deleteItem":["deleteItem_drbeqvh_N6ljK08_2"],"focusItem":["focusItem_drbeqvh_N6ljK08_2"]},"tabbarName":"Calendar","p":"drbeqvh_N6ljJEG_1"}}}`,
        
    };
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {};

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
    <style>
        a{
            color:lightblue;
        }
    </style>
    <div style="display: flex; flex-direction: row; padding: 30px;">
        <div style="display: flex; flex-direction:column; flex: 1 1 50%">
            <div>
                <h2>Start</h2>
                <a class="newDocButton" href="#">New document</a>
                <br>
                <h3>Recent documents:</h3>
                <div class="recentDocuments">
                </div>
            </div>
            <div>
                <h2>Help</h2>
                <p>Tutorial [TODO]</p>
                <p>User Docs [TODO]</p>
                <p><a href="mailto:steeven.liu2@gmail.com">Contact the developer</a></p>
            </div>
        </div>
        <div style="flex: 1 1 50%">
            <div>
                <h2>About</h2>
                <span>Polymorph is Steven's personal Web-based OS/document processing tool/brainstorming tool/UI testbed. To date, it has a number of use cases:</span>
                <ul class="templateList">
                    <li><a href="#" data-template="brainstorming">A brainstorming tool</a></li>
                    <li><a href="#" data-template="tasklist">A todo-list with calendar</a></li>
                    <!--<li><a>A quick websocket front-end</a></li>
                    <li><a>A personal knowledge base</a></li>
                    <li><a>A reconfigurable UI</a></li>
                    <li><a>A collaboration tool</a></li>-->
                </ul>
            </div>
            <div>
                <h2>Customise</h2>
                <a>Nothing to see here, yet!</a>
            </div>
        </div>
    </div>
    `;
    this.rootdiv.style.color = "white";

    this.rootdiv.querySelector(".templateList").addEventListener("click", (e) => {
        if (e.target.matches("[data-template]")){
            // load a template, by loading in all of the data
            let RTP = JSON.parse(templates[e.target.dataset.template]);
            RTP._meta=polymorph_core.items._meta;
            RTP.default_container=polymorph_core.items.default_container; // this probably hasn't changed
            for (let i in RTP){
                RTP[i]._lu_=Date.now();
            }
            delete polymorph_core.items.default_operator;
            delete polymorph_core.containers.default_operator;
            // remove this operator
            polymorph_core.integrateData(RTP, "TEMPLATER");
            polymorph_core.switchView("default_container");
        }
    })

    this.rootdiv.querySelector(".newDocButton").addEventListener("click", () => {
        //get out of the way
        while (container.div.children.length) container.div.children[0].remove();
        container.settings.t = "opSelect";
        container.operator = new polymorph_core.operators["opSelect"].constructor(container);
        //change name if user has not already modified name
        container.settings.tabbarName = "New Operator";
        //force the parent rect to update my name
        polymorph_core.rects[container.settings.p].tieContainer(container.id);
        container.fire("updateItem", {
            id: this.container.id,
            sender: this
        });
    })

    let recentDocDiv = this.rootdiv.querySelector(".recentDocuments");
    // Enumerate old documents
    let recents = JSON.parse(localStorage.getItem("__polymorph_recent_docs"));
    let newInnerHTML = "";
    if (recents) {
        for (let i in recents) {
            newInnerHTML += `<p><a href=` + recents[i].url + ` data-id="${i}">` + recents[i].displayName + `</a><em>x</em></p>`;
        }
        recentDocDiv.innerHTML = newInnerHTML;
    }


    recentDocDiv.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == "em") {
            let toRemove = e.target.parentElement.children[0].dataset.id;
            delete recents[toRemove];
            localStorage.setItem("__polymorph_recent_docs", JSON.stringify(recents));
            e.target.parentElement.remove();
        }
    });

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `Nothing to see here!`;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});