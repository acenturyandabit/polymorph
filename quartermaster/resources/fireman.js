// V3.4.1: change docname to id in generateDoc. 

/*TODO:
make an option for auto splash screen and offline handling
make options for styling.
*/

function _fireman(userSettings) {
  this.settings = {
    //Loading function for remote.
    documentQueryKeyword: "doc",
    //the query keyword for different documents. For example, if your HTML URL querystring identifies documents by mysite.com/?document=, then the documentQueryKeyword is "document".
    load: function(doc, id) {},
    //autocreate: set to true if queries directed at nonexistent documents results in their creation.
    autocreate: false,
    makeNewDocument: function(doc, id) {},
    //passwall: Set to true if you want fireman to use a simple password access wall to allow access to data.
    passwall: false,
    //autopass: If this is true and autocreate is true, Fireman will also prompt for the creation of a password.
    autopass: false,
    //Which key in the object to use to store the password.
    passwordKeyname: "",

    //----------Handle blank urls----------//
    //If the url is literally blank with no tutorial, then this function is called.
    blank: function() {},

    //----------Options for working offline----------//
    //querystring parameter if you want your application to work offline.
    offlineKeyword: undefined,
    //Loading function for local. Leave blank if you do not support local loading.
    offlineLoad: function(id) {},

    //----------Options for a tutorial----------//
    //querystring parameter for tutorial.
    tutorialQueryKeyword: undefined,
    //function for the tutorial.
    tutorialFunction: (doc, id) => {},

    //firebase configuration
    config: {},
    //doc to generate to be sent to registerFirebaseDoc
    generateDoc: function(db, id) {
      return db.doc(id);
    }
  };
  Object.assign(this.settings, userSettings);
  //initalise firebase
  try {
    firebase.initializeApp(this.settings.config);
    this.db = firebase.firestore();
    this.db.settings({
      timestampsInSnapshots: true
    });
  } catch (e) {
    //no internet - firebase is off.
    this.disconnected = true;
  }

  let me = this;
  this._init = function() {
    me.params = new URLSearchParams(window.location.search);
    //get passwall ready if need be, just in case
    let d = document.createElement("div");
    d.classList.add("firemanLoadingContainer");
    d.style =
      "width: 100%; height: 100%; display: block;position:absolute;width:100%;height:100%; top:0;left:0;";
    d.innerHTML = `
                <div style="position: absolute; top:0;left:0;width:100%;height:100%;background:blue; display:table; z-index:100">
                    <div style="vertical-align:middle; display:table-cell">
                        <div style="margin: auto; height: 60vh; width: 40vw; background-color: white; border-radius: 30px; padding: 30px; color:black;">
                        <section class="loading">
                            <h2>Loading...</h2>
                        </section>
                        <section class="oldDocc" style="display:none">
                            <h2 class="oldDocPasswordInvalidate">Enter password to continue</h2>
                            <input class="oldDocPasswordInput" placeholder="Password...">
                            <button class="oldDocPasswordValidate">Continue</button>
                        </section>
                        <section class="newDoc" style="display:none">
                            <h2>Set a password for your gist!</h2>
                            <input class="newDocPasswordInput" placeholder="Password...">
                            <button class="newDocPasswordValidate">Continue</button>
                        </section>
                        </div>
                    </div>
                </div>
                `;
    document.body.appendChild(d);
    if (me.params.has(me.settings.documentQueryKeyword)) {
      me.settings.documentName = me.params.get(
        me.settings.documentQueryKeyword
      );
      //local loading
      if (me.params.has(me.settings.offlineKeyword)) {
        document.getElementsByClassName(
          "firemanLoadingContainer"
        )[0].style.display = "none";
        me.settings.offlineLoad(me.settings.documentName);
      } else {
        if (this.disconnected) {
            d.innerHTML=`<div style="position: absolute; top:0;left:0;width:100%;height:100%;background:blue; display:table; z-index:100">
            <div style="vertical-align:middle; display:table-cell">
                <div style="margin: auto; height: 60vh; width: 40vw; background-color: white; border-radius: 30px; padding: 30px; color:black;">
                <h2>Internet disconnected :/ try again later</h2>
                </div>
            </div>
        </div>
            `;
        }
        //----------Handle password wall----------//
        if (me.settings.passwall) {
          me.settings
            .generateDoc(me.db, me.settings.documentName)
            .onSnapshot(shot => {
              if (shot.exists) {
                document.getElementsByClassName("loading")[0].style.display =
                  "none";
                document.getElementsByClassName("oldDoc")[0].style.display =
                  "block";
                document
                  .getElementsByClassName("oldDocPasswordInput")[0]
                  .addEventListener("keyup", e => {
                    if (e.keyCode == 13) {
                      document
                        .getElementsByClassName("oldDocPasswordValidate")[0]
                        .click();
                    }
                  });
                document
                  .getElementsByClassName("oldDocPasswordValidate")[0]
                  .addEventListener("click", e => {
                    let submittedPassword = document.getElementsByClassName(
                      "oldDocPasswordInput"
                    )[0].value;
                    me.settings
                      .generateDoc(me.db, me.settings.documentName)
                      .get()
                      .then(shot => {
                        if (
                          shot.data()[me.settings.passwordKeyname] ==
                          submittedPassword
                        ) {
                          if (me.params.has(me.settings.tutorialQueryKeyword))
                            me.settings.tutorialFunction(
                              me.settings.generateDoc(
                                me.db,
                                me.settings.documentName
                              ),
                              me.settings.documentName
                            );
                          else
                            me.settings.load(
                              me.settings.generateDoc(
                                me.db,
                                me.settings.documentName
                              ),
                              me.settings.documentName
                            );
                          document.getElementsByClassName(
                            "firemanLoadingContainer"
                          )[0].style.display = "none";
                        } else {
                          document.getElementsByClassName(
                            "oldDocPasswordInvalidate"
                          )[0].innerText = "Invalid password... Try again!";
                          document.getElementsByClassName(
                            "oldDocPasswordInput"
                          )[0].value = "";
                        }
                      });
                  });
              } else if (me.settings.autocreate) {
                if (me.settings.autopass) {
                  document.getElementsByClassName("loading")[0].style.display =
                    "none";
                  document.getElementsByClassName("newDoc")[0].style.display =
                    "block";
                  document
                    .getElementsByClassName("newDocPasswordInput")[0]
                    .addEventListener("keyup", e => {
                      if (e.keyCode == 13) {
                        document
                          .getElementsByClassName("newDocPasswordValidate")[0]
                          .click();
                      }
                    });
                  document
                    .getElementsByClassName("newDocPasswordValidate")[0]
                    .addEventListener("click", e => {
                      me.settings
                        .generateDoc(me.db, me.settings.documentName)
                        .set({
                          password: document.getElementsByClassName(
                            "newDocPasswordInput"
                          )[0].value
                        });
                      document.getElementsByClassName(
                        "firemanLoadingContainer"
                      )[0].style.display = "none";
                      me.settings.makeNewDocument(
                        me.settings.generateDoc(
                          me.db,
                          me.settings.documentName
                        ),
                        me.settings.documentName
                      );
                    });
                } else {
                  me.settings.makeNewDocument(
                    me.settings.generateDoc(me.db, me.settings.documentName),
                    me.settings.documentName
                  );
                  document.getElementsByClassName(
                    "firemanLoadingContainer"
                  )[0].style.display = "none";
                }
              } else {
                //something something fail?
              }
            });
        } else {
          if (me.params.has(me.settings.tutorialQueryKeyword))
            me.settings.tutorialFunction(
              me.settings.generateDoc(me.db, me.settings.documentName),
              me.settings.documentName
            );
          else
            me.settings.load(
              me.settings.generateDoc(me.db, me.settings.documentName),
              me.settings.documentName
            );
          document.getElementsByClassName(
            "firemanLoadingContainer"
          )[0].style.display = "none";
        }
      }
    } else if (me.params.has(me.settings.tutorialQueryKeyword)) {
      document.getElementsByClassName(
        "firemanLoadingContainer"
      )[0].style.display = "none";
      me.settings.tutorialFunction();
    } else {
      document.getElementsByClassName(
        "firemanLoadingContainer"
      )[0].style.display = "none";
      me.settings.blank();
    }
  };

  if (document.readyState != "loading") this._init();
  else document.addEventListener("DOMContentLoaded", () => this._init());
}
