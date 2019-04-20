core.registerSaveSource("server",function server(){
    // add entry points for save source
    // functions

    this.settings={};

    this.setSettings=function(settings){
        settings.documentID;
        settings.userID;
    }

    //saveAll
    this.saveTo=function(data){

    }
    //loadAll
    this.loadFrom=function(){
        //return an object.
    }

    //pushUpdate (for real timers)
    //directly called as core.on("update",pushUpdate);
    this.pushUpdate=function(event){
        
    }

    //enableUpdateSource
    this.enableUpdateSource=function(){
        
    }
    //can call core.fire("updateItem"); for loading

    //disableUpdateSource
    this.disableUpdateSource=function(){
        
    }
    //showDialog
    this.showDialog=function(div){

    }

    //toSaveData (to be saved with settings)
    this.toSaveData=function(){
        return JSON.parse(JSON.stringify(this.settings));
    }
})
this.forceFirebasePush = function (docname) {
    this.readyFirebase();
    this.firebaseSync(docname);
    for (let i in this.items) {
      this.firebase.itemRoot.doc(i).set(this.items[i].toSaveData());
    }
    this.views[me.userCurrentDoc.currentView] = this.baseRect.toSaveData();
    for (let i in this.views) {
      this.firebase.viewRoot.doc(i).set({
        val: JSON.stringify(this.views[i])
      });
    }
  }

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
        try {
          me.firebase.update(me.firebase.preid);
        } catch (e) {
          console.log(e)
        }
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
    me.firebase.viewRoot = me.firebase.db
      .collection("polymorph")
      .doc(docname)
      .collection("views");
    me.firebase.root = me.firebase.db
      .collection("polymorph")
      .doc(docname);
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
            if (!change.doc.metadata.hasPendingWrites) {
              //dont double up local updates
              localChange = true;
              core.fire("updateItem", {
                id: change.doc.id
              });
            }
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
    me.firebase.db.collection("polymorph").doc(docname).collection("views").doc(me.userCurrentDoc.currentView).get().then(doc => {
      if (doc.exists) {
        let d = doc.data();
        if (d.val) {
          d = JSON.parse(d.val);
        }
        me.views[me.userCurrentDoc.currentView] = d;
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
              let d = change.doc.data();
              if (d.val) {
                d = JSON.parse(d.val);
              }
              me.views[change.doc.id] = d;
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
        if (!shot.metadata.hasPendingWrites) {
          if (shot.data()) {
            me.settings = shot.data().settings;
            me.updateSettings();
          }
        }
      });
    //TODO:

    //two-way tie the view to the user's view profile in firebase

    //register the special online operator
    return true; //return success
  };


    //firebase view saving
    me.requestCapacitor = new capacitor(500, 10, (uuid) => {
        scrubbedData = JSON.stringify(me.baseRect.toSaveData());
        me.firebase.viewRoot
          .doc(uuid)
          .set({
            val: scrubbedData
          });
      });
      me.on("viewUpdate", function () {
        me.views[me.userCurrentDoc.currentView] = me.baseRect.toSaveData();
        // if firebase on, push to firebase
        if (me.firebase && me.firebase.unsub) {
          me.requestCapacitor.submit(me.userCurrentDoc.currentView);
        }
      });