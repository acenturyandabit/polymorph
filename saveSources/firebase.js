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

    this.pullAll = async function (res) {
      if (!this.db) return;
      let snapshot = await this.db
        .collection("polymorph")
        .doc(polymorph_core.currentDocID).collection("items").get();
      //compile all its items. We're not going to compress anything (yet).
      let fulldoc = {}
      snapshot.docs.forEach(doc => {
        fulldoc[doc.id] = doc.data()
      });
      if (res) res(fulldoc);
      else return fulldoc;
    }

    this.hook = async () => {
      let root = this.db
        .collection("polymorph")
        .doc(polymorph_core.currentDocID);


      //Sync by pushing all items (seeing as we've loaded already, this should not affect anything if we are up to date)
      //lmao help
      for (let id in polymorph_core.items) {
        root.collection('items').doc(id).set(JSON.parse(JSON.stringify(polymorph_core.items[id])));
      }

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
      return polymorph_core.saveSourceData;
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
    if (polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.fb) generatedURL.value = location.origin + location.pathname + `?doc=${polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.fb}&src=fb`;
  }
})