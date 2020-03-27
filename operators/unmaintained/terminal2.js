polymorph_core.registerOperator("terminal2", {
    displayName: "Terminal2",
    description: "Another command-line way of interacting with polymorph. More focused on intra-polymorph operations."
}, function (container) {
    let defaultSettings = {
        queryHistory:[],
        filter:guid(4),
        userFilters: {}
    };

    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `
    <textarea style="flex: 1 0 auto" class="output"></textarea>
    <div>
    <span class="contextspace"></span>
    <textarea class="input" style="width: 100%"></textarea>
    </div>
    `;
    this.rootdiv.style.cssText = `display: flex;
    flex-direction: column;
    height: 100%;`;
    this.querybox = this.rootdiv.querySelector('.input');
    this.outputbox = this.rootdiv.querySelector('.output');

    let operatorRegexes = {
        filter: {
            help: `Set the filter for the item descriptor.
    filter $1: set the filter
    filter +$1: add to the filter
    filter -$1: remove from the filter, if exists. Does nothing if string not in filter.`,
            regex: /^filter (\+|-)?(.+)$/ig,
            operate: (regres) => {
                let splitbits = regres[2].split(/\s/g);
                if (!this.regres[1]) this.settings.filter = {};
                for (let i of splitbits) {
                    if (regres[i] == "-") {
                        delete this.settings.filter[i];
                    } else this.settings.filter[i] = true;
                }
            }
        },
        a: {
            regex: /^a (.+)$/ig,
            help: "Add an item.",
            operate: (regres) => {
                //create the item
                let it={description: regres[1]};
                it[this.settings.filter]=true;
                polymorph_core.insertItem(it);
            }
        },
        e: {
            regex: /^e$/ig,
            help: "Edit bottommost item in the list.",
            operate: (regres) => {
                let glid = this.getLatestItem();
                this.querybox.value = `si:${glid} ${polymorph_core.items[glid].description}`;
            }
        },
        si: {
            regex: /^si:(\S+) (.+)$/ig,
            help: "Set item to value.",
            operate: function (regres) {
                polymorph_core.items[regres[1]].description = regres[2];
            }
        }
    };
    container.div.appendChild(this.rootdiv);

    let processQuery = (q) => {
        for (let i in operatorRegexes) {
            operatorRegexes[i].regex.lastIndex = 0; 
            if ((regres = operatorRegexes[i].regex.exec(q))) {
                operatorRegexes[i].operate(regres);
            }
        }
    }

    let latestItems=[];
    this.getLatestItem = ()=>{
        return latestItems[0];
    }

    let renderOutput=()=>{
        let output="";
        let outputs=0;
        latestItems=[];
        for (let i in polymorph_core.items){
            if (polymorph_core.items[i][this.settings.filter]){
                output+=JSON.stringify(polymorph_core.items[i],undefined,1);

                latestItems.push(i);

                outputs++;
                if (outputs>10){
                    break;
                }
            }
        }
        this.outputbox.value=output;
    }

    let renderContext=()=>{

    }

    this.querybox.addEventListener("keyup", (e) => {
        switch (e.key) {
            case "Enter":
                let v = this.querybox.value;
                v=v.slice(0,v.length-1);//remove trailing \n
                this.settings.queryHistory.unshift(v);
                this.querybox.value = "";
                this.settings.qid=-1;
                processQuery(v);
                renderOutput();
                renderContext();
                break;
            case "ArrowUp":
                this.settings.qid++;
                if (this.settings.queryHistory[this.settings.qid])this.querybox.value = this.settings.queryHistory[this.settings.qid];//last return
                else this.settings.qid--;
                break;
            case "ArrowDown":
                if (this.settings.qid>-1)this.settings.qid--;
                if (this.settings.qid>0){
                    this.querybox.value = this.settings.queryHistory[this.settings.qid];//last return
                }else{
                    this.querybox.value = "";
                }
                break;
        }
    })

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `
    `;
    let ops = [
    ];

    this.showDialog = () => {
        ops.forEach((op) => { op.load(); });
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = () => {
        // pull settings and update when your dialog is closed.
    }

});