core.registerSaveSource("gd", function () { // Google drive save source - just thinly veiled firebase save source XD
  let me = this;
  me.unsub = {};
  let CLIENT_ID = '894862693076-kke1dsjjetpauijldeb29ji5r2ha3n5a.apps.googleusercontent.com';
  let API_KEY = 'AIzaSyA-sH4oDS4FNyaKX48PSpb1kboGxZsw9BQ';

  // Array of API discovery doc URLs for APIs used by the quickstart
  var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
  var SCOPES = 'https://www.googleapis.com/auth/drive.install https://www.googleapis.com/auth/drive.file';

  this.canHandle = function (params) {
    if (params.has("state")) {
      try {
        JSON.parse(params.get("state"));
        return true;
      } catch (e) {
        return false;
      }
    }
  }

  this.pushAll = async function (id, data) {
    //dont actually do anything here... this is a ctrl s by the user.
  }
  this.pullAll = async function (id) {
    //this should never be called using a src='gd'
    if (typeof id == 'string') {
      alert('Please open Google Drive files from Google Drive! ');
      return;
    }
    let stateinfo=JSON.parse(id.get("state"));
    //create a promise that never resolves but redirects the user once authenticated.
    return new Promise(function (resolve, reject) {
      function continueLoad(success) {
        //if not successful, alert user, and abort
        console.log(success);
        if (!success){
          alert("Hey, turns out we need you to verify your Google account so we can use Google Drive. Mind if you close this window and try again?");
          //TODO: Better error message
          resolve(undefined);
        }
        //create if necessary
        if (stateinfo.action=="create"){
          let fileMetadata = {
            'name' : 'New Polymorph Document',
            'mimeType' : 'application/vnd.google-apps.drive-sdk',
            'parents': [stateinfo.folderId]
          };
          gapi.client.drive.files.create({
            resource: fileMetadata,
          }).then(function(response) {
            switch(response.status){
              case 200:
                //creation ok, redirect
                window.location.href=window.location.hostname+window.location.pathname+"?doc="+file.id+"&src=fb";
                //todo: uid base?
                break;
              default:
                alert("Ack, something seems to have happened between us and Google and we weren't able to make your file. Maybe try again and it'll work? Otherwise do let us know 3: thx");
                break;
              }
          });
        }else if (stateinfo.action=='open'){
          window.location.href=window.location.hostname+window.location.pathname+"?doc="+stateinfo.ids[0]+"&src=fb";
          //redirect to firebase url.
          resolve(result);
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
            reject("User did not authenticate");
          });
        });
      });
    })
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





/*


        else if (params.has("state")) {
            //hello google drive!
            //convert from state to GD
            window.location.href=window.location.origin+window.location.pathname+"?doc="+JSON.parse(params.get("state")).ids[0] + "&src=gd";
            //check oauth status and then redirect and convert into a form that we understand
        }

*/