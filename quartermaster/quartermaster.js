function _quarterMaster() {
    let me = this;
    this.items = {};
    this.trashes = {};
    //----------Event API + misc functions----------//
    addEventAPI(this);
    //file external stuff!
    addDateSorter(this);

    //////////////////Component managers//////////////////
    this.taskDescriptionManager = new _taskDescriptionManager(this);

    this.guid = function () {
        let pool = "1234567890qwertyuiopasdfghjklzxcvbnm";
        tguid = "";
        for (i = 0; i < 4; i++) tguid += pool[Math.floor(Math.random() * pool.length)];
        return tguid;
    }

    this.pwaManager = new _pwaManager();

    //----------UI libraries----------//
    this.topbarManager = new _topbarManager();
    this.filescreen = new _filescreen({
        onlineEnabled: false,
        documentQueryKeyword: "list",
        tutorialEnabled: false,
        savePrefix: "quartermaster"
    });
    this.dialogManager = new _dialogManager();


    //----------DOM insertion----------//

    me.div = document.createElement("div");
    me.div.innerHTML = `
    <style>
    .taskList span.selected {
        border-top: 3px solid purple;
        border-bottom: 3px solid purple;
    }
    body{
        overflow:hidden;
    }
</style>
<div style="display:flex; flex-direction:column; height: 100%;">
    <ul class="topbar">
        <li class="noHover listName">Quartermaster</li>
        <li>
            File
            <ul>
                <li>Save</li>
                <li>Export to JSON</li>
                <li>Toggle Autosave</li>
            </ul>
        </li>
        <li>
            Edit
            <ul class="list">
                <li class="delist">Deleted tasks</li>
            </ul>
        </li>
        <li class="addins">
            Addins
        </li>
    </ul>

    <div style="    flex: 0 0 50vh;
    display: flex;
    flex-direction: row;">
        <div class="taskListBar" style="flex: 1 0 auto;
        display: flex;
        flex-direction: column;
        overflow-y: scroll;">
            <span style="display:block">
                <span class="ids" style="display: inline-block;width: 60px;">ID:<span data-role='id'>none</span></span>
                <input data-role="name" placeholder="Task name" />
                <input data-role="tags" placeholder="Tags" />
                <input data-role="date" placeholder="Date" />
                <button class="remove">&gt;</button>
            </span>
            <hr />
            <div class="taskList">
            </div>
        </div>
        <div style="flex: 1 1 100%;">
            <div class="descbox"></div>
        </div>
    </div>
    <div style="flex: 1 0 auto;">
        <div id="calendarView">
        </div>
    </div>
</div>
<div class="dialog deletedTasks">
    <h3>Deleted tasks</h3>
    <p>Press the R button to restore the task.</p>
    <div class="trashList"></div>
</div>
`;

    me.topbarManager.checkTopbars(me.div);
    me.dialogManager.checkDialogs(me.div);
    bindDOM(me, me.div.querySelector(".topbar .listName a"), "id");
    me.title = document.createElement("title");
    document.head.appendChild(me.title);
    me.taskList = me.div.querySelector(".taskList");
    me.template = me.div.querySelector(".taskListBar>span");
    me.descbox = me.div.querySelector(".descbox");
    me.trashList = me.div.querySelector(".trashList");
    document.addEventListener("DOMContentLoaded", function () {
        me.registerNewItemEvent();
        document.body.append(me.div);
        //Calendar
        $("#calendarView").fullCalendar({
            events: (start, end, timezone, callback) => {
                let allList = [];
                let tzd = new Date();
                for (i in me.items) {
                    if (me.items[i].dates && me.items[i].dates.length) {
                        thisdate = me.items[i].dates[0].date;
                        let isostring = new Date(Number(thisdate) - tzd.getTimezoneOffset() * 60 * 1000);
                        let eisostring;
                        if (me.items[i].dates[0].end) eisostring = new Date(Number(me.items[i].dates[0].end) - tzd.getTimezoneOffset() * 60 * 1000);
                        else eisostring = new Date(isostring.getTime() + 60 * 60 * 1000);
                        isostring = isostring.toISOString();
                        eisostring = eisostring.toISOString();
                        allList.push({
                            id: i,
                            title: me.items[i].name,
                            //backgroundColor: $(e).find("input")[0].style.backgroundColor,
                            //textColor: $(e).find("input")[0].style.color || "black",
                            start: isostring,
                            end: eisostring
                        });
                    }
                }
                callback(allList);
            },
            defaultView: "agendaWeek",
            height: "parent"
        });
        me.firebaseDoc = undefined;
        me.fireman = new _fireman({
            documentQueryKeyword: "list",
            offlineKeyword: "offline",
            blank: function () {
                me.filescreen.showSplash();
            },
            load: (doc, id) => {
                me.filescreen.saveRecentDocument(id, false);
                //hide local stuff
                //TODO: fix this for switching between different files? 
                let style = document.createElement("style");
                style.innerHTML = `
            .oLocalOnly{
                display:none;
            }
            `;
                document.head.appendChild(style);
                doc.onSnapshot(shot => {
                    me.loadFromStaticData(shot.data());
                })

                me.firebaseDoc = doc;
                me.id = id;
                me.doc.collection('items').onSnapshot(shot => {
                    shot.docChanges().forEach(function (change) {
                        if (change.doc.metadata.hasPendingWrites) return; //dont update on local changes.
                        if (change.type == "added") {
                            me.loadSingleListItem(change.doc.id, change.doc.data());
                        } else if (change.type == "removed") {
                            me.removeItem(change.doc.id);
                        } else if (change.type == "modified") {
                            me.loadSingleListItem(change.doc.id, change.doc.data());
                        }
                    });
                });
                //TODO: update items on change
            },
            autocreate: true,
            makeNewDocument: (doc, id) => {
                doc.update({
                    name: id
                });
                me.fireman.settings.load(doc, id);
            },
            passwall: true,
            autopass: true,
            offlineLoad: (id) => {
                me.filescreen.saveRecentDocument(id);
                me.id = id;
                localforage.getItem(me.id).then((d) => {
                    if (d) me.loadFromStaticData(d);
                });
                //TODO: some means of retrieving by ID
                /*
                 */
            },
            config: {
                apiKey: "AIzaSyA-sH4oDS4FNyaKX48PSpb1kboGxZsw9BQ",
                authDomain: "backbits-567dd.firebaseapp.com",
                databaseURL: "https://backbits-567dd.firebaseio.com",
                projectId: "backbits-567dd",
                storageBucket: "backbits-567dd.appspot.com",
                messagingSenderId: "894862693076"
            },
            generateDoc: function (db, id) {
                return db.collection("quartermaster").doc(id);
            }
        });
    })
    //////////////////Loading options//////////////////
    //----------Firebase----------//


    ///////////////////Actual loading//////////////////
    this.loadFromStaticData = function (data) {
        //unload everything.
        for (i in me.items) {
            me.items[i].remove();
            delete(me.items[i]);
        }
        me.fire('load', data);
        // given an object, load it.
        me.title.innerText = data.name;
        for (i in data.items) {
            me.loadSingleListItem(i, data.items[i]);
        }

        /*if (data && Object.keys(data).length > 0) $("#nothingLeft").hide();
        else {
            $("#nothingLeft").show()
        }*/
        me.sort();
        $("#calendarView").fullCalendar('refetchEvents');
        $("#calendarView").fullCalendar('render');
        me.fire('loaded', data);
    }

    this.loadSingleListItem = function (id, data) {
        //Ensure to check if item already exists. Otherwise leave it to the item itself.
        if (id && me.items[id]) {
            me.items[id].loadFromData(data);
        } else {
            if (!id) id = me.guid();
            me.items[id] = new listItem(me, id, data);
        }
        return me.items[id];
    }

    //----------More item manipulation----------//
    this.trashItem = function (id) {
        me.items[id].trash();
        me.fire("trashTask", me.items[id]);
        me.trashes[id] = me.items[id];
        delete me.items[id];
    }

    this.restoreItem = function (id) {
        me.trashes[id].restore();
        me.fire("restoreTask", me.trashes[id]);
        me.items[id] = me.trashes[id];
        delete me.trashes[id];
    }

    //----------UI item creation----------//
    this.registerNewItemEvent = function () {
        me.template.addEventListener("keydown", function (e) {
            if (e.key == "Enter") {
                let data = {
                    name: me.template.querySelector("[data-role='name']").value,
                    tags: me.template.querySelector("[data-role='tags']").value,
                    dateString: me.template.querySelector("[data-role='date']").value
                }
                let newItem = me.loadSingleListItem(undefined, data);
                me.fire("newTask", data);
                //Also clear the values
                me.template.querySelector("[data-role='name']").value = "";
                me.template.querySelector("[data-role='tags']").value = "";
                me.template.querySelector("[data-role='date']").value = "";
                //and sort everything
                me.dateParse(newItem);
                me.sort();
                newItem.span.scrollIntoViewIfNeeded();
                newItem.span.querySelector("input").focus();
            }
        })
        //----------UI item removal----------//
        me.taskList.addEventListener("click", function (e) {
            if (e.target.matches("button")) {
                me.trashItem(e.target.parentElement.querySelector("[data-role='id']").innerText);
            }
        })

        me.div.querySelector("ul.topbar li.delist").addEventListener("click", (e) => {
            me.div.querySelector(".dialog.deletedTasks").style.display = "block";
        });

        //----------UI item restoration----------//
        me.trashList.addEventListener("click", function (e) {
            if (e.target.matches("button")) {
                me.restoreItem(e.target.parentElement.querySelector("[data-role='id']").innerText);
            }
        })

        //----------Date changing (delegated for efficiency)----------//
        me.taskList.addEventListener("keyup", function (e) {
            if (e.key == "Enter") {
                if (e.target.matches("[data-role='date']")) {
                    me.dateParse(me.items[e.target.parentElement.querySelector("[data-role='id']").innerText]);
                    me.sort();
                }
            }
        })

        //----------Element changed fire event (delegated for efficiency)----------//
        me.taskList.addEventListener("keyup", function (e) {
            if (e.target.matches("[data-role]")) {
                me.fire("change", me.items[e.target.parentElement.querySelector("[data-role='id']").innerText]);
            }
        })
        //////////////////Focus (delegated for efficiency)//////////////////
        me.taskList.addEventListener("focusin", function (e) {
            if (e.target.tagName.toLowerCase() == "input") {
                for (let i in me.items) me.items[i].defocus();
                me.items[e.target.parentElement.querySelector("[data-role='id']").innerText].focus();
            }
        })
        //----------Focus on topbar----------//
        me.template.addEventListener("focusin", function (e) {
            for (i in me.items) {
                me.items[i].defocus();
            }
        })
    }
    ///////////////////Save//////////////////
    this.toSaveData = function () {
        let obj = {};
        obj.items = {};
        for (i in me.items) {
            obj.items[i] = me.items[i].toSaveData();
        }
        return obj;
    }

    this.saveToBrowser = function () {
        let data = me.toSaveData();
        me.fire("save", data);
        localforage.setItem(me.id, data);
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.body.addEventListener("keydown", (e) => {
            if (e.key == "s" && e.ctrlKey) {
                me.saveToBrowser();
                e.preventDefault();
            }
        });
    });

    //////////////////Addins//////////////////
    this.addinManager = new _addinManager({
        savePrefix: "quarterMaster"
    });
    me.addinDialog = document.createElement("div");
    me.addinDialog.classList.add("addins");
    me.addinDialog.classList.add("dialog");
    me.addinDialog.appendChild(me.addinManager.div);
    me.div.appendChild(me.addinDialog);
    me.dialogManager.checkDialogs(me.div);
    me.addinDialog = me.div.querySelector(".addins.dialog");

    me.addinMenuButton = me.div.querySelector(".topbar .addins");
    me.addinMenuButton.addEventListener("click", () => {
        me.addinDialog.style.display = "block";
    });
}











var quarterMaster = new _quarterMaster();