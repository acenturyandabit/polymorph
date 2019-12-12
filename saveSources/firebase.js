core.registerSaveSource("fb", function () { // a sample save source, implementing a number of functions.
  let me = this;
  this.prettyName = "Firebase (Real time collaboration)";
  this.createable = true;
  //initialise firebase
  me.unsub = {};
  scriptassert([["firebase", "https://www.gstatic.com/firebasejs/5.3.0/firebase-app.js"], ["firestore", "https://www.gstatic.com/firebasejs/5.3.0/firebase-firestore.js"]], () => {
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
    } catch (e) {
      //Firebase is already loaded
      console.log("Firebase error:")
      console.log(e);
      this.db = firebase.firestore();
    }

    this.pullAll = async function () {
      if (!this.db) return;
      let root = this.db
        .collection("polymorph")
        .doc(core.currentDocID);
      //Just send the thing (yay new save structure!)
      snapshot = await root.get();
      return snapshot;
    }

    this.hook = async function (id) {
      //Sync by pushing all items (seeing as we've loaded already, this should not affect anything if we are up to date)
      let root = this.db
        .collection("polymorph")
        .doc(core.currentDocID);

      // just comment out if you can't subscribe to live updates.
      //assumption: that all changes have already been pulled,
      //If not, we'll deal with it. 

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
                id: change.doc.id,
                load: true
              });
              break;
            case "removed":
              localChange = true;
              core.fire("deleteItem", {
                id: change.doc.id,
                load: true
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
})