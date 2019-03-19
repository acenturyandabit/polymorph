/*

*/

function _item() {
  this.title = "";
  this.toSaveData = function () {
    return JSON.parse(JSON.stringify(this)); //remove all methods and return the object.
  };
  this.fromSaveData = function (item) {
    Object.assign(this, item);
  };
}

function _core() {
  //Event API. pretty important, it turns out.
  addEventAPI(this);
  let me = this;
  this.resetDefaultSettings = function () {
    this.settings = {
      /* Either local or firebase or server */
      displayName: me.docName || ""
    };
    if (this.firebase && this.firebase.unsub) {
      let saveobj = {};
      saveobj.settings = this.settings;
      this.firebase.db
        .collection("polymorph")
        .doc(docname)
        .update(saveobj);
    }
  };
  this.resetDefaultSettings();
  //Instantiate filemanager
  this.filescreen = new _filescreen({
    prompt: "Welcome to Polymorph.",
    formats: [{
        prompt: "Make a new local (offline) document"
      },
      {
        prompt: "Make a new shared (online) document",
        queryParam: "online"
      }
    ],
    tutorialEnabled: false,
    savePrefix: "polymorph"
  });

  this.updateSettings = function () {
    document.body.querySelector(
      ".docName"
    ).innerText = this.settings.displayName;
    document.querySelector("title").innerHTML =
      this.settings.displayName + " - Polymorph";
  };

  function localLoad(id, online) {
    me.filescreen.saveRecentDocument(id);
    me.docName = id; // for all user save data. that got real important real quick :/
    if (!me.userData[id] || !me.userData[id].primarySaveSource) me.userData[id] = {
      currentView: "default",
      primarySaveSource: "local"
    };
    me.userCurrentDoc = me.userData[id];
    //PUT ADDITIONAL QUERY HANDLING HERE: OPTIONS, VIEWS
    let params = new URLSearchParams(window.location.search);
    if (params.has("online")) {
      me.userCurrentDoc.firebaseDocName = id;
      me.userCurrentDoc.primarySaveSource = "firebase";
    }
    if (params.has("view")) {
      me.userCurrentDoc.currentView = params.get("view");
    } else if (!me.userCurrentDoc.currentView) me.userCurrentDoc.currentView = "default";
    me.saveUserData();

    localforage.getItem("__polymorph_" + id).then(d => {
      if (!d) {
        d = {
          settings: {
            displayName: id
          }
        };
      }
      me.fromSaveData(d, "first");
    });
  }

  //retrieve local user data
  this.saveUserData = function () {
    localStorage.setItem("userData", JSON.stringify(me.userData));
  };
  me.userData = localStorage.getItem("userData");
  if (!me.userData) {
    me.userData = {};
    me.saveUserData();
  } else {
    me.userData = JSON.parse(me.userData);
  }

  this.targeter = undefined;
  this.submitTarget=function(id){
    if (me.targeter){
      me.targeter(id);//resolves promise
      me.targeter=undefined;
      //untarget everything
      me.baseRect.deactivateTargets();
    }
  }
  this.target = function () {
    // activate targeting
    me.baseRect.activateTargets();
    let promise = new Promise((resolve) => {
      me.targeter = resolve;
    })
    return promise;
  }
  //use:
  /*
  core.target().then(senderID){

  }

  */

  this.queryLoader = new _queryLoader({
    loaders: [{
      f: function (id) {
        localLoad(id);
      }
    }, ],
    blank: function () {
      me.filescreen.showSplash();
    }
  });

  //items
  this.items = {};
  this.operators = {};
  this.operatorLoadCallbacks = {};
  this.registerOperator = function (type, options, _constructor) {
    if (_constructor) {
      this.operators[type] = {
        constructor: _constructor,
        options: options
      };
    } else {
      this.operators[type] = {
        constructor: options,
        options: {}
      };
    }
    me.fire("operatorAdded", {
      type: type
    });
    for (let i = 0; i < this.operatorLoadCallbacks[type]; i++) {
      this.operatorLoadCallbacks[type][i].op.load(
        this.operatorLoadCallbacks[type][i].data
      );
    }
  };
  //live operators
  document.addEventListener(
    "DOMContentLoaded",
    () =>
    (me.baseRect = new _rect(
      me,
      document.body.querySelector(".rectspace"),
      RECT_ORIENTATION_X,
      0,
      1
    ))
  );
  this.insertItem = function (itm) {
    let nuid;
    do {
      nuid = guid();
    } while (this.items[nuid]);
    this.items[nuid] = itm;
    return nuid;
  };

  this.toSaveData = function () {
    let obj = {};
    // recursively save the rect object
    if (me.views) obj.views = me.views;
    else obj.views = {};
    obj.views[me.userCurrentDoc.currentView] = this.baseRect.toSaveData();
    obj.settings = this.settings;
    // save all items
    obj.items = {};
    for (let i in this.items) {
      obj.items[i] = this.items[i].toSaveData();
    }
    return obj;
  };

  this.presentView = function (view) {
    //reset and present a view
    document.body.querySelector(".rectspace").innerHTML = "";
    //Regenerate rects
    this.baseRect = new _rect(
      this,
      document.body.querySelector(".rectspace"),
      RECT_ORIENTATION_X,
      0,
      1
    );
    this.baseRect.fromSaveData(me.views[view]);
    //set user's current view
    me.userCurrentDoc.currentView = view;
    me.saveUserData();
  };

  this.directLoadFromSaveData = function (obj) {
    //copy in objects
    for (let i in obj.items) {
      this.items[i] = new _item();
      this.items[i].fromSaveData(obj.items[i]);
    }
    //copy in views
    if (obj.rect || !obj.views) {
      obj.views = {};
      if (obj.rect) obj.views[me.userCurrentDoc.currentView] = obj.rect;
      else {
        obj.views[me.userCurrentDoc.currentView] = {};
      }
    } else {
      if (!obj.views[me.userCurrentDoc.currentView]) {
        me.userCurrentDoc.currentView = Object.keys(obj.views)[0];
      }
    }
    //copy in views
    me.views = obj.views;
    me.saveUserData();
    this.presentView(me.userCurrentDoc.currentView);
    for (let i in obj.items) {
      this.fire("updateItem", {
        id: i
      });
    }
  };

  this.fromSaveData = function (obj, loadType) {
    //dont wipe and regen everything twice if we're doing a first load
    if (loadType != "first") {
      //Regenerate items
      this.items = {};
    }
    //copy over the settings
    this.resetDefaultSettings();
    if (this.settings) {
      Object.assign(this.settings, obj.settings);
    }
    this.updateSettings();
    switch (loadType) {
      case "first":
        //this is the first load, redo the load with another source
        this.fromSaveData(obj, me.userCurrentDoc.primarySaveSource);
        break;
      case "local":
        //just pass the existing object
        this.directLoadFromSaveData(obj);
        break;
      case "firebase":
        //activate the firebase listener
        // Create or load a default view (firebase will overwrite)

        if (!this.firebaseSync(me.userCurrentDoc.firebaseDocName)) {
          me.directLoadFromSaveData(obj);
          //report to the user something's gone wrong
        }
        break;
      case "server":
        this.loadFromServer(me.userCurrentDoc.saveAddress, () => {
          me.directLoadFromSaveData(obj);
        });
        break;
    }
  };

  //Handling delete item.
  this.on("deleteItem", d => {
    delete this.items[d.id];
  });

  //core user interface elements
  let tbman = new _topbarManager();
  tbman._init();
  //select the topbar
  document.addEventListener("DOMContentLoaded", function () {
    let t = document.querySelector(".banner");
    tbman.checkTopbars(t);
  });
  tbman.checkTopbars();

  scriptassert([
    ["dialog", "genui/dialog.js"]
  ], () => {
    let loadDialog = document.createElement("div");
    loadDialog.classList.add("dialog");
    loadDialog = dialogManager.checkDialogs(loadDialog)[0];
    let loadInnerDialog = document.createElement("div");
    loadDialog.querySelector(".innerDialog").appendChild(loadInnerDialog);
    loadInnerDialog.innerHTML = `
        <h1>Select data sources:</h1>
        <p class="firebase">
            Firebase
            <label><input class="enableSync" type="checkbox">Enable sync</label>
            <label><input name="defaultSource" type="radio" value="firebase">Set as default load source</label>
            <input class="ref" placeholder="Enter reference...">
        </p>
        <p class="server">
            Server
            <label><input type="checkbox">Save to</label>
            <label><input name="defaultSource" type="radio" value="server">Set as default load source</label>
            <input class="url" placeholder="Enter URL...">
            <button class="save">Save to source</button>
            <button class="load">Load from source</button>
        </p>
        <p class="local">
            Local
            <label><input name="defaultSource" type="radio" value=""local>Set as default load source</label>
            <button class="save">Save to source</button>
            <button class="load">Load from source</button>
        </p>
        <button class="setting">Save settings</button>
        <!--These do nothing right now-->
        <!--<p><button class="sync">Sync<button> <button class="merge">Merge<button> <button class="force">Force<button></p>-->
        `;
    documentReady(() => {
      document.body.appendChild(loadDialog);
      document.querySelector(".dataSources").addEventListener("click", () => {
        //fill in the apporpriate datasources
        if (me.userCurrentDoc.firebaseDocName)
          loadDialog.querySelector(".firebase>input.ref").value =
          me.userCurrentDoc.firebaseDocName;
        if (me.userCurrentDoc.saveAddress)
          loadDialog.querySelector(".server>input.url").value =
          me.userCurrentDoc.saveAddress;
        loadDialog.style.display = "block";
      });
    });

    loadInnerDialog
      .querySelector("button.setting")
      .addEventListener("click", function () {
        //"save changes"
        //TODO: ID validation
        //firebase
        let name = loadInnerDialog.querySelector(".firebase>input.ref").value;
        if (
          !(
            name &&
            loadInnerDialog.querySelector(".firebase input[type='checkbox']")
            .checked
          )
        ) {
          if (me.firebase && me.firebase.unsub) {
            for (let i in me.firebase.unsub) me.firebase.unsub[i]();
            delete me.firebase.unsub;
          }
          me.userCurrentDoc.firebaseDocName = "";
        } else {
          me.userCurrentDoc.firebaseDocName = name;
          me.firebaseSync(name);
        }
        //server
        let url = loadInnerDialog.querySelector(".server>input.url").value;
        if (url) {
          me.lockServer(url);
        } else {
          me.userCurrentDoc.saveAddress = "";
        }
        //handle the radio button
        if (
          loadInnerDialog.querySelector("input[name='defaultSource']:checked")
        ) {
          me.userCurrentDoc.primarySaveSource = loadInnerDialog.querySelector(
            "input[name='defaultSource']:checked"
          ).value;
        }
        me.saveUserData();
      });
    //handle the save buttons
    loadInnerDialog
      .querySelector(".server>button.save")
      .addEventListener("click", function () {
        let url = loadInnerDialog.querySelector(".server>input.url").value;
        if (url) {
          me.lockServer(url, () => {
            me.saveToServer(me.userCurrentDoc.saveAddress);
            me.saveUserData();
          });
        } else {
          me.userCurrentDoc.saveAddress = "";
          me.saveUserData();
        }
      });
    loadInnerDialog
      .querySelector(".local>button.save")
      .addEventListener("click", function () {
        me.saveToLocal();
      });
    //handle the load buttons
    loadInnerDialog
      .querySelector(".server>button.load")
      .addEventListener("click", function () {
        let url = loadInnerDialog.querySelector(".server>input.url").value;
        if (url) {
          me.lockServer(url, () => {
            me.loadFromServer(me.userCurrentDoc.saveAddress, () => {
              alert("Ack! Something happened and we couldn't load from there.");
            });
          });
        } else {
          me.userCurrentDoc.saveAddress = "";
          me.saveUserData();
        }
      });
    loadInnerDialog
      .querySelector(".local>button.load")
      .addEventListener("click", function () {
        me.directLoadFromSaveData(obj);
      });
  });

  this.saveToLocal = function () {
    localforage.setItem("__polymorph_" + core.docName, core.toSaveData());
  };
  this.lockServer = function (url, success) {
    //send a request to get json from the server
    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        me.userCurrentDoc.saveAddress = url;
        me.saveUserData();
        if (success) success();
      }
    };
    xhr.open("GET", url + "/verify");
    xhr.send();
  };

  this.readyFirebase = function () {
    if (me.firebase) return;
    me.firebase = {};
    firebase.initializeApp({
      apiKey: "AIzaSyA-sH4oDS4FNyaKX48PSpb1kboGxZsw9BQ",
      authDomain: "backbits-567dd.firebaseapp.com",
      databaseURL: "https://backbits-567dd.firebaseio.com",
      projectId: "backbits-567dd",
      storageBucket: "backbits-567dd.appspot.com",
      messagingSenderId: "894862693076"
    });
    me.firebase.preid = undefined;
    me.firebase.ccount = 0;
    me.firebase.rcount = 0;
    me.firebase.db = firebase.firestore();
    me.firebase.db.settings({
      timestampsInSnapshots: true
    });

    me.firebase.update = function (id) {
      let val = core.items[id];
      let _val = JSON.parse(JSON.stringify(val));
      me.firebase.itemRoot.doc(id).set(_val);
    };
    let checkSaveInstances = 0;

    function checkSave() {
      if (checkSaveInstances > 0) return;
      checkSaveInstances = 1;
      if (me.firebase.ccount > 0) me.firebase.ccount -= 1;
      if (me.firebase.ccount == 0) {
        me.firebase.update(me.firebase.preid);
        checkSaveInstances = 0;
      } else if (me.firebase.ccount > 0) {
        checkSaveInstances = 0;
        setTimeout(checkSave, 100);
      }
    }
    me.firebase.stackman = function (id) {
      if (id != me.firebase.preid && me.firebase.preid) {
        me.firebase.update(me.firebase.preid);
        me.firebase.rcount = 0;
      }
      me.firebase.preid = id;
      if (me.firebase.ccount == 0) setTimeout(checkSave, 100);
      me.firebase.ccount = 4;
      me.firebase.rcount++;
      if (me.firebase.rcount > 50) {
        me.firebase.ccount = 0;
        me.firebase.rcount = 0;
        me.firebase.update(id);
      }
    };
  };
  this.firebaseSync = function (docname) {
    //setup some defaults in case fb does not load
    me.views = {};

    try {
      this.readyFirebase();
    } catch (err) {
      console.log("firebase unavailable");
      return false;
    }
    //assuming the reference is available...
    me.firebase.itemRoot = me.firebase.db
      .collection("polymorph")
      .doc(docname)
      .collection("items");
    //syncing to remote from local updateItem calls
    if (me.firebase.unsub) {
      for (let i in me.firebase.unsub) me.firebase.unsub[i]();
    }
    me.firebase.unsub = {};
    //two-way tie the items to a firebase backend
    let localChange = false;
    core.on("updateItem", function (d) {
      if (!localChange) {
        me.firebase.stackman(d.id);
      } else localChange = false;
    });
    core.on("deleteItem", function (d) {
      me.firebase.itemRoot.doc(d.id).delete();
    });
    me.firebase.unsub["items"] = me.firebase.itemRoot.onSnapshot(shot => {
      shot.docChanges().forEach(change => {
        switch (change.type) {
          case "added":
          case "modified":
            if (!core.items[change.doc.id])
              core.items[change.doc.id] = new _item();
            core.items[change.doc.id].fromSaveData(change.doc.data());
            localChange = true;
            core.fire("updateItem", {
              id: change.doc.id
            });
            break;
          case "removed":
            localChange = true;
            core.fire("deleteItem", {
              id: change.doc.id
            });
            break;
        }
      });
    });
    //get the target view and render it (first time)
    me.firebase.db.collection("polymorph").doc(me.docName).collection("views").doc(me.userCurrentDoc.currentView).get().then(doc => {
      if (doc.exists) {
        me.views[me.userCurrentDoc.currentView] = doc.data();
        me.presentView(me.userCurrentDoc.currentView);
      } else {
        me.views[me.userCurrentDoc.currentView] = me.baseRect.toSaveData();
        me.fire("viewUpdate");
      }
    })

    me.firebase.unsub["views"] = me.firebase.db
      .collection("polymorph")
      .doc(docname)
      .collection("views")
      .onSnapshot(shot => {
        shot.docChanges().forEach(change => {
          switch (change.type) {
            case "added":
            case "modified":
              me.views[change.doc.id] = change.doc.data();
              //force a rehash if the user is working in that space? Could be annoying. Maybe a viewOnly flag?
              //if (me.userCurrentDocs[me.uuid].currentView=change.doc.id)
              break;
            case "removed":
              //this should never happen...
              break;
          }
        });
      });
    me.firebase.unsub["settings"] = me.firebase.db
      .collection("polymorph")
      .doc(docname)
      .onSnapshot(shot => {
        //copy over the settings and apply them
        if (shot.data()) {
          me.settings = shot.data().settings;
          me.updateSettings();
        }
      });
    //TODO:

    //two-way tie the view to the user's view profile in firebase

    //register the special online operator
    return true; //return success
  };

  this.loadFromServer = function (url, fail) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let obj = JSON.parse(this.responseText);
        me.directLoadFromSaveData(obj);
        //hide the load window in case it's open
        if (me.loadDialog) me.loadDialog.style.display = "none";
      } else if (this.readyState == 4) {
        //failure; direct load or backup!
        if (fail) fail();
      }
    };
    xmlhttp.open("GET", url + "/latest/" + me.docName, true);
    xmlhttp.send();
  };

  this.saveToServer = function (url) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        alert("Save success!");
      }
    };
    xmlhttp.open("POST", url + "/" + me.docName + "-" + Date.now(), true);
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlhttp.send(JSON.stringify(this.toSaveData()));
  };

  /*
      press views dialog to open views dialog
      list all available views
      make add new view button
      fix firebase integration
      change save structure
      */

  scriptassert([
    ["dialog", "genui/dialog.js"]
  ], () => {
    let viewDialog = document.createElement("div");
    viewDialog.classList.add("dialog");
    viewDialog = dialogManager.checkDialogs(viewDialog)[0];
    let viewInnerDialog = document.createElement("div");
    viewDialog.querySelector(".innerDialog").appendChild(viewInnerDialog);
    viewInnerDialog.innerHTML = `
    <h1>Choose a view to load!</h1>
    <div class="buttons" style=display:flex; flex-direction:column;">
    </div>
    <h2> Or, make a new view...</h2>
    <input class="newView"><button class="nb">Make new view</button>
    `;
    documentReady(() => {
      document.body.appendChild(viewDialog);
      document.querySelector(".viewdialog").addEventListener("click", () => {
        //add all current views
        viewDialog.querySelector(".buttons").innerHTML = "";
        for (let i in me.views) {
          let b = document.createElement("button");
          b.innerHTML = i;
          viewDialog.querySelector(".buttons").appendChild(b);
        }
        viewDialog.style.display = "block";
      });
    });

    //existing view buttons
    viewInnerDialog
      .querySelector(".buttons")
      .addEventListener("click", function (e) {
        if (e.target.matches("button")) {
          me.presentView(e.target.innerHTML);
          viewDialog.style.display = "none";
          me.userCurrentDoc.currentView = e.target.innerHTML;
          me.saveUserData();
        }
      });
    //new view buttons
    viewInnerDialog.querySelector(".nb").addEventListener("click", function (e) {
      if (viewInnerDialog.querySelector(".newView").value.length) {
        me.views[viewInnerDialog.querySelector(".newView").value] = {};
        me.presentView(viewInnerDialog.querySelector(".newView").value);
        me.userCurrentDoc.currentView = viewInnerDialog.querySelector(
          ".newView"
        ).value;
        me.saveUserData();
        viewDialog.style.display = "none";
      }
    });
  });

  //firebase view saving
  me.requestCapacitor = new capacitor(500, 10, (uuid) => {
    me.firebase.db
      .collection("polymorph")
      .doc(me.docName)
      .collection("views")
      .doc(uuid)
      .set(me.baseRect.toSaveData());
  });
  me.on("viewUpdate", function () {
    me.views[me.userCurrentDoc.currentView] = me.baseRect.toSaveData();
    // if firebase on, push to firebase
    if (me.firebase && me.firebase.unsub) {
      me.requestCapacitor.submit(me.userCurrentDoc.currentView);
    }
  });
}

var core = new _core();

//What else?
//Saving.
document.addEventListener("DOMContentLoaded", e => {
  document.body.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key == "s") {
      core.saveToLocal();
      e.preventDefault();
      //also do the server save
    }
  });
});