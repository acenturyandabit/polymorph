(() => {
    polymorph_core.registerOperator("calendar", {
        displayName: "Calendar",
        description: "A simple calendar. Click on items to select them. (Does not yet support click-to-add but we'll get there one day.)"
    },
        function (container) {
            let defaultSettings = {
                dateproperties: ["datestring"],
                titleproperty: 'title',
                defaultView: "agendaWeek"
            };
            polymorph_core.operatorTemplate.call(this, container, defaultSettings);

            this.rootdiv.style.cssText = 'height:100%; overflow-y: scroll';
            this.cstyle = htmlwrap(`<link rel="stylesheet" type="text/css" href="3pt/fullcalendar.min.css"></link>`)
            // this.cstyle = document.createElement("link");
            // this.cstyle.rel = "stylesheet";
            // this.cstyle.type = "text/css";
            // this.cstyle.href = "3pt/fullcalendar.min.css";
            this.rootdiv.appendChild(this.cstyle);

            $(this.rootdiv).fullCalendar({
                events: (start, end, timezone, callback) => {
                    let allList = [];
                    if (this.settings.pushnotifs) {
                        this.notifstack = [];
                    }
                    let tzd = new Date();
                    for (let i in polymorph_core.items) {
                        let tzd = new Date();
                        try {
                            for (let dp = 0; dp < this.settings.dateproperties.length; dp++) {
                                if (polymorph_core.items[i][this.settings.dateproperties[dp]] && polymorph_core.items[i][this.settings.dateproperties[dp]].date) {
                                    let result = dateParser.getCalendarTimes(polymorph_core.items[i][this.settings.dateproperties[dp]].date, start, end);
                                    for (let j = 0; j < result.length; j++) {
                                        if (polymorph_core.items[i][this.settings.dateproperties[dp]].datestring != "auto now") {
                                            //prevent auto now spam
                                            this.notifstack.push({
                                                txt: polymorph_core.items[i][this.settings.titleproperty],
                                                time: result[j].date
                                            });
                                        }
                                        let isostring = new Date(result[j].date - tzd.getTimezoneOffset() * 60 * 1000 + 1000);
                                        let eisostring;
                                        if (result[j].endDate) eisostring = new Date(result[j].endDate - tzd.getTimezoneOffset() * 60 * 1000 - 1000);
                                        else eisostring = new Date(isostring.getTime() + 60 * 60 * 1000 - 1000);

                                        isostring = isostring.toISOString();
                                        eisostring = eisostring.toISOString();
                                        let col = "";
                                        let bak = "";
                                        if (polymorph_core.items[i].style) {
                                            bak = polymorph_core.items[i].style.background;
                                            col = polymorph_core.items[i].style.color || matchContrast(polymorph_core.items[i].style.background);
                                        }
                                        allList.push({
                                            id: i,
                                            title: polymorph_core.items[i][this.settings.titleproperty],
                                            backgroundColor: bak,
                                            textColor: col,
                                            start: isostring,
                                            end: eisostring
                                        });
                                    }
                                }
                            }
                        } catch (e) {

                        }
                    }
                    callback(allList);
                },
                eventClick: (calEvent, jsEvent, view) => {
                    container.fire("focusItem", {
                        id: calEvent.id,
                        sender: this
                    })
                },
                header: {
                    left: 'title',
                    center: '',
                    right: 'month agendaWeek listWeek basicWeek agendaDay  today prev,next'
                },
                defaultView: this.settings.defaultView,
                height: "parent"
            });

            //Handle item updates
            let updateItemCapacitor = new capacitor(1000, 1000, () => {
                try {
                    if (this.container.visible()) $(this.rootdiv).fullCalendar('refetchEvents');
                } catch (e) {
                    console.log("JQUERY not ready yet :/");
                }
            }, true);

            container.on("dateUpdate", () => {
                try {
                    if (this.container.visible()) $(this.rootdiv).fullCalendar('refetchEvents');
                } catch (e) {
                    console.log("JQUERY not ready yet :/");
                }
            });

            container.on("updateItem", (d) => {
                if (d.sender == this) return;
                if (!polymorph_core.items[d.id][this.settings.dateproperty]) return;
                updateItemCapacitor.submit();
            });

            //Handle a change in settings (either from load or from the settings dialog or somewhere else)
            this.processSettings = () => {
                try {
                    $(this.rootdiv).fullCalendar('refetchEvents');
                    container.fire("updateItem", { id: this.container.id });
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
            setInterval(() => {
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
            }, 10000);


            this.tryEstablishWS = () => {
                //close previous ws if open
                if (this.ws) this.ws.close();
                if (this.settings.wsurl) {
                    try {
                        this.ws = new WebSocket(this.settings.wsurl);
                        this.ws.onmessage = function (e) {
                            if (this.settings.echoOn) {
                                this.state.output(e.data);
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

            this.notify = (txt, ask) => {
                quickNotify(txt, ask, () => {
                    this.settings.pushnotifs = false;
                })
            }

            //Saving and loading
            this.toSaveData = function () {
                this.settings.defaultView = $(this.rootdiv).fullCalendar('getView').name;
            }


            //Handle the settings dialog click!
            this.dialogDiv = document.createElement("div");

            let ops = [
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "text",
                    object: this.settings,
                    property: "titleproperty",
                    label: "Enter the title property:"
                }),
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "array",
                    object: this.settings,
                    property: "dateproperties",
                    label: "Enter the title property:"
                }),
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "bool",
                    object: this.settings,
                    property: "pushnotifs",
                    label: "Show push notifications?"
                }),
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "bool",
                    object: this.settings,
                    property: "wsOn",
                    label: "Send events to a websocket?"
                }),
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "text",
                    object: this.settings,
                    property: "wsurl",
                    label: "Websocket address"
                }),
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "bool",
                    object: this.settings,
                    property: "notifWindow",
                    label: "Show Notification window"
                })
            ];

            this.showDialog = function () {
                // update your dialog elements with your settings
                ops.forEach((i) => i.load());
            }
            this.dialogUpdateSettings = function () {
                this.processSettings();
            }

            this.refresh = () => {
                setTimeout(() => {
                    try {
                        $(this.rootdiv).fullCalendar('render');
                        $(this.rootdiv).fullCalendar('refetchEvents');
                    } catch (err) {
                        console.log("jquery not ready yet :/");
                    }
                }, 1000);
            }

            this.processSettings();

        });
})();