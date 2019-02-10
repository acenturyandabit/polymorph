(function () {
    /*Change these settings*/
    let thisName="synergist";
    let scripts=`
    <script src="https://www.gstatic.com/firebasejs/5.5.5/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/5.5.5/firebase-firestore.js"></script>
    <script src="resources/jquery.min.js"></script>
    <script src="resources/jscolor.js"></script>
    <script src="resources/dialog.js"></script>
    <script src="resources/topbar.js"></script>
    <script src="resources/contextMenu.js"></script>
    <script src="resources/fireman.js"></script>
    <script src="resources/filescreen.js"></script>
    <script src="resources/quill.min.js"></script>
    <link href="resources/quill.bubble.css" rel="stylesheet">
    <script src="floatingItem.js"></script>
    <script src="viewcore.js"></script>
    <script src="floatingItemCore.js"></script>
    <script src="synergist.js"></script>
    <script src="loader.js"></script>
    <link rel="stylesheet" type="text/css" href="synergist.css" />
    `;
    /*ok stop */



    operators[thisName] = {
        init: function (room,core) {
            //Assert that the other scripts are in place
            function _continue(){
                return new object(room,core);
            }
            if (operators[thisName].preloaded){
                chainload(scripts,_continue);
            }else{
                _continue();
            }
        },
        object: function(room,core){
            /*PUT YOUR CODE HERE*/
        }
    }
})();



function _synergistView(room, core) {
    let div = room.div;
    this.items = core.items; //sik pointer
    let self = this;
    this.maxZ = 0;
    this.localSavePrefix = "";
    // all the html stuff; brackets so you can hide it in an ide
    this.makeHTML = function () {
        $(div).html(`
        <link rel="stylesheet" href="/_synergist/synergist.css" type="text/css"></link>
    <div class="synergist-container" >
        <div class="synergist-banner" >
            <h1 contentEditable>Pad name</h1>
            <ul class="topbar">
                <li class="noHover"> <a>View:</a></li>
                <li>
                    <a class="viewNameContainer"><span><span contenteditable class="viewName" data-listname='main'style="cursor:text"></span><span class="listDrop">&#x25BC</span>
                    </span><img class="gears" src="resources/gear.png"></a>
                    <div class="viewNameDrop" style="display:none">
                    </div>
                </li>
                <li class="plusbutton"><a>More</a></li>
                <li class="helpButton"><a>Help</a>
                    <div>
                    <a href="?tute" target="blank">View tutorial...</a>
                    <a href="https://github.com/acenturyandabit/synergist/issues" target="blank">Request a feature...</a>
                    </div>
                </li>
            </ul>
        </div>
        <div class="synergist">
        <div class="backwall">
        <span class="leftLabelContainer"><span class="phoneNoShow"><<</span><span class="leftLabel" contentEditable></span></span>
        <span class="rightLabelContainer"><span class="rightLabel" contentEditable></span><span class="phoneNoShow">>>></span></span>
        </div>
        <div class="dialog backOptionsMenu">
            <h2>Options</h2>
            <p>View type:<select class="viewType">
            <option value="blank">Blank</option>
            <option value="singleAxis">Single Axis</option>
            <!--<option value="doubleAxis">Double Axis</option>-->
            
            </select> </p>
        </div>
        <div class="dialog moreMenu">
            <h2>More options</h2>
            <section class="wsm">
                <h3>Weighted scoring matrix</h3>
                <button>Generate weighted scoring matrix</button>
            </section>
        </div>
        <div class="bottomDrawer specialScroll"></div>
        </div>
    </div>
    <div class="floatingSetupMenu" style="display:none; position:absolute;">
        <span>Background:<input class="jscolor backcolor" onchange="fireman.thing.backColorUpdateReceived(this.jscolor)" value="ffffff"></span>
        <span>Text:<input class="jscolor forecolor" onchange="fireman.thing.foreColorUpdateReceived(this.jscolor)" value="ffffff"></span>
    </div>
    `);
        dialogManager.checkDialogs();
    }
    this.makeHTML();
    // Title w/ mutation observer!
    $("head").append(`<title>Loading Synergist...</title>`);
    //Install JScolor
    window.jscolor.installByClassName("jscolor");
    this.basediv = $(div).find(".synergist")[0];
    this.currentView = "main";

    //initalise interactions
    startViewCore(self);
    startFloatingItemCore(self);

    //----------Loading----------//

    this.toSaveData = function () {
        obj = {};
        obj.views = this.views;
        obj.items = Object.keys(this.items).map((i) => {
            return this.items[i].toObject()
        });
        obj.name = $(".synergist-banner h1")[0].innerText;
        return obj;
    }

    this.loadFromData = function (d) {
        //clear everything
        this.views = {};
        this.items = {};
        $(this.basediv).find(".floatingItem").remove();
        //load everything
        $(".synergist-banner h1").text(d.name);
        $("title").text(d.name + " - Synergist");
        for (i in d.views) {
            this.makeNewView(i, d.views[i]);
        }
        for (i in d.items) {
            this.makeNewItem(i, d.items[i]);
        }
        this.switchView("main"); //all docs are guarunteed to have a main riiight???
    }

    ///control-S to save
    $("body").on("keydown", (e) => {
        if (e.ctrlKey && e.key == "s") {
            window.localStorage.setItem("synergist_data_" + this.localSavePrefix, JSON.stringify(this.toSaveData()));
            e.preventDefault();
        }
        if (e.ctrlKey && e.key == "o") {
            this.tryLocalLoad();
            e.preventDefault();
        }
    })

    this.offlineLoad = function (name) {
        this.localSavePrefix = name;
        let itm = JSON.parse(window.localStorage.getItem("synergist_data_" + this.localSavePrefix));
        if (itm) this.loadFromData(itm);
        else {
            $(".synergist-banner h1").text(name);
            $("title").text(name + " - Synergist");
        }
    }
    //----------Web based loading----------//
    this.firebaseEnabled = false;

    this.firebaseLoadContinue = function (doc) {
        let _syn = this;
        doc.onSnapshot(shot => {
            let d = shot.data();
            //d contains name only.
            if (!d) {
                $(".synergist-banner h1").text(_syn.localSavePrefix);
                $("title").text(syn.localSavePrefix + " - Synergist");
                return;
            }
            if (!shot.metadata.hasPendingWrites) $(".synergist-banner h1").text(d.name);
            $("title").text(d.name + " - Synergist");
        })
        //collection for items
        this.itemCollection = doc.collection("items");
        this.itemCollection.onSnapshot(shot => {
            shot.docChanges().forEach((c) => {
                if (c.doc.metadata.hasPendingWrites) return;
                switch (c.type) {
                    case "added":
                        self.makeNewItem(c.doc.id, c.doc.data());
                        break;
                    case "modified":
                        self.items[c.doc.id].remoteUpdate(c.doc.data())
                        break;
                    case "removed":
                        self.removeItem(c.doc.id, true);
                }
            })
        })
        this.viewCollection = doc.collection("views");
        this.firstRun = true;
        this.viewCollection.onSnapshot(shot => {
            shot.docChanges().forEach((c) => {
                if (c.doc.metadata.hasPendingWrites) return;
                switch (c.type) {
                    case "added":
                        self.makeNewView(c.doc.id, c.doc.data(), true);
                        break;
                    case "modified":
                        self.views[c.doc.id] = c.doc.data();
                        if (self.currentView == c.doc.id) self.switchView(c.doc.id);
                        break;
                    case "removed":
                        self.removeItem(c.doc.id, true);
                }
            })
            if (self.firstRun) {
                self.firstRun = false;
                self.switchView("main");
            }
        })
    }

    this.registerFirebaseDoc = function (doc, name) {
        this.localSavePrefix = name;
        //show the cover
        //clear everything
        this.views = {};
        this.items = {};
        //start firebase
        this.firebaseEnabled = true;
        this.firebaseDoc = doc;
        doc.get().then(d => {
            if (!d.exists || !(d.data().name)) {
                doc.update({
                    name: self.localSavePrefix
                });
                let firstView = {
                    name: "Main",
                    left: "Less favourable",
                    right: "More favourable"
                }
                doc.collection("views").doc("main").set(firstView);
                self.makeNewView("main", firstView);
            }
            self.firebaseLoadContinue(doc);
        })
    }

    //----------Title changes----------//
    $(".synergist-banner h1").on("keyup", () => {
        if (this.firebaseEnabled) {
            this.firebaseDoc.update({
                name: $(".synergist-banner h1").text()
            });
        }
        $("title").text($(".synergist-banner h1").text() + " - Synergist");
    })



    //----------touch api----------//
    $(".fab").on("click", (e) => {
        new_guid = guid();
        this.makeNewItem(new_guid, e);
    })


    //////////////////More button//////////////////
    $(".plusbutton").on("click", () => {
        $(".moreMenu").show();
    });

    $(".wsm button").on("click", () => {
        //generate the wsm
        let wsm = {};
        let axes = [];
        for (v in this.views) {
            if (this.views[v].type == "singleAxis") {
                axes.push(v);
                for (i in this.items) {
                    if (!this.items[i].viewData[v].hidden) {
                        //add its x value to the WSM
                        if (!wsm[i]) wsm[i] = {};
                        wsm[i][v] = this.items[i].viewData[v].x.toFixed(2);
                    } else {
                        wsm[i][v] = "";
                    }
                }
            }
        }
        //Open a new page with a WSM
        w = window.open('', '_blank');
        w.document.write(`
        <style>
        table, tr, th, td{
            border-collapse:collapse;
            border: 1px solid;
        }
        </style>
        <table>
        <tbody>
        </tbody>
        </table>
        `);
        // add the header
        headerRow = "<tr><th></th>";
        for (axis = 0; axis < axes.length; axis++) {
            headerRow += "<th>" + axes[axis] + "</th>";
        }
        headerRow += "</tr>";
        $(w.document.body).find("tbody").append(headerRow);
        for (i in wsm) {
            itemRow = "<tr><td>" + this.items[i].toObject().title + "</td>";
            for (axis in wsm[i]) {
                itemRow += "<td>" + wsm[i][axis] + "</td>";
            }
            itemRow += "</tr>";
            $(w.document.body).find("tbody").append(itemRow);
        }

    })


    //----------Misc UI shenanigans----------//

    $("body").on("keydown", "h1,h1 *,h2,h2 *,h3,h3 *", (e) => {
        if (e.target.contentEditable && e.key == "Enter") e.preventDefault();
    })

    $(this.basediv).on("mousedown", (e) => {
        if (!$(e.target).is(".floatingSetupMenu *")) $(".floatingSetupMenu").hide();
    });

    $('.specialScroll').bind('mousewheel', function (e) {
        if (e.target != e.currentTarget) return;
        var delta = e.originalEvent.deltaY;
        if (delta == 0 || delta == -0) delta = e.originalEvent.deltaX;
        e.currentTarget.scrollLeft += delta / 5;
    });

    //----------Final initialisation stuff to idk kinda look pretty----------//
    this.makeNewView("main");
    this.views["main"].name = "Main";
    this.switchView("main");
    //----------tutorial----------//
    this.registerTutorial = function () {
        $(".floatingItem[data-id='13'] p").on("click", () => {
            window.location.href = window.location.href.replace("&tute", "").replace("?tute", "?");
        })
    }
}