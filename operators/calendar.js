core.registerOperator("calendar", function (operator) {
    let me = this;
    this.settings = {
        dateproperty: "datestring",
        dateRetrieval: "rDate", // "mDate", //"sDate", // now second iteration of date. Change to sdate to fallback to old version.
        titleproperty: 'title'
    }; // Use my date retrieval format. (others not implented yet lm.ao)

    this.rootdiv = document.createElement("div");
    this.rootdiv.innerHTML = ``;
    this.cstyle=document.createElement("link");
    this.cstyle.rel="stylesheet";
    this.cstyle.type="text/css";
    this.cstyle.href="3pt/fullcalendar.min.css";
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
                                    let isostring = new Date(result[j].date - tzd.getTimezoneOffset() * 60 * 1000+1000);
                                    let eisostring;
                                    if (result[j].endDate) eisostring = new Date(result[j].endDate - tzd.getTimezoneOffset() * 60 * 1000-1000);
                                    else eisostring = new Date(isostring.getTime() + 60 * 60 * 1000-1000);
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
            defaultView: "agendaWeek",
            height: "parent"
        });
    });
    operator.div.appendChild(this.rootdiv);
    //Handle item updates
    this.updateItem = function (id, sender) {
        if (sender == this) return;
        try {
            $(me.rootdiv).fullCalendar('refetchEvents');
        } catch (e) {
            console.log("JQUERY not ready yet :/");
        }
        //Check if item is shown
        //Update item if relevant
    }
    core.on("dateUpdate", this.updateItem);
    //Handle a change in settings (either from load or from the settings dialog or somewhere else)
    this.processSettings = function () {
        try {
            $(this.rootdiv).fullCalendar('refetchEvents');
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
            <input data-role='dateproperty' placeholder="Enter the date property">
            <input data-role='titleproperty' placeholder="Enter the property for calendar item names.">
        `;
        me.innerDialog.addEventListener("input", function (e) {
            me.settings[e.target.dataset.role] = e.target.value;
        })
        me.innerDialog.appendChild(d);

        //When the dialog is closed, update the settings.
        me.dialog.querySelector(".cb").addEventListener("click", function () {
            me.updateSettings();
        })

        me.showSettings = function () {
            me.dialog.style.display = "block";
        }
    })

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

    this.resize=function(){
        try{
        $(me.rootdiv).fullCalendar('render');
        }catch(err){
            console.log("jquery not ready yet :/");
        }
    }

});