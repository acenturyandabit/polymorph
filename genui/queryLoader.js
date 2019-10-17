// V4.0: multiple loading options. 0 is default

/*TODO:
make an option for auto splash screen and offline handling
make options for styling.
add compatibility layer for older versions.
*/









function _queryLoader(userSettings) {
  this.settings = {

    //the query keyword for different documents. For example, if your HTML URL querystring identifies documents by mysite.com/?document=, then the documentQueryKeyword is "document".
    documentQueryKeyword: "doc",

    loaders: [{
      keyword: "default",
      f: function (docname) {}
    }],
    //----------Handle blank urls----------//
    //If the url is literally blank with no tutorial, then this function is called.
    blank: function () {},
    //Whether or not to immediately start the queryLoader.
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
      let seen=false;
      for (let i = 0; i < me.settings.loaders.length; i++) {
        if (me.settings.loaders[i].keyword && me.params.has(me.settings.loaders[i].keyword)) {
          me.settings.loaders[i].f(me.settings.documentName);
          seen=true;
          break;
        }
      }
      if (!seen)me.settings.loaders[0].f(me.settings.documentName);
    } else {
      me.settings.blank();
    };
  }
  if (me.settings.autostart) {
    if (document.readyState != "loading") this.beginLoad();
    else document.addEventListener("DOMContentLoaded", () => this.beginLoad());
  }
}