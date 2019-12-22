polymorph_core.registerSaveSource("fb", function () { // a sample save source, implementing a number of functions.
  let me = this;
  this.prettyName = "Firebase (Real time collaboration)";
  this.createable = true;
  //initialise firebase
  me.unsub = {};
  scriptassert([["firebase", "3pt/firebase-app.js"], ["firestore", "3pt/firebase-firestore.js"]], () => {
    if (!polymorph_core.firebase) {
      polymorph_core.firebase = {}
      firebase.initializeApp({
        apiKey: "AIzaSyA-sH4oDS4FNyaKX48PSpb1kboGxZsw9BQ",
        authDomain: "backbits-567dd.firebaseapp.com",
        databaseURL: "https://backbits-567dd.firebaseio.com",
        projectId: "backbits-567dd",
        storageBucket: "backbits-567dd.appspot.com",
        messagingSenderId: "894862693076"
      })
      polymorph_core.firebase.db = firebase.firestore();
      console.log("i inited fb");
    }
    this.db = polymorph_core.firebase.db;
    //lastPulledFBID is necessary because on load, we can't directly access items._meta.
    let lastPulledFBID;
    this.pullAll = async function (res) {
      if (!(polymorph_core.saveSourceData["fb"] && polymorph_core.saveSourceData["fb"].docName)) {
        polymorph_core.saveSourceData["fb"] = { docName: polymorph_core.currentDocID }
      }
      if (!this.db) return;
      let snapshot = await this.db
        .collection("polymorph")
        .doc(polymorph_core.saveSourceData["fb"].docName).collection("items").get();
      //compile all its items. We're not going to compress anything (yet).
      let fulldoc = {}
      snapshot.docs.forEach(doc => {
        fulldoc[doc.id] = doc.data()
      });
      lastPulledFBID = fulldoc._meta.fbID || undefined;
      if (res) res(fulldoc);
      else return fulldoc;
    }

    this.hook = async () => {
      if (!(polymorph_core.saveSourceData["fb"] && polymorph_core.saveSourceData["fb"].docName)) {
        polymorph_core.saveSourceData["fb"] = { docName: polymorph_core.currentDocID }
      }
      //add FBID to meta, so we can check if docs are different
      let ourfbID;
      if (polymorph_core.items._meta) {
        if (!polymorph_core.items._meta.fbID) {
          polymorph_core.items._meta.fbID = Date.now() + "_" + guid(10); // hopefully unique...
        }
        ourfbID = polymorph_core.items._meta.fbID;
      } else {
        ourfbID = lastPulledFBID
      }
      let _meta = (await this.db.collection("polymorph").doc(polymorph_core.saveSourceData["fb"].docName).collection("items").doc("meta").get()).data();
      if (_meta && _meta.fbID != ourfbID) {
        alert("Error: FB ID Mismatch - the remote document you are merging with your current document is not the same. PM is preventing this operation to prevent data loss.");
        return;
      }
      let root = this.db
        .collection("polymorph")
        .doc(polymorph_core.saveSourceData["fb"].docName);

      //Fetch all items and merge; use some time-pagination (ooh!)
      let toPostUpdate = [];

      await inductor({
        fn: async (id) => {
          let itemData = (await root.collection('items').doc(id).get().then()).data();
          if (!itemData) itemData = { _lm_: 0 };
          if (!polymorph_core.items[id]) polymorph_core.items[id] = { _lm_: 0 };
          if (itemData._lm_ > polymorph_core.items[id]._lm_) {
            //pull, it's newer
            polymorph_core.items[id] = itemData;
            toPostUpdate.push(id);
          } else if (itemData._lm_ < polymorph_core.items[id]._lm_) {
            //push, its older
            root.collection('items').doc(id).set(JSON.parse(JSON.stringify(polymorph_core.items[id])));
          }
        },
        data: Object.keys(polymorph_core.items),
        numPerRound: 100
      });
      //Sync by pushing all items (seeing as we've loaded already, this should not affect anything if we are up to date)

      //remote
      //items
      me.unsub['items'] = root.collection("items").onSnapshot(shot => {
        shot.docChanges().forEach(change => {
          if (change.doc.metadata.hasPendingWrites) return;
          switch (change.type) {
            case "added":
            case "modified":
              polymorph_core.items[change.doc.id] = change.doc.data();
              //dont double up local updates
              me.localChange = true;
              polymorph_core.fire("updateItem", {
                id: change.doc.id,
                load: true
              });
              break;
            case "removed":
              localChange = true;
              polymorph_core.fire("deleteItem", {
                id: change.doc.id,
                load: true
              });
              break;
          }
        })
      });


      //local to remote
      //items
      me.itemcapacitor = new capacitor(500, 30, (id) => {
        root.collection('items').doc(id).set(JSON.parse(JSON.stringify(polymorph_core.items[id])));
        polymorph_core.unsaved = false;
      })
      polymorph_core.on("updateItem", (d) => {
        if (me.localChange) me.localChange = false;
        else {
          me.itemcapacitor.submit(d.id);
        }
      });
    }
    this.unhook = async function (id) { // just comment out if you can't subscribe to live updates.
      for (i in me.unsub) {
        me.unsub[i]();
      }
    }
  })
  this.pullAll = (res) => {
    if (res) {
      setTimeout(() => {
        this.pullAll(res)
      }, 100);
    } else {
      return new Promise((res) => {
        setTimeout(() => {
          this.pullAll(res)
        }, 100)
      })
    }
  };

  this.hook = (res) => {
    if (res) {
      setTimeout(() => {
        this.hook(res)
      }, 100);
    } else {
      return new Promise((res) => {
        setTimeout(() => {
          this.hook(res)
        }, 100)
      })
    }
  };
  this.dialog = document.createElement("div");
  let generatedURL = htmlwrap(`<input placeholder="URL for sharing"></input>`);
  me.addrop = new _option({
    div: this.dialog,
    type: "text",
    object: () => {
      return polymorph_core.saveSourceData["fb"];
    },
    property: "docName",
    label: "Document ID",
    afterInput: (e) => {
      generatedURL.value = location.origin + location.pathname + `?doc=${e.currentTarget.value}&src=fb`;
    }
  });
  this.dialog.appendChild(generatedURL);
  this.showDialog = function () {
    if (!polymorph_core.saveSourceData["fb"]) polymorph_core.saveSourceData["fb"] = {};
    me.addrop.load();
    if (polymorph_core.saveSourceData["fb"]) generatedURL.value = location.origin + location.pathname + `?doc=${polymorph_core.currentDocID}&src=fb`;
  }
})