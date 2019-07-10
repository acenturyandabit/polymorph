core.registerSaveSource("fb", function () { // a sample save source, implementing a number of functions.
  let me = this;
  this.prettyName = "Firebase (Real time collaboration)";
  this.createable = true;
  //initialise firebase
  me.unsub = {};
  try {
    firebase.initializeApp({
      apiKey: "AIzaSyA-sH4oDS4FNyaKX48PSpb1kboGxZsw9BQ",
      authDomain: "backbits-567dd.firebaseapp.com",
      databaseURL: "https://backbits-567dd.firebaseio.com",
      projectId: "backbits-567dd",
      storageBucket: "backbits-567dd.appspot.com",
      messagingSenderId: "894862693076"
    });
    this.db = firebase.firestore();
    me.db.settings({
      timestampsInSnapshots: true
    });
  } catch (e) {
    console.log(e);
  }
  this.pullAll = async function (data) {
    let id = data;
    if (!this.db) return;
    let root = this.db
      .collection("polymorph")
      .doc(id);
    //load items; load views, package, send
    let result = {
      views: {},
      items: {}
    };
    let snapshot = await root.collection("views").get();
    snapshot.forEach((doc) => {
      result.views[doc.id] = doc.data();
    });
    snapshot = await root.collection("items").get();
    snapshot.forEach((doc) => {
      result.items[doc.id] = doc.data();
    })
    //meta properties
    snapshot = await root.get();
    Object.assign(result, snapshot.data());
    me.pulledAll = true;
    return result;
  }

  async function internalPushAll(root){
    for (let i in core.items) {
      root.collection('items').doc(i).set(JSON.parse(JSON.stringify(core.items[i])));
    }
    for (let i in core.baseRects){
      root.collection('views').doc(i).set(JSON.parse(JSON.stringify(core.baseRects[i].toSaveData())));
    }
    let copyobj = Object.assign({}, core.currentDoc);
    delete copyobj.items;
    delete copyobj.views;
    root.set(copyobj);
    
  }

  this.hook = async function (id) { // just comment out if you can't subscribe to live updates.
    let root = this.db
      .collection("polymorph")
      .doc(id);
    if (core.documentIsClean) {
      //if the document was not loaded, also pull it.
      me.pullAll(id).then((r) => {
        core.fromSaveData(r);
        me.hook(id);
      })
      return;
    } else {
      //did we pullall in the beginning?
      if (me.pulledAll) {
        me.pulledAll = false;
        //carry on
      } else {
        let result = await root.get();
        if (result.exists) {
          //what does the user want? 
          if (confirm("The local document may conflict with the remote document. Do we pull the remote document anyway?")) {
            me.pullAll(id).then((r) => {
              core.fromSaveData(r);
              me.hook(id);
            })
            return;
          } else {
            if (confirm("Overwrite the remote document?")) {
              //force push everything
              await internalPushAll(root);
              //then continue hooking
            } else {
              //do nothing
              return;
            }
          }
        }else{
          //assume the user wants to push everything
          await internalPushAll(root);
        }
      }
    }

    //remote
    //items
    me.unsub['items'] = root.collection("items").onSnapshot(shot => {
      shot.docChanges().forEach(change => {
        if (change.doc.metadata.hasPendingWrites) return;
        switch (change.type) {
          case "added":
          case "modified":
            core.items[change.doc.id] = change.doc.data();
            //dont double up local updates
            me.localChange = true;
            core.fire("updateItem", {
              id: change.doc.id
            });
            break;
          case "removed":
            localChange = true;
            core.fire("deleteItem", {
              id: change.doc.id,
              forced: true // not yet implemented but ill figure it out
            });
            break;
        }
      })
    });
    //views
    me.unsub['views'] = root.collection("views").onSnapshot(shot => {
      shot.docChanges().forEach(change => {
        if (change.doc.metadata.hasPendingWrites) return;
        switch (change.type) {
          case "added":
          case "modified":
            core.currentDoc.views[change.doc.id] = change.doc.data();
            break;
          case "removed":
            delete core.currentDoc.views[change.doc.id];
            break;
        }
      })
    });
    //meta
    me.unsub["settings"] = root.onSnapshot(shot => {
      //copy over the settings and apply them
      if (!shot.metadata.hasPendingWrites) {
        if (shot.data()) {
          Object.assign(core.currentDoc, shot.data());
          me.localChange = true;
          core.updateSettings();
        }
      }
    });

    //local to remote
    //items
    me.itemcapacitor = new capacitor(500, 30, (id) => {
      root.collection('items').doc(id).set(JSON.parse(JSON.stringify(core.items[id])));
      core.unsaved = false;
    })
    core.on("updateItem", (d) => {
      if (me.localChange) me.localChange = false;
      else {
        me.itemcapacitor.submit(d.id);
      }
    });
    //views
    me.viewcapacitor = new capacitor(500, 30, (i) => {
      root.collection('views').doc(i).set(JSON.parse(JSON.stringify(core.baseRects[i].toSaveData())));
    })
    core.on("updateView", (d) => {
      me.viewcapacitor.submit(core.userData.documents[core.currentDocID].currentView);
    });
    //meta
    core.on("updateDoc", () => {
      if (me.localChange) me.localChange = false;
      else {
        let copyobj = Object.assign({}, core.currentDoc);
        delete copyobj.items;
        delete copyobj.views;
        root.set(copyobj);
      }
    });
  }
  this.unhook = async function (id) { // just comment out if you can't subscribe to live updates.
    for (i in me.unsub) {
      me.unsub[i]();
    }
  }

  this.dialog = document.createElement("div");
  let generatedURL = htmlwrap(`<input placeholder="URL for sharing"></input>`);
  me.addrop = new _option({
    div: this.dialog,
    type: "text",
    object: () => {
      return core.userData.documents[core.currentDocID].saveSources
    },
    property: "fb",
    label: "Document ID",
    afterInput: (e) => {
      generatedURL.value = location.origin + location.pathname + `?doc=${e.currentTarget.value}&src=fb`;
    }
  });
  this.dialog.appendChild(generatedURL);
  this.showDialog = function () {
    me.addrop.load();
    if (core.userData.documents[core.currentDocID].saveSources.fb) generatedURL.value = location.origin + location.pathname + `?doc=${core.userData.documents[core.currentDocID].saveSources.fb}&src=fb`;
  }
})