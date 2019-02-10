// V0.1

/*TODO:
this.tryTriggerPrompt();

settings.appInstalled;

Auto search script tags to find my url wHoA

//generateCacheList(): generates a cache list based on all the scripts in the index file.

*/


//Dang so you do have to modify this file. Well, here are the settings then. :3
//Also there's a sample manifest.json at the bottom of this file for you as well :) enjoy
var serviceWorkerSettings={
    urlsToCache:[
        'index.html'
    ],
    CACHE_NAME: "version 1",
}





//Default functions (will be minified)
function waitDOMExecute(f){
    if (document.readyState != "loading") f();
    else document.addEventListener("DOMContentLoaded", f);
}








function _pwaManager(userSettings) {
    let me = this;
    this.settings = {
        serviceWorkerURL: "pwa.js", // This can just be this file! This file serves both functions for the price of one. Yeets!
        manifestURL: "manifest.json"
    }
    Object.assign(this.settings, userSettings);
    //NON-DOM initialisation
    this.deferredPrompt=undefined;
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        if (this.deferredPrompt=="autofire"){
            waitDOMExecute(()=>{e.prompt()});
        }else{
            this.deferredPrompt = e;
        }
    });
    window.addEventListener('appinstalled', (evt) => {

    });

    this.firePrompt=function(){
        function tryFirePrompt(){
            if (me.deferredPrompt){
                me.deferredPrompt.prompt();
            }else{
                me.deferredPrompt="autofire";
            }
        }
        if (document.readyState != "loading") tryFirePrompt();
        else document.addEventListener("DOMContentLoaded", tryFirePrompt);
        
    }
    //DOM initalisation

    this._init = function () {
        if ('serviceWorker' in navigator) {
            let link = document.createElement("link");
            link.rel="manifest";
            link.href=this.settings.manifestURL;
            document.head.appendChild(link);
            window.addEventListener('load', function () {
                navigator.serviceWorker.register(me.settings.serviceWorkerURL).then(function (registration) {
                    // Registration was successful
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function (err) {
                    // registration failed :(
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
    };

    if (document.readyState != "loading") this._init();
    else document.addEventListener("DOMContentLoaded", () => this._init());
    
}

try {
    window.title = window.title;
} catch (err) {
    //Ok we are a service worker so act like one!!11
    self.addEventListener('install', function (event) {
        // Perform install steps
        event.waitUntil(
            caches.open(serviceWorkerSettings.CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(serviceWorkerSettings.urlsToCache);
            })
        );
    });

    self.addEventListener('fetch', function (event) {
        event.respondWith(
            caches.match(event.request)
            .then(function (response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
        );
    });
}
/*
A sample web app manifest for yuo! aswell!
{
  "short_name": "Maps",
  "name": "Google Maps",
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
  "start_url": "/maps/?source=pwa",
  "background_color": "#3367D6",
  "display": "standalone",
  "scope": "/maps/",
  "theme_color": "#3367D6"
}
*/