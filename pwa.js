// V5.1: Option to slice off search URL's.

/*
CUTPOINTS:
Search for these comments and remove everything between them if the feature specified is not required.
//broadcast
A cross-client messaging service. Accepts messages of the type:
{
  type:"broadcast"
  data:{whatever}
}

Installation is easy! Just follow these three steps:
1. Add this script to your root directory with your index.html.
2. Also add the sample manifest.json at the bottom of this file.
3. Include the following script:
<script>
var pwaManager = new _pwaManager();
</script>
And you're done!

If you want to handle the beforeinstallprompt function, specify it in the options:
var pwaManager = new _pwaManager({
  prompt:(e)=>{
    e.prompt();
  }
});

Call pwaExtract() from a developer console to find a list of active scripts and links on your page for caching. 
Place those scripts in the 'urlsToCache' property and you'll be ready to go.
*/
var _pwaManager = (() => {
  let serviceWorkerSettings = {
    urlsToCache: [
      "3pt/firebase-app.js",
      "3pt/firebase-firestore.js",
      "genui/useful.js",
      "genui/capacitor.js",
      "genui/contextMenu.js",
      "genui/bind.js",
      "genui/filescreen.js",
      "genui/queryLoader.js",
      "genui/scriptassert.js",
      "genui/eventAPI.js",
      "genui/options.js",
      "genui/topbar.js",
      "genui/swint.js",
      "genui/dialog.js",
      "genui/tutorial.js",
      "genui/dateparser.js",
      "rect.js",
      "core.dialog.js",
      "core.tutorial.js",
      "core.js",
      "operator.js",
      "index.html",
      "operators/opSelect.js",
      "operators/itemList.js",
      "operators/descbox.js",
      "operators/calendar.js",
      //"operators/iframe.js",
      "operators/itemcluster.js",
      //"operators/quillbox.js",
      "operators/stack.js",
      "operators/terminal.js",
      "operators/timeline.js",
      //"operators/canvas.js",
      "operators/subframe.js",
      "operators/httree.js",
      "assets/jason.css",
      "3pt/jquery.min.js",
      "3pt/x-frame-bypass.js",
      "3pt/quill.min.js",
      "3pt/svg.min.js",
      "3pt/moment.min.js",
      "3pt/fullcalendar.min.js",
      "3pt/localforage.min.js",
      "manifest.json"
    ],
    CACHE_NAME: "version 8x",
    SEARCH_SLICE: true,
    RETRIEVAL_METHOD: "cacheReupdate", // cacheReupdate, networkOnly, cacheOnly
    debug: false
  };

  function dbglog(message) {
    if (serviceWorkerSettings.debug) console.log(message);
  }

  //Default functions (will be minified)
  function waitDOMExecute(f) {
    if (document.readyState != "loading") f();
    else document.addEventListener("DOMContentLoaded", f);
  }

  function pwaExtract() {
    //Extract an array of all the scripts that you might want to cache
    let cacheURLs = [];
    let elements;
    elements = document.querySelectorAll("script");
    for (let i = 0; i < elements.length; i++) {
      cacheURLs.push(elements[i].src);
    }
    elements = document.querySelectorAll("link");
    for (let i = 0; i < elements.length; i++) {
      cacheURLs.push(elements[i].href);
    }
    return cacheURLs;
  }

  function _pwaManager(userSettings) {
    let me = this;
    this.settings = {
      serviceWorkerURL: "pwa.js", // This can just be this file! This file serves both functions for the price of one. Yeets!
      manifestURL: "manifest.json"
    };
    Object.assign(this.settings, userSettings);

    this.firePrompt = function () {
      function tryFirePrompt() {
        if (me.deferredPrompt) {
          me.deferredPrompt.prompt();
        } else {
          me.deferredPrompt = "autofire";
        }
      }
      if (document.readyState != "loading") tryFirePrompt();
      else document.addEventListener("DOMContentLoaded", tryFirePrompt);
    };
    //DOM initalisation

    this._init = function () {
      if ("serviceWorker" in navigator) {
        let link = document.createElement("link");
        link.rel = "manifest";
        link.href = this.settings.manifestURL;
        document.head.appendChild(link);
        window.addEventListener("load", function () {
          navigator.serviceWorker.register(me.settings.serviceWorkerURL).then(
            function (registration) {
              // Registration was successful
              dbglog(
                `ServiceWorker registration successful with scope: ${registration.scope}`
              );
            },
            function (err) {
              // registration failed :(
              dbglog("ServiceWorker registration failed: ", err);
            }
          );
        });
      }
    };

    if (document.readyState != "loading") this._init();
    else document.addEventListener("DOMContentLoaded", () => this._init());

    //beforeunload event
    if (this.settings.prompt) {
      window.addEventListener("beforeinstallprompt", this.settings.prompt);
    }

  }

  try {
    window.title = window.title;
    dbglog("win title ok! I'm a window level.");
  } catch (err) {
    dbglog("win title not ok! I'm a backend boi.");
    //Ok we are a service worker so act like one!!11
    self.addEventListener("install", function (event) {
      self.skipWaiting();
      // Perform install steps
      event.waitUntil(
        caches.open(serviceWorkerSettings.CACHE_NAME).then(function (cache) {
          dbglog("Opened cache: " + serviceWorkerSettings.CACHE_NAME);
          return cache.addAll(serviceWorkerSettings.urlsToCache);
        })
      );
      dbglog("hopefully everything is ok... ");
    });
    let cache;
    async function setup() {
      dbglog("setup ok");
      cache = await caches.open(serviceWorkerSettings.CACHE_NAME);
    }
    setup();

    function updateCache(event) {
      return new Promise(async function (resolve) {
        setTimeout(async function () {
          try {
            dbglog(`fetch start: ${event.request}`);
            networkResponsePromise = fetch(event.request);
            const networkResponse = await networkResponsePromise;
            cache.put(event.request, networkResponse.clone());
            dbglog("fetch OK: " + event.request.url);
            resolve(networkResponse);
          } catch (e) {
            //network failure
            dbglog("fetch error: " + event.request.url);
            dbglog(e);
            resolve(404);
          }
        }, 1000); //deliver content to user asap
      });
    }
    dbglog("adding fetch event handler...");
    self.addEventListener("fetch", event => {
      dbglog("fetch event handler firing...");
      switch (serviceWorkerSettings.RETRIEVAL_METHOD) {
        case "cacheOnly":
          //cache only speed test
          if (event.request.method == "GET") {
            event.respondWith(caches.match(event.request));
          }

          break;
        case "cacheReupdate":
          dbglog("cacheReupdate method.");
          //better version with self cache matching
          if (event.request.url.startsWith(self.location.origin)) {
            if (event.request.method == "GET") {
              event.respondWith(
                (async function () {
                  let cachedResponse = undefined;
                  if (cache) {
                    cachedResponse = await cache.match(event.request);
                  }

                  if (!cachedResponse && event.request.url.indexOf("?") != -1) {
                    if (serviceWorkerSettings.SEARCH_SLICE) {
                      event.request.url = event.request.url.slice(0, event.request.url.indexOf("?"));
                      cachedResponse = await cache.match(event.request);
                    } else {
                      cachedResponse = await cache.match(event.request, {
                        ignoreSearch: event.request.url.indexOf("?") != -1
                      });
                    }

                  }

                  // Returned the cached response if we have one, otherwise return the network response.
                  if (event.request.type == "cors") {
                    return fetch(event.request);
                  } else {
                    if (cachedResponse) {
                      //avoid CORS for things like firebase
                      dbglog("cacheUpdate: " + event.request.url);
                      updateCache(event);
                      return cachedResponse;
                    } else {
                      dbglog("passiveUpdate: " + event.request.url);
                      return updateCache(event);
                    }
                  }
                })()
              );
            } else {
              dbglog("non-get: " + event.request.url);
              event.respondWith(fetch(event.request));
            }
          } else {
            try {
              event.respondWith(fetch(event.request));
            }catch (e){
              return 404;
            }
          }

          break;
        case "networkOnly":
          //cache only speed test
          event.respondWith(fetch(event.request));
          break;
      }
    });
    //broadcast
    //Credits to here: http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.XKKtSVUzZFQ
    self.addEventListener("message", function (event) {
      if (event.data && event.data.type == "broadcast") {
        clients.matchAll().then(clients => {
          clients.forEach(client => {
            let msgchan = new MessageChannel();
            client.postMessage(event.data, [msgchan.port2]);
          });
        });
      }
    });
    //broadcast
  }
  return _pwaManager;
})();
/*
A sample web app manifest. Put this in a file in your home directory!
(you may have to add or remove icons - this template has them as a reference.)
{
  "short_name": "Webapp",
  "name": "My New Webapp",
  "icons": [
    {
      "src": "/images/icons-192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "/images/icons-512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/index.html",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "scope": "/",
  "theme_color": "#FFFFFF"
}
*/