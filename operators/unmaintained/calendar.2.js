core.registerOperator("calendar2", {
        displayName: "Calendar v2",
        description: "A simple calendar, courtesy of fullcalendar.js."
    },
    function (container) {
        let me = this;
        me.container = container;
        this.settings = {
            dateproperty: "datestring",
            dateRetrieval: "rDate", // "mDate", //"sDate", // now second iteration of date. Change to sdate to fallback to old version.
            titleproperty: 'title',
            operationMode: undefined
        }; // Use my date retrieval format. (others not implented yet lm.ao)

        this.rootdiv = document.createElement("div");
        this.rootdiv.innerHTML = ``;
        this.rootdiv.style.cssText = 'height:100%; overflow-y: scroll';
        this.rootdiv.appendChild(htmlwrap(`<link rel="stylesheet" type="text/css" href="3pt/fullcalendar/core/main.css">`));
        this.rootdiv.appendChild(htmlwrap(`<link rel="stylesheet" type="text/css" href="3pt/fullcalendar/daygrid/main.css">`));
        this.rootdiv.appendChild(htmlwrap(`<link rel="stylesheet" type="text/css" href="3pt/fullcalendar/timegrid/main.css">`));
        this.rootdiv.appendChild(htmlwrap(`<link rel="stylesheet" type="text/css" href="3pt/fullcalendar/list/main.css">`));
        //Add div HTML here
        scriptassert([
            ['fcal_core', '3pt/fullcalendar/core/main.js'],
            ['fcal_daygrid', '3pt/fullcalendar/daygrid/main.js'],
            ['fcal_timegrid', '3pt/fullcalendar/timegrid/main.js'],
            ['fcal_list', '3pt/fullcalendar/list/main.js'],
        ], () => {
            this.calendar = new FullCalendar.Calendar(this.rootdiv,{
                plugins:['dayGrid','timeGrid','list'],
                events: (fetchinfo, callback, failure) => {
                    let start=fetchinfo.start;
                    let end=fetchinfo.end;
                    let timezone=fetchinfo.timezone;
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
                                        start: isostring,
                                        end: eisostring
                                    });
                                } catch (e) {

                                }
                            } else if (me.settings.dateRetrieval == 'rDate') {
                                try {
                                    let result = dateParser.getCalendarTimes(core.items[i][me.settings.dateproperty].date, start, end);
                                    for (let j = 0; j < result.length; j++) {
                                        if (me.settings.pushnotifs) {
                                            me.notifstack.push({
                                                txt: core.items[i][me.settings.titleproperty],
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
                    container.fire("focus", {
                        id: calEvent.id,
                        sender: me
                    })
                },
                header: {
                    left: 'title',
                    center: '',
                    right: 'dayGridMonth timeGridWeek timeGridDay list today prev,next'
                },
                defaultView: "dayGridMonth",
                height: "parent"
            });
            this.calendar.refetchEvents();
            this.calendar.render();
        });
        container.div.appendChild(this.rootdiv);
        //Handle item updates
        let updateItemCapacitor=new capacitor(1000,1000,()=>{
            try {
                if (me.container.visible()){
                    me.calendar.render();
                    me.calendar.refetchEvents();
                }
            } catch (e) {
                console.log(e);
            }
        },true);
        this.updateItem = function (id, sender) {
            if (sender == this) return;
            if (!core.items[id][me.settings.dateproperty]) return;
            updateItemCapacitor.submit();
            //Check if item is shown
            //return true or false based on whether we can or cannot edit the item from this container
            return false;
        }
        container.on("dateUpdate", () => {
            try {
                if (me.container.visible())updateItemCapacitor.submit();
            } catch (e) {
                console.log(e);
            }
        });
        
        container.on("updateItem", (d) => {
            this.updateItem(d.id, d.sender);
        });
        //Handle a change in settings (either from load or from the settings dialog or somewhere else)
        this.processSettings = function () {
            try {
                updateItemCapacitor.submit();
                me.fire("updateView");
            } catch (e) {
                console.log(e);
            }
            // pull settings and update when your dialog is closed.
            if (this.settings.pushnotifs) {
                this.notify("Notifications enabled!", true);
            }
            if (this.settings.wsOn) {
                this.tryEstablishWS();
            }
        }
        //every 10 s, check for new notifs!
        this.notifstack = [];
        setInterval(() => {
            for (let i = 0; i < this.notifstack.length; i++) {
                if (Date.now() - this.notifstack[i].time > 0 && Date.now() - this.notifstack[i].time < 20000) {
                    this.notify(this.notifstack[i].txt);
                    this.wsnotify(this.notifstack[i].txt);
                    this.notifstack.splice(i, 1);
                    i--;
                }
            }
        }, 10000);


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

        container.on("createItem", (d) => {
            try {
                updateItemCapacitor.submit();
            } catch (e) {
                console.log(e);
            }
        })

        container.on("deleteItem", (d) => {
            try {
                updateItemCapacitor.submit();
            } catch (e) {
                console.log(e);
            }
        })

        this.refresh = function () {
            setTimeout(() => {
                try {
                    updateItemCapacitor.submit();
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        }

    });