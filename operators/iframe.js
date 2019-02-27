core.registerOperator("miniBrowser", function (operator) {
    let me = this;
    this.settings = {};

    this.rootdiv = document.createElement("div");
    //Add div HTML here
    this.rootdiv.innerHTML = `<span><input><button>Go</button></span>
    <iframe style="flex:1 1 100%" is="x-frame-bypass"></iframe>`;
    this.rootdiv.style.display="flex";
    this.rootdiv.style.flexDirection="column";
    this.rootdiv.style.height="100%";
    this.iframe = this.rootdiv.querySelector("iframe");
    this.goBtn = this.rootdiv.querySelector("button");
    this.input = this.rootdiv.querySelector("input");
    operator.div.appendChild(this.rootdiv);

    //hide if the operator is currently moving - just as a convenience measure?


    //////////////////Handle core item updates//////////////////

    //For interoperability between views you may fire() and on() your own events. You may only pass one object to the fire() function; use the properties of that object for additional detail.

    this.goBtn.addEventListener("click", function () {
        //If not https, promote to https.
        let tryURL=me.input.value;
        if (tryURL.includes("://")){
            tryURL="https:"+tryURL.split(":")[1];
        }else{
            tryURL= "https://"+tryURL;
        }
        me.settings.url =tryURL;
        me.processSettings();
    });

    //////////////////Handling local changes to push to core//////////////////

    //Handle item creation, locally

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        Object.assign(this.settings, d);
        me.processSettings();
    }

    //Handle a change in settings (either from load or from the settings dialog or somewhere else)
    this.processSettings = function () {
        this.iframe.remove();
        this.iframe=document.createElement("iframe",{is:"x-frame-bypass"});
        this.iframe.src=this.settings.url;
        this.iframe.style.cssText="flex: 1 1 100%";
        this.rootdiv.appendChild(this.iframe);
        this.input.value=this.settings.url;
    }

    scriptassert([["xframebypass","3pt/x-frame-bypass.js"]]);

    //Create a settings dialog
    scriptassert([
        ["dialog", "genui/dialog.js"]
    ], () => {
        me.dialog = document.createElement("div");

        me.dialog.innerHTML = `
        <div class="dialog">
        </div>`;
        dialogManager.checkDialogs(me.dialog);
        //Restyle dialog to be a bit smaller
        me.dialog = me.dialog.querySelector(".dialog");
        me.innerDialog = me.dialog.querySelector(".innerDialog");
        operator.div.appendChild(me.dialog);
        let d = document.createElement("div");
        d.innerHTML = `
        WHAT YOU WANT TO PUT IN YOUR DIALOG
        `;
        me.innerDialog.appendChild(d);

        //When the dialog is closed, update the settings.
        me.dialog.querySelector(".cb").addEventListener("click", function () {
            me.updateSettings();
        })

        me.showSettings = function () {
            me.dialog.style.display = "block";
        }
    })



});