// V3.4: offline catcher

/*TODO:
make an option for auto splash screen and offline handling
make options for styling.
*/

function _queryLoader(userSettings) {
  this.settings = {

    //the query keyword for different documents. For example, if your HTML URL querystring identifies documents by mysite.com/?document=, then the documentQueryKeyword is "document".
    documentQueryKeyword: "doc",

    defaultOffline: false,
    onlineKeyword: undefined,
    //Loading function for online.
    onlineLoad: function (id) {},

    //----------Handle blank urls----------//
    //If the url is literally blank with no tutorial, then this function is called.
    blank: function () {},

    //----------Options for working offline----------//
    //querystring parameter if you want your application to work offline.

    offlineKeyword: undefined,
    //Loading function for local. Leave blank if you do not support local loading.
    offlineLoad: function (id) {},

    //function for generating the argument passed to onlineLoad.
    generateRef: function (docName) {},

    autostart: true
  };
  Object.assign(this.settings, userSettings);

  let me = this;
  this.beginLoad = function () {
    me.params = new URLSearchParams(window.location.search);
    if (me.params.has(me.settings.documentQueryKeyword)) {
      me.settings.documentName = me.params.get(
        me.settings.documentQueryKeyword
      );
      //local loading
      if ((me.settings.offlineKeyword && me.params.has(me.settings.offlineKeyword)) ||
        me.settings.defaultOffline && (!(me.settings.onlineKeyword && me.params.has(offlineKeyword)))
      ) {
        me.settings.offlineLoad(me.settings.documentName);
      } else {
        me.settings.onlineLoad(me.settings.documentName);
      }
    }else{
      me.settings.blank();
    };
  }
  if (me.settings.autostart) {
    if (document.readyState != "loading") this.beginLoad();
    else document.addEventListener("DOMContentLoaded", () => this.beginLoad());
  }
}