(function () {
    let viewsets;
    core.registerOperator("opSelect", function (operator) {
        let me = this;
        me.operator = operator;
        this.settings = {};
        this.style = document.createElement("style");
        this.style.innerHTML = `
    div.views>div{
        background:lightgrey;
        border: black 3px solid;
    }
    div.views>div:hover{
        background:white;
    }
    `;
        operator.div.appendChild(this.style);

        this.rootdiv = document.createElement("div");
        this.rootdiv.style.height = "100%";
        this.rootdiv.style.overflowY = "auto";
        //Add div HTML here
        this.rootdiv.innerHTML = `
    <h1>Quick start</h1>
    <p>Choose a setup below to get started quickly - or pick an operator below to design your own interface!</p>
    <div class="views">
    </div>
    <h1>Operators</h1>
    <p>Choose an operator for this space!</p>
    <div class="operators">
    <div class="buttons"></div>
    <div class="descriptions" style="height:5em;"></div>
    </div>`;
        this.buttondiv = this.rootdiv.querySelector("div.operators>div.buttons");
        this.descInnerDiv = this.rootdiv.querySelector("div.descriptions");
        this.viewInnerDiv = this.rootdiv.querySelector("div.views");
        core.on("operatorAdded", me.reloadContents);
        this.reloadContents = function () {
            for (let i in core.operators) {
                let b = document.createElement("button");
                let displayText = i;
                if (core.operators[i].options.displayName) displayText = core.operators[i].options.displayName;
                b.innerHTML = displayText;
                b.dataset.underOperatorName = i;
                b.addEventListener("click", () => {
                    operator.reload(b.dataset.underOperatorName);
                    core.fire("viewUpdate", {
                        sender: this
                    });
                    operator.rect.tieOperator(operator);
                })
                this.buttondiv.appendChild(b);
                //generate the description
                let descDiv = document.createElement("div");
                if (core.operators[i].options.description) {
                    descDiv.innerHTML = `<p>` + core.operators[i].options.description + `</p>`;
                } else {
                    descDiv.innerHTML = `<p>No description provided :/</p>`;
                }
                descDiv.style.display = "none";
                this.descInnerDiv.appendChild(descDiv);
                b.addEventListener("mouseover", () => {
                    for (let i = 0; i < me.descInnerDiv.children.length; i++) {
                        me.descInnerDiv.children[i].style.display = "none";
                    }
                    descDiv.style.display = "block";
                })
                b.addEventListener("mouseleave", () => {
                    descDiv.style.display = "none";
                });
            }
            //viewsets. load from some JSON file remotely eventually but for now its in this file.
            let v = viewsets;
            for (let i in v) {
                let b = document.createElement("div");
                let displayText = i;
                if (v[i].options.displayName) displayText = v[i].options.displayName;
                b.innerHTML = `<div>
            <h1>` + displayText + `</h1>
            <p>` + (v[i].options.description || "No description provided :/") + `</p>
            </div>`;
                b.dataset.id = i;
                b.addEventListener("click", () => {
                    operator.rect.fromSaveData(v[b.dataset.id].rect);
                    core.fire("viewUpdate", {
                        sender: this
                    });
                    //operator.rect.tieOperator(operator);
                })
                this.viewInnerDiv.appendChild(b);
            }
        }
        this.reloadContents();
        operator.div.appendChild(this.rootdiv);

        //////////////////Handle core item updates//////////////////

        //these are optional but can be used as a reference.


        //////////////////Handling local changes to push to core//////////////////

        //Saving and loading
        this.toSaveData = function () {
            return this.settings;
        }

        this.fromSaveData = function (d) {
            Object.assign(this.settings, d);
            this.processSettings();
        }



        //Handle a change in settings (either from load or from the settings dialog or somewhere else)
        this.processSettings = function () {

        }


    });
    viewsets = {
        todolist: {
            options: {
                displayName: "Calendar",
                description: "A simple todolist with a calendar, list and description box.",
            },
            rect: {
                "XorY": 0,
                "firstOrSecond": 0,
                "pos": 1,
                "children": [{
                    "XorY": 0,
                    "firstOrSecond": 0,
                    "pos": 0.6221052631578947,
                    "children": [{
                        "operators": [{
                            "type": "itemList",
                            "uuid": "uzc2hi",
                            "data": {
                                "properties": {
                                    "title": "text",
                                    "tags": "tag",
                                    "datestring": "date"
                                },
                                "filterProp": "tasklist",
                                "currentID": "bgujo1"
                            }
                        }],
                        "selectedOperator": 0,
                        "XorY": 1,
                        "firstOrSecond": 0,
                        "pos": 0.5271317829457365
                    }, {
                        "operators": [{
                            "type": "calendar",
                            "uuid": "9thajy",
                            "data": {
                                "dateproperty": "datestring",
                                "dateRetrieval": "rDate",
                                "titleproperty": "title"
                            }
                        }],
                        "selectedOperator": 0,
                        "XorY": 1,
                        "firstOrSecond": 1,
                        "pos": 0.5271317829457365
                    }]
                }, {
                    "operators": [{
                        "type": "descbox",
                        "uuid": "2y8y4x",
                        "data": {
                            "property": "description",
                            "operationMode": "undefined",
                            "staticItem": "",
                            "currentID": "bgujo1",
                            "focusOperatorID": "uzc2hi"
                        }
                    }],
                    "selectedOperator": 0,
                    "XorY": 0,
                    "firstOrSecond": 1,
                    "pos": 0.6221052631578947
                }]
            }
        },
        ideasCurator: {
            options: {
                displayName: "Ideas curator",
                description: "A place to curate your ideas!",
            },
            rect: {
                "XorY": 0,
                "firstOrSecond": 1,
                "pos": 0,
                "children": [{
                    "operators": [{
                        "name": "Ideas",
                        "opdata": {
                            "type": "itemList",
                            "uuid": "nvd5b4",
                            "data": {
                                "properties": {
                                    "title": "text"
                                },
                                "filterProp": "isbq4x",
                                "currentID": "f3lsg5"
                            }
                        }
                    }],
                    "selectedOperator": 0,
                    "XorY": 0,
                    "firstOrSecond": 0,
                    "pos": 0.15520833333333334
                }, {
                    "operators": [{
                        "name": "Vision",
                        "opdata": {
                            "type": "subframe",
                            "uuid": "65pc5c",
                            "data": {
                                "rectUnderData": {
                                    "XorY": 0,
                                    "firstOrSecond": 0,
                                    "pos": 1,
                                    "children": [{
                                        "operators": [{
                                            "name": "Aspects",
                                            "opdata": {
                                                "type": "itemCluster",
                                                "uuid": "zl53mw",
                                                "data": {
                                                    "currentViewName": "r3k4ko",
                                                    "maxZ": 1
                                                }
                                            }
                                        }],
                                        "selectedOperator": 0,
                                        "XorY": 1,
                                        "firstOrSecond": 0,
                                        "pos": 0.5043050430504306
                                    }, {
                                        "XorY": 1,
                                        "firstOrSecond": 1,
                                        "pos": 0.5043050430504306,
                                        "children": [{
                                            "operators": [{
                                                "name": "Vision",
                                                "opdata": {
                                                    "type": "descbox",
                                                    "uuid": "bx1aa0",
                                                    "data": {
                                                        "property": "vision",
                                                        "operationMode": "focus",
                                                        "staticItem": "",
                                                        "focusOperatorID": "nvd5b4"
                                                    }
                                                }
                                            }],
                                            "selectedOperator": 0,
                                            "XorY": 0,
                                            "firstOrSecond": 0,
                                            "pos": 0.22596754057428214
                                        }, {
                                            "XorY": 0,
                                            "firstOrSecond": 1,
                                            "pos": 0.22596754057428214,
                                            "children": [{
                                                "operators": [{
                                                    "name": "Mission",
                                                    "opdata": {
                                                        "type": "descbox",
                                                        "uuid": "1g6lfj",
                                                        "data": {
                                                            "property": "Mission",
                                                            "operationMode": "focus",
                                                            "staticItem": "",
                                                            "focusOperatorID": "nvd5b4"
                                                        }
                                                    }
                                                }],
                                                "selectedOperator": 0,
                                                "XorY": 0,
                                                "firstOrSecond": 0,
                                                "pos": 0.46048387096774196
                                            }, {
                                                "operators": [{
                                                    "name": "Strategy",
                                                    "opdata": {
                                                        "type": "descbox",
                                                        "uuid": "tdp0j2",
                                                        "data": {
                                                            "property": "strategy",
                                                            "operationMode": "focus",
                                                            "staticItem": "",
                                                            "focusOperatorID": ""
                                                        }
                                                    }
                                                }],
                                                "selectedOperator": 0,
                                                "XorY": 0,
                                                "firstOrSecond": 1,
                                                "pos": 0.46048387096774196
                                            }]
                                        }]
                                    }]
                                }
                            }
                        }
                    }, {
                        "name": "Planning",
                        "opdata": {
                            "type": "subframe",
                            "uuid": "zuv6lb",
                            "data": {
                                "rectUnderData": {
                                    "XorY": 0,
                                    "firstOrSecond": 0,
                                    "pos": 1,
                                    "children": [{
                                        "operators": [{
                                            "name": "Aspects",
                                            "opdata": {
                                                "type": "itemCluster",
                                                "uuid": "hqpwhx",
                                                "data": {
                                                    "currentViewName": "f3lsg5",
                                                    "maxZ": 1
                                                }
                                            }
                                        }],
                                        "selectedOperator": 0,
                                        "XorY": 1,
                                        "firstOrSecond": 0,
                                        "pos": 0.5067650676506765
                                    }, {
                                        "XorY": 1,
                                        "firstOrSecond": 1,
                                        "pos": 0.5067650676506765,
                                        "children": [{
                                            "operators": [{
                                                "name": "Tasks",
                                                "opdata": {
                                                    "type": "itemList",
                                                    "uuid": "jh2xbf",
                                                    "data": {
                                                        "properties": {
                                                            "title": "text"
                                                        },
                                                        "filterProp": ""
                                                    }
                                                }
                                            }],
                                            "selectedOperator": 0,
                                            "XorY": 0,
                                            "firstOrSecond": 0,
                                            "pos": 0.4700374531835206
                                        }, {
                                            "operators": [{
                                                "name": "Calendar",
                                                "opdata": {
                                                    "type": "calendar",
                                                    "uuid": "dmz590",
                                                    "data": {
                                                        "dateproperty": "datestring",
                                                        "dateRetrieval": "rDate",
                                                        "titleproperty": "title"
                                                    }
                                                }
                                            }],
                                            "selectedOperator": 0,
                                            "XorY": 0,
                                            "firstOrSecond": 1,
                                            "pos": 0.4700374531835206
                                        }]
                                    }]
                                }
                            }
                        }
                    }, {
                        "name": "Feasibility",
                        "opdata": {
                            "type": "subframe",
                            "uuid": "m9e68h",
                            "data": {
                                "rectUnderData": {
                                    "XorY": 0,
                                    "firstOrSecond": 0,
                                    "pos": 1,
                                    "children": [{
                                        "operators": [{
                                            "name": "Financial feasibility",
                                            "opdata": {
                                                "type": "descbox",
                                                "uuid": "5zpog3",
                                                "data": {
                                                    "property": "Finance",
                                                    "operationMode": "focus",
                                                    "staticItem": "",
                                                    "focusOperatorID": "nvd5b4"
                                                }
                                            }
                                        }],
                                        "selectedOperator": 0,
                                        "XorY": 1,
                                        "firstOrSecond": 0,
                                        "pos": 0.3813038130381304
                                    }, {
                                        "operators": [{
                                            "name": "Technical feasilibity",
                                            "opdata": {
                                                "type": "descbox",
                                                "uuid": "ng7kpw",
                                                "data": {
                                                    "property": "technical",
                                                    "operationMode": "focus",
                                                    "staticItem": "",
                                                    "focusOperatorID": "nvd5b4"
                                                }
                                            }
                                        }],
                                        "selectedOperator": 0,
                                        "XorY": 1,
                                        "firstOrSecond": 1,
                                        "pos": 0.3813038130381304
                                    }]
                                }
                            }
                        }
                    }],
                    "selectedOperator": 1,
                    "XorY": 0,
                    "firstOrSecond": 1,
                    "pos": 0.15520833333333334
                }]
            }
        }
    }
})()