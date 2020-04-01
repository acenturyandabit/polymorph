polymorph_core.registerOperator("welcome", {
    displayName: "Welcome",
    description: "The Welcome Operator. If you're reading this, thanks for messing around with my code, adventurer.",
    hidden: true
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        somesetting: "somevalue"
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
    <style>
        a{
            color:lightblue;
        }
    </style>
    <div style="display: flex; flex-direction: row; padding: 30px; height:100%">
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
                <ul>
                    <li><a>A brainstorming tool</a></li>
                    <li><a>A todo-list</a></li>
                    <li><a>A calendar</a></li>
                    <li><a>A quick websocket front-end</a></li>
                    <li><a>A personal knowledge base</a></li>
                    <li><a>A reconfigurable UI</a></li>
                    <li><a>A collaboration tool</a></li>
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

    let recentDocDiv=this.rootdiv.querySelector(".recentDocuments");
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