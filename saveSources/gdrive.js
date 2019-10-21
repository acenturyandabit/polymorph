core.registerSaveSource("gd", function () { // Google drive save source - based off firebase savesource
  let me = this;
  this.prettyName = "Google drive integration";
  //firebase things
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
      me.db.settings({
        timestampsInSnapshots: true
      });
    } catch (e) {
      //firebase is probably already loaded
      this.db = firebase.firestore();
    }


    //google drive things
    let CLIENT_ID = '894862693076-kke1dsjjetpauijldeb29ji5r2ha3n5a.apps.googleusercontent.com';
    let API_KEY = 'AIzaSyA-sH4oDS4FNyaKX48PSpb1kboGxZsw9BQ';

    // Array of API discovery doc URLs for APIs
    var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
    var SCOPES = 'https://www.googleapis.com/auth/drive.file';


    //prompt
    core.on("UIstart",() => {
      try {
        document.querySelector(".gdrivePrompt").style.display = "block";
        document.querySelector(".gdrivePrompt").addEventListener("click", () => {
          //request install scope
          scriptassert([
            ["googledriveapi", "https://apis.google.com/js/api.js"]
          ], () => {
            gapi.load('client:auth2', () => {
              gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: 'https://www.googleapis.com/auth/drive.install'
              }).then(function () {
                // Handle the initial sign-in state.
                if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
                  //start the signin process!
                  gapi.auth2.getAuthInstance().signIn();
                }
              }, function (error) {
                reject(JSON.stringify(error));
              });
            });
          });
        })
      } catch (e) {
        console.log(e);
      }
    });

    this.canHandle = function (params) {
      if (params.has("state")) {
        let stateinfo = JSON.parse(params.get("state"));
        //create a promise that never resolves but redirects the user once authenticated.
        return new Promise(function (resolve, reject) {
          function continueLoad(success) {
            //if not successful, alert user, and abort
            console.log(success);
            if (!success) {
              alert("Hey, turns out we need you to verify your Google account so we can use Google Drive. Mind if you close this window and try again?");
              //TODO: Better error message
              resolve(false);
            }
            //create if necessary
            if (stateinfo.action == "create") {
              let fileMetadata = {
                'name': 'New Polymorph Document',
                'mimeType': 'application/vnd.google-apps.drive-sdk',
                'parents': [stateinfo.folderId]
              };
              gapi.client.drive.files.create({
                resource: fileMetadata,
              }).then(async function (response) {
                switch (response.status) {
                  case 200:
                    //creation ok, redirect
                    let docID = response.result.id;
                    //quietly change the url
                    history.pushState({}, "", "?doc=" + docID + "&src=gd");
                    resolve(docID);
                    //todo: uid base?
                    break;
                  default:
                    alert("Ack, something seems to have happened between us and Google and we weren't able to make your file. Maybe try again and it'll work? Otherwise do let us know 3: thx");
                    break;
                }
              });
            } else if (stateinfo.action == 'open') {
              //redirect to firebase url.
              gapi.client.drive.files.get({ fileId: stateinfo.ids[0] }).then(async function (response) {
                let docID = stateinfo.ids[0];
                //quietly change the url
                history.pushState({}, "", "?doc=" + docID + "&src=gd");
                resolve(docID);
              })
              //get metadata, then...
            }
          }
          scriptassert([
            ["googledriveapi", "https://apis.google.com/js/api.js"]
          ], () => {
            gapi.load('client:auth2', () => {
              gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES
              }).then(function () {
                // Listen for sign-in state changes.
                gapi.auth2.getAuthInstance().isSignedIn.listen(continueLoad);

                // Handle the initial sign-in state.
                if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
                  //start the signin process!
                  gapi.auth2.getAuthInstance().signIn();
                } else {
                  continueLoad(true);
                }
              }, function (error) {
                reject(JSON.stringify(error));
              });
            });
          });
        })
      } else return false;
    }

    this.pushAll = async function (id, data) {
      //dont actually do anything here... this is a ctrl s by the user.
    }

    this.pullAll = async function (id) {
      let root = me.db
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
      })
      core.on("updateItem", (d) => {
        if (me.localChange) me.localChange = false;
        else {
          me.itemcapacitor.submit(d.id);
        }
      });
      //views
      me.viewcapacitor = new capacitor(500, 30, () => {
        root.collection('views').doc(core.userData.documents[core.currentDocID].currentView).set(JSON.parse(JSON.stringify(core.baseRect.toSaveData())));
      })
      core.on("updateView", (d) => {
        me.viewcapacitor.submit(core.userData.documents[core.currentDocID].currentView);
      });
      //meta
      scriptassert([
        ["googledriveapi", "https://apis.google.com/js/api.js"]
      ], () => {
        gapi.load('client:auth2', () => {
          gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
          }).then(function () {
            let gMetadataCapacitor = new capacitor(500, 30, () => { gapi.client.drive.files.update({ fileId: core.currentDocID, resource: { name: core.currentDoc.displayName } }).then((r) => { }) });
            core.on("updateDoc", () => {
              gMetadataCapacitor.submit();
              if (me.localChange) me.localChange = false;
              else {
                let copyobj = Object.assign({}, core.currentDoc);
                delete copyobj.items;
                delete copyobj.views;
                root.set(copyobj);
              }
            });
          });
        });
      });
    }
    this.unhook = async function (id) { // just comment out if you can't subscribe to live updates.
      for (i in me.unsub) {
        me.unsub[i]();
      }
    }
  });
})