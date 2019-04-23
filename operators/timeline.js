core.registerOperator("timeline", {
        displayName: "Timeline",
        description: "A timeline based on vis.js. Pretty clean, for the most part."
    },
    function (operator) {
        let me = this;
        me.operator = operator;
        this.settings = {
            dateproperty: "datestring",
            dateRetrieval: "rDate", // "mDate", //"sDate", // now second iteration of date. Change to sdate to fallback to old version.
            titleproperty: 'title'
        }; // Use my date retrieval format. (others not implented yet lm.ao)

        this.rootdiv = document.createElement("div");
        this.rootdiv.innerHTML = ``;
        this.rootdiv.style.cssText = 'height:100%; overflow-y: scroll';
        this.cstyle = document.createElement("link");
        this.cstyle.rel = "stylesheet";
        this.cstyle.type = "text/css";
        this.cstyle.href = "3pt/vis.min.css";
        this.rootdiv.appendChild(this.cstyle);
        this.timediv=document.createElement("div");
        this.rootdiv.appendChild(this.timediv);
        operator.div.appendChild(this.rootdiv);
        //Add div HTML here
        scriptassert([
            ['vis', '3pt/vis.min.js'],
        ], () => {
            console.log("got here");
            this.dataset = new vis.DataSet();
            me.updateItem = function (i) {
                if (core.items[i][me.settings.dateproperty]) {
                    let result = dateParser.getCalendarTimes(core.items[i][me.settings.dateproperty].date, start, end);
                    for (let j = 0; j < result.length; j++) {
                        let isostring = new Date(result[j].date - tzd.getTimezoneOffset() * 60 * 1000 + 1000);
                        let eisostring;
                        if (result[j].endDate) eisostring = new Date(result[j].endDate - tzd.getTimezoneOffset() * 60 * 1000 - 1000);
                        else eisostring = new Date(isostring.getTime() + 60 * 60 * 1000 - 1000);
                        isostring = isostring.toISOString();
                        eisostring = eisostring.toISOString();
                        this.dataset.update({
                            id: id,
                            start: new Date(isostring),
                            content: core.items[i][me.settings.titleproperty],
                            end: new Date(eisostring)
                        });
                    }
                }
            }
            core.on("updateItem", (d) => {
                me.updateItem(d.id);
            })
            let timeline = new vis.Timeline(this.timediv, this.dataset, {
                height: 300
            });
            for (let i in core.items) me.updateItem(i);
            
            timeline.on('select', (e) => {
                //console.log(Object.keys[e.items]);
                core.fire("focus", {
                    id: e.items[0],
                    sender: me
                });
            })
        });

        core.on("dateUpdate", this.updateItem);
        //Handle a change in settings (either from load or from the settings dialog or somewhere else)
        this.processSettings = function () {
            try {
                me.fire("updateView");
            } catch (e) {
                console.log("JQUERY not ready yet :/");
            }
        }

        //Saving and loading
        this.toSaveData = function () {
            return this.settings;
        }

        this.fromSaveData = function (d) {
            Object.assign(this.settings, d);
            this.processSettings();
        }


        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.dialogDiv.innerHTML = `
    <input data-role='dateproperty' placeholder="Enter the date property">
    <input data-role='titleproperty' placeholder="Enter the property for calendar item names.">
    `;

        this.dialogDiv.addEventListener("input", function (e) {
            me.settings[e.target.dataset.role] = e.target.value;
        })

        this.showDialog = function () {
            // update your dialog elements with your settings
        }
        this.dialogUpdateSettings = function () {
            // pull settings and update when your dialog is closed.
        }

    });