
const broadcast = new BroadcastChannel('channel1');
broadcast.onmessage = (event) => {
  if (event.data =="hello world") {
    broadcast.postMessage("hiii");
  }
};