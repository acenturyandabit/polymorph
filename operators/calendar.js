core.registerOperator("calendar", {
    displayName: "Calendar",
    description: "A simple calendar. Click on items to select them. (Does not yet support click-to-add but we'll get there one day.)"
},
    function (operator) {
        let me = this;
        me.container = operator;
        this.settings = {
            dateproperty: "datestring",
            dateRetrieval: "rDate", // "mDate", //"sDate", // now second iteration of date. Change to sdate to fallback to old version.
            titleproperty: 'title',
            defaultView: "agendaWeek",
        }; // Use my date retrieval format. (others not implented yet lm.ao)

        this.rootdiv = document.createElement("div");
        this.rootdiv.innerHTML = ``;
        this.rootdiv.style.cssText = 'height:100%; overflow-y: scroll';
        this.cstyle = document.createElement("link");
        this.cstyle.rel = "stylesheet";
        this.cstyle.type = "text/css";
        this.cstyle.href = "3pt/fullcalendar.min.css";
        this.rootdiv.appendChild(this.cstyle);
        //Add div HTML here
        scriptassert([
            ['jquery', '3pt/jquery.min.js'],
            ['moment', '3pt/moment.min.js'],
            ['fullcalendar', '3pt/fullcalendar.min.js']
        ], () => {
            $(this.rootdiv).fullCalendar({
                events: (start, end, timezone, callback) => {
                    let allList = [];
                    if (me.settings.pushnotifs) {
                        me.notifstack = [];
                    }
                    let tzd = new Date();
                    for (let i in core.items) {
                        if (core.items[i][me.settings.dateproperty] && core.items[i][me.settings.dateproperty].date) {
                            let tzd = new Date();
                            if (me.settings.dateRetrieval == 'sDate') {
                                let isostring = new Date(Number(core.items[i][me.settings.dateproperty].date) - tzd.getTimezoneOffset() * 60 * 1000);
                                let eisostring;
                                //if (me.items[i].dates[0].end) eisostring = new Date(Number(me.items[i].dates[0].end) - tzd.getTimezoneOffset() * 60 * 1000);
                                eisostring = new Date(isostring.getTime() + 60 * 60 * 1000);
                                isostring = isostring.toISOString();
                                eisostring = eisostring.toISOString();
                                allList.push({
                                    id: i,
                                    title: core.items[i][me.settings.titleproperty],
                                    //backgroundColor: $(e).find("input")[0].style.backgroundColor,
                                    //textColor: $(e).find("input")[0].style.color || "black",
                                    start: isostring,
                                    end: eisostring
                                });
                            } else if (me.settings.dateRetrieval == 'mDate') {
                                try {
                                    let isostring = new Date(Number(core.items[i][me.settings.dateproperty].date[0].date) - tzd.getTimezoneOffset() * 60 * 1000);
                                    let eisostring;
                                    if (core.items[i][me.settings.dateproperty].date[0].endDate) eisostring = new Date(Number(core.items[i][me.settings.dateproperty].date[0].endDate) - tzd.getTimezoneOffset() * 60 * 1000);
                                    else eisostring = new Date(isostring.getTime() + 60 * 60 * 1000);
                                    isostring = isostring.toISOString();
                                    eisostring = eisostring.toISOString();
                                    allList.push({
                                        id: i,
                                        title: core.items[i][me.settings.titleproperty],
                                        //backgroundColor: $(e).find("input")[0].style.backgroundColor,
                                        //textColor: $(e).find("input")[0].style.color || "black",
                                        start: isostring,
                                        end: eisostring
                                    });
                                } catch (e) {

                                }
                            } else if (me.settings.dateRetrieval == 'rDate') {
                                try {
                                    let result = dateParser.getCalendarTimes(core.items[i][me.settings.dateproperty].date, start, end);
                                    for (let j = 0; j < result.length; j++) {
                                        me.notifstack.push({
                                            txt: core.items[i][me.settings.titleproperty],
                                            time: result[j].date
                                        });
                                        let isostring = new Date(result[j].date - tzd.getTimezoneOffset() * 60 * 1000 + 1000);
                                        let eisostring;
                                        if (result[j].endDate) eisostring = new Date(result[j].endDate - tzd.getTimezoneOffset() * 60 * 1000 - 1000);
                                        else eisostring = new Date(isostring.getTime() + 60 * 60 * 1000 - 1000);

                                        isostring = isostring.toISOString();
                                        eisostring = eisostring.toISOString();
                                        let col = "";
                                        let bak = "";
                                        if (core.items[i].style) {
                                            bak = core.items[i].style.background;
                                            col = core.items[i].style.color;
                                        }
                                        allList.push({
                                            id: i,
                                            title: core.items[i][me.settings.titleproperty],
                                            backgroundColor: bak,
                                            textColor: col,
                                            start: isostring,
                                            end: eisostring
                                        });
                                    }
                                } catch (e) {

                                }
                            }
                        }
                    }
                    callback(allList);
                },
                eventClick: function (calEvent, jsEvent, view) {
                    core.fire("focus", {
                        id: calEvent.id,
                        sender: me
                    })
                },
                header: {
                    left: 'title',
                    center: '',
                    right: 'month agendaWeek listWeek basicWeek agendaDay  today prev,next'
                },
                defaultView: me.settings.defaultView,
                height: "parent"
            });
        });
        operator.div.appendChild(this.rootdiv);
        //Handle item updates
        let updateItemCapacitor = new capacitor(1000, 1000, () => {
            try {
                if (me.container.visible()) $(me.rootdiv).fullCalendar('refetchEvents');
            } catch (e) {
                console.log("JQUERY not ready yet :/");
            }
        }, true);
        this.updateItem = function (id, sender) {
            if (sender == this) return;
            if (!core.items[id][me.settings.dateproperty]) return;
            updateItemCapacitor.submit();
            //Check if item is shown
            //return true or false based on whether we can or cannot edit the item from this operator
            return false;
        }
        core.on("dateUpdate", () => {
            try {
                if (me.container.visible()) $(me.rootdiv).fullCalendar('refetchEvents');
            } catch (e) {
                console.log("JQUERY not ready yet :/");
            }
        });

        core.on("updateItem", (d) => {
            this.updateItem(d.id, d.sender);
        });
        //Handle a change in settings (either from load or from the settings dialog or somewhere else)
        this.processSettings = function () {
            try {
                $(this.rootdiv).fullCalendar('refetchEvents');
                me.fire("updateView");
            } catch (e) {
                console.log("JQUERY not ready yet :/");
            }
            // pull settings and update when your dialog is closed.
            if (this.settings.pushnotifs) {
                this.notify("Notifications enabled!", true);
            }
            if (this.settings.wsOn) {
                this.tryEstablishWS();
            }
            //create window if window option is open.
            if (this.settings.notifWindow) {
                if (!this.notifWindow) {
                    this.notifWindow = window.open("", "__blank", "dependent:on");
                }
            } else {
                //this.notifWindow.close();
                //delete this.notifWindow;
            }
        }
        //every 10 s, check for new notifs!
        this.notifstack = [];
        /*setInterval(() => {
            let ihtml = "";
            for (let i = 0; i < this.notifstack.length; i++) {
                if (Date.now() - this.notifstack[i].time > 0 && Date.now() - this.notifstack[i].time < 20000 && !this.notifstack[i].notified) {
                    if (this.settings.pushnotifs) {
                        this.notify(this.notifstack[i].txt);
                        this.wsnotify(this.notifstack[i].txt);
                        this.notifstack[i].notified = true;
                    }
                }
                if (Date.now() - this.notifstack[i].time > 0 && Date.now() - this.notifstack[i].time < 20000 && !this.notifstack[i].notified) {
                    ihtml += `<p>${this.notifstack[i].txt}</p>`;//within 20 s
                }
            }
            if (this.notifWindow) {
                this.notifWindow.document.body.innerHTML = ihtml;
            }
        }, 10000);*/


        this.tryEstablishWS = function () {
            //close previous ws if open
            if (this.ws) this.ws.close();
            if (this.settings.wsurl) {
                try {
                    this.ws = new WebSocket(this.settings.wsurl);
                    this.ws.onmessage = function (e) {
                        if (me.settings.echoOn) {
                            me.state.output(e.data);
                        }
                        processQuery(e.data);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        }

        this.wsnotify = function (data) {
            if (this.ws) this.ws.send(data);
        }

        this.notify = function (txt, ask) {
            try {
                // Let's check whether notification permissions have already been granted
                if (Notification.permission === "granted") {
                    // If it's okay let's create a notification
                    var notification = new Notification(txt);
                }

                // Otherwise, we need to ask the user for permission
                else if (Notification.permission !== "denied" || ask == true) {
                    Notification.requestPermission().then(function (permission) {
                        // If the user accepts, let's create a notification
                        if (permission === "granted") {
                            var notification = new Notification(txt);
                        } else {
                            console.log("The browser does not support notifications, or notifications were denied. Notifications disabled!");
                            me.settings.pushnotifs = false;
                        }
                    });
                }
            } catch (e) {
                console.log("The browser does not support notifications, or notifications were denied. Notifications disabled!");
                this.settings.pushnotifs = false;
            }
        }

        //Saving and loading
        this.toSaveData = function () {
            this.settings.defaultView = $(this.rootdiv).fullCalendar('getView').name;
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

        let ops = [new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "pushnotifs",
            label: "Show push notifications?"
        }),
        new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "wsOn",
            label: "Send events to a websocket?"
        }),
        new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "wsurl",
            label: "Websocket address"
        }),
        new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "notifWindow",
            label: "Show Notification window"
        })
        ];

        this.dialogDiv.addEventListener("input", function (e) {
            me.settings[e.target.dataset.role] = e.target.value;
        })

        this.showDialog = function () {
            // update your dialog elements with your settings
            ops.forEach((i) => i.load());
        }
        this.dialogUpdateSettings = function () {
            this.processSettings();
        }

        core.on("createItem", (d) => {
            try {
                $(me.rootdiv).fullCalendar('refetchEvents');
            } catch (e) {
                console.log("JQUERY not ready yet :/");
            }
        })

        core.on("deleteItem", (d) => {
            try {
                $(me.rootdiv).fullCalendar('refetchEvents');
            } catch (e) {
                console.log("JQUERY not ready yet :/");
            }
        })

        this.refresh = function () {
            setTimeout(() => {
                try {
                    $(me.rootdiv).fullCalendar('render');
                    $(me.rootdiv).fullCalendar('refetchEvents');
                } catch (err) {
                    console.log("jquery not ready yet :/");
                }
            }, 1000);
        }

    });