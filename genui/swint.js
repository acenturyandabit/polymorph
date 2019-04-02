//v0.1 Service worker message interface.

function _serviceWorkerMessageInterface() {

  function send_message_to_sw(msg){
    return new Promise(function(resolve, reject){
        // Create a Message Channel
        var msg_chan = new MessageChannel();

        // Handler for recieving message reply from service worker
        msg_chan.port1.onmessage = function(event){
            if(event.data.error){
                reject(event.data.error);
            }else{
                resolve(event.data);
            }
        };

        // Send message to service worker along with port for reply
        navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    });
}

  let me = this;

  me.events = {};
  me.fire = function (e, args) {
    if (me.events[e]) {
      me.events[e].forEach((f, i) => {
        try {
          f(args)
        } catch (e) {
          console.log(e);
        }
      });
    }
  };
  me.on = function (e, f) {
    _e = e.split(',');
    _e.forEach((i) => {
      if (!me.events[i]) me.events[e] = [];
      me.events[i].push(f);
    })
  };
  me.init = function () {
    if ("serviceWorker" in navigator) {
      // Handler for messages coming from the service worker
      navigator.serviceWorker.addEventListener("message", function (event) {
        me.fire("message",event);
      });
      me.on("broadcast",function(data){
        send_message_to_sw({
          type:"broadcast",
          data:data
        });
      });
      me.on("directSend",function(data){
        send_message_to_sw(data);
      });
    } else {
      setTimeout(me.init, 1000);
    }
  }
  me.init();
}