//V2.2.4 Filescreen: Loading screen for files
//Expose more before document load

/*
TODO:
Better formatting for recent files using split.

*/

/*
How to use:
let f = new _filescreen({
    headprompt: STRING OR DOM_ELEMENT
    formats:[
        {
            prompt: STRING
            queryParam: STRING (appended to the URL if the user decides to load that URL)
        }
    ]
})

Methods:
f.showSplash();
f.saveRecentDocument(id,url,displayName);

Properties:
Use f.baseDiv to access the underlying div, for any event handlers you may need.
*/



function _filescreen(userSettings) {
    this.settings = {
        headprompt: "Welcome!",
        formats: [{
            prompt: "Make a new document"
        }],
        documentQueryKeyword: "doc",
        tutorialEnabled: true,
        tutorialURL: "?tute",
        savePrefix: "",
    };
    Object.assign(this.settings, userSettings);
    let me = this;
    //NON-DOM-DEPENDENT INITALISATION
    this.baseDiv = document.createElement("div");
    let sstyle = document.createElement("style");
    sstyle.innerHTML = `.filescreen_recentDocDiv em{
        padding: 3px;
        font-style: normal;
        font-family: sans-serif;
        cursor: pointer;
        color: red;
    }
    .filescreen_recentDocDiv{
        overflow-y: auto;
        max-height: 40vh;
    }
    `
    this.baseDiv.appendChild(sstyle);
    me.baseDiv.style.cssText = `display: none;
    position: absolute;
    top: 0;
    left: 0;
    width:100%;
    height:100%;
    background-color: rgba(0,0,0,0.5);
    z-index:100;`;
    let outerDiv;
    outerDiv = document.createElement("div");
    outerDiv.style.cssText = "display: table; position: absolute; top: 0; left: 0; height: 100%; width: 100%;";
    me.baseDiv.appendChild(outerDiv);
    let midDiv;
    midDiv = document.createElement("div");
    midDiv.style.cssText = "display: table-cell; vertical-align: middle;";
    outerDiv.appendChild(midDiv);
    let innerDiv;
    innerDiv = document.createElement("div");
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        innerDiv.style.cssText = "position:relative; display: flex; flex-direction: column; margin: auto; min-height: 60vh; max-height: 80vh; width: 80vw; background-color: white; border-radius: 30px; padding: 30px;";
    } else {
        innerDiv.style.cssText = "position:relative; display: flex; flex-direction: column; margin: auto; min-height: 60vh; max-height: 80vh; width: 40vw; background-color: white; border-radius: 30px; padding: 30px;";
    }

    midDiv.appendChild(innerDiv);
    if ((typeof me.settings.headprompt).toLowerCase() == "string") {
        let heading = document.createElement("h1");
        heading.innerText = me.settings.headprompt;
        innerDiv.appendChild(heading);
    } else {
        innerDiv.appendChild(me.settings.headprompt);
    }
    //ddi of h2
    if (me.settings.formats) {
        let newDocHeading = document.createElement("h2");
        newDocHeading.innerText = "Make a new document";
        innerDiv.appendChild(newDocHeading);
        me.newDocInput = document.createElement("input");
        me.newDocInput.placeholder = "Enter Name...";
        innerDiv.appendChild(me.newDocInput);
        //create a button for each format specifier
        for (let i = 0; i < me.settings.formats.length; i++) {
            let b = document.createElement("button");
            b.innerText = me.settings.formats[i].prompt;
            b.dataset.index = i;
            //if (me.settings.formats[i].queryParam) b.dataset.queryParam = me.settings.formats[i].queryParam;
            b.addEventListener("click", (e) => {
                if (me.newDocInput.value.length) {
                    let url = new URL(window.location);
                    let totalString = "?" + me.settings.documentQueryKeyword + "=" + me.newDocInput.value;
                    let index = Number(e.target.dataset.index);
                    if (me.settings.formats[i].queryParam) {
                        if (typeof me.settings.formats[i].queryParam == "string") {
                            totalString += "&" + me.settings.formats[i].queryParam;
                        } else totalString += "&" + me.settings.formats[i].queryParam(); //string or function
                    }
                    url.search = totalString;
                    window.location.href = url.toString();
                }
            })
            innerDiv.appendChild(b);
        }
    }
    let recentHeading = document.createElement("h2");
    recentHeading.innerText = "Or, open a recent document:";
    innerDiv.appendChild(recentHeading);
    me.recentDocDiv = document.createElement("div");
    me.recentDocDiv.classList.add("filescreen_recentDocDiv");
    me.recentDocDiv.innerHTML = "<p>Nothing to show here :3</p>";
    innerDiv.appendChild(me.recentDocDiv);
    if (me.settings.tutorialEnabled) {
        recentHeading = document.createElement("h2");
        recentHeading.innerText = "First time here? Check out our tutorial :)";
        innerDiv.appendChild(recentHeading);
        let newa = document.createElement("a");
        newa.innerText = "Click here!";
        newa.href = me.settings.tutorialURL;
        innerDiv.appendChild(newa);
    }
    //DOM-DEPENDENT INITIALIZATION
    if (document.readyState != "loading") document.body.appendChild(me.baseDiv);
    else document.addEventListener("DOMContentLoaded", () => {
        document.body.appendChild(me.baseDiv);
    });


    ///functions to call
    this.showSplash = function () {
        //populate recent documents
        let recents = JSON.parse(localStorage.getItem("__" + me.settings.savePrefix + "_recent_docs"));
        let newInnerHTML = "";
        if (recents) {
            for (let i in recents) {
                newInnerHTML += `<p><a href=` + recents[i].url + ` data-id="${i}">` + recents[i].displayName + `</a><em>x</em></p>`;
            }
            me.recentDocDiv.innerHTML = newInnerHTML;
        }
        me.baseDiv.style.display = "block";
        //register delegated event handler for the em's.
        me.recentDocDiv.addEventListener("click", (e) => {
            if (e.target.tagName.toLowerCase() == "em") {
                let toRemove = e.target.parentElement.children[0].dataset.id;
                delete recents[toRemove];
                localStorage.setItem("__" + me.settings.savePrefix + "_recent_docs", JSON.stringify(recents));
                e.target.parentElement.remove();
            }
        });
    }

    this.saveRecentDocument = function (id, url, displayName) {
        if (!url) url = window.location.href;
        let recents = JSON.parse(localStorage.getItem("__" + me.settings.savePrefix + "_recent_docs"));
        if (!recents || recents.constructor.name != "Object") recents = {}; //upgrade older versions
        recents[id] = {
            url: url,
            displayName: displayName || id
        };
        localStorage.setItem("__" + me.settings.savePrefix + "_recent_docs", JSON.stringify(recents));
    }
}