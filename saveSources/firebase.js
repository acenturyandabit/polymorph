core.registerSaveSource("fb", function () { // a sample save source, implementing a number of functions.
  let me = this;
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
  this.pushAll = async function (id, data) {
    //dont actually do anything here... this is a ctrl s by the user.
  }
  this.pullAll = async function (id) {
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
    return result;
  }

  this.hook = async function (id) { // just comment out if you can't subscribe to live updates.
    let root = this.db
      .collection("polymorph")
      .doc(id);
    // remote
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
    })
    core.on("updateItem", (d) => {
      if (me.localChange) me.localChange = false;
      else {
        me.itemcapacitor.submit(d.id);
      }
    });
    //views
    me.viewcapacitor = new capacitor(500, 30, () => {
      root.collection('views').doc(core.currentDoc.currentView).set(JSON.parse(JSON.stringify(core.baseRect.toSaveData())));
    })
    core.on("updateView", (d) => {
      me.viewcapacitor.submit(d.id);
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
})