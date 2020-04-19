if (!polymorph_core.userData.tutorialData) {
  polymorph_core.userData.tutorialData = { main: {} };
}


var _tutorial = (function () {
  function evalGet(itm) {
      if (typeof (itm) == "function") return itm();
      else return itm;
  }

  let types = {
      shader: {
          render: function (itm, callback) {
              let data = {};
              data.div = document.createElement("div");
              data.div.style.cssText = `position:absolute; 
              height:100%; 
              width:100%; 
              display:flex;
              flex-direction:column;
              background: rgba(0,0,0,0.7);
              z-index:300;
              top:0;
              left:0;`;
              data.innerdiv = document.createElement("div");
              data.div.appendChild(data.innerdiv);
              data.innerdiv.innerHTML = itm.contents;
              data.innerdiv.style.cssText = `flex: 0 1 auto;
              margin: auto;
              text-align: center;
              color: white;
              padding: 1em;
              `;
              if (itm.to) {
                  for (let i = 0; i < itm.to.length; i++) {
                      let btn = document.createElement("button");
                      btn.innerHTML = itm.to[i][0];
                      btn.addEventListener("click", () => {
                          callback(itm.to[i][1]);
                      })
                      data.innerdiv.appendChild(btn);
                  }
              } else {
                  data.button = document.createElement("button");
                  data.button.innerHTML = "Next";
                  data.button.addEventListener("click", function () {
                      callback();
                  })
                  data.innerdiv.appendChild(data.button);
              }
              evalGet(itm.target).appendChild(data.div);

              return data;
          },
          unrender: function (data) {
              data.div.remove();
          }
      },
      internal: {
          render: function (itm, callback) {
              let data = {};
              data.div = document.createElement("div");
              data.div.style.cssText = `position: absolute;
              height: fit-content;
              width: fit-content;
              display: block;
              background: rgba(0, 0, 0, 0.7);
              z-index: 300;`;
              switch (itm.location) {
                  default:
                  case 'left':
                      data.div.style.cssText += `top: 50%;
                      transform: translateY(-50%);`;
                      break;
                  case 'bottom':
                      data.div.style.cssText += `bottom: 0%;
                      left: 50%;
                      transform: translateX(-50%);`;
                      break;
                  case 'top':
                      data.div.style.cssText += `
                      left: 50%;
                      top: 0%;
                      transform: translateX(-50%);`;
                      break;
                  case 'center':
                      data.div.style.cssText += `
                      left: 50%;
                      top: 50%;
                      transform: translate(-50%,-50%);`;
                      break;
              }
              data.innerdiv = document.createElement("div");
              data.div.appendChild(data.innerdiv);
              data.innerdiv.innerHTML = itm.contents;
              data.innerdiv.style.cssText = `flex: 0 1 auto;
              margin: auto;
              text-align: center;
              color: white;
              padding: 1em;
              `;
              if (itm.to) {
                  for (let i = 0; i < itm.to.length; i++) {
                      let btn = document.createElement("button");
                      btn.innerHTML = itm.to[i][0];
                      btn.addEventListener("click", () => {
                          callback(itm.to[i][1]);
                      })
                      data.innerdiv.appendChild(btn);
                  }
              } else {
                  data.button = document.createElement("button");
                  data.button.innerHTML = "Next";
                  data.button.addEventListener("click", function () {
                      callback();
                  })
                  data.innerdiv.appendChild(data.button);
              }
              evalGet(itm.target).appendChild(data.div);

              return data;
          },
          unrender: function (data) {
              data.div.remove();
          }
      }
  }

  //snippet that pre-evaluates functions, so that we can quickly load dynmaics
  function iff(it) {
      if (typeof it == "function") {
          return it();
      } else return it;
  }

  function mkhash (obj) {
      let str;
      if (typeof obj=="object")str=JSON.stringify(obj);
      else str=obj.toString();
      var hash = 0, i, chr;
      if (str.length === 0) return hash.toString();
      for (i = 0; i < str.length; i++) {
          chr = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
      }
      return hash.toString();
  };

  function _tutorial(options) {
      this.firstItem = false;
      this.items = {};
      let lastData;
      let lastType;
      let me = this;
      this.present = function (id,onErr) {
          //hide the previous slide
          if (lastData) {
              types[lastType].unrender(lastData);
          }
          if (id) {
              //present the current item
              let data = iff(options.data);
              data.step = id;
              if (options.saveData) options.saveData();
              if (!me.items[id]) {
                  if (onErr)onErr();
                  return;
              }
              lastType = me.items[id].type;
              lastData = types[me.items[id].type].render(me.items[id], me.present);
          } else {
              me.end();
          }
          //otherwise finish
      }
      this.addSteps = function (steps) {
          steps.forEach((v) => { this.addStep(v) });
      }
      this.addStep = function (item) {
          //if no id then generate a uuid? 
          //needs to be deterministic
          if (!item.id) {
              item.id = mkhash(item);
          }
          if (!this.firstItem) {
              this.firstItem = item.id;
          }
          this.items[item.id] = item;
          return item.id
      }
      this.start = function (id,onErr) {
          if (!id) {
              id = this.firstItem;
          }
          this.present(id,onErr);
          return {
              end: (f) => { me._end = f; }
          }
      }
      this.continueStart = function (onErr) {
          let data = iff(options.data);
          if (!data.concluded) this.start(data.step,onErr);
          //continue based on saved tutorial data
      }
      this.end = function () {
          let data = iff(options.data);
          data.concluded = true;
          if (options.saveData) options.saveData();
          me._end;
      }
  }
  return _tutorial;
})();


polymorph_core.tutorial = new _tutorial({
  data: () => { return polymorph_core.userData.tutorialData.main },
  saveData: () => { polymorph_core.saveUserData() }
});
polymorph_core.resetTutorial = function () {
  polymorph_core.userData.tutorialData = { main: {} };
  polymorph_core.tutorial.start();
}
polymorph_core.on("UIstart", () => {
  polymorph_core.tutorial.addSteps([
    {
      target: document.body,
      type: "shader",
      contents: `<h1>Welcome to Polymorph!</h1><h2>Productivity, your way.</h2> `,
      to: [["Next", "cnd"], ["Skip"]]
    },
    {
      id: "cnd",
      target: () => { return polymorph_core.baseRect.outerDiv },
      type: "internal",
      location: 'left',
      contents: `<p>&lt;---Shift-Click and drag this border to split the item! (Then, just click and drag to resize)</p>`,
      to: [["Next", "clickop"], ["Skip"]]
    }, {
      id: "clickop",
      target: () => { return polymorph_core.baseRect.outerDiv },
      type: "internal",
      location: 'center',
      contents: `<p>These boxes contain operators. Click an operator type to get started!</p>`,
      to: [["Next", "save"], ["Skip"]]
    }, {
      id: "save",
      target: document.body,
      type: "shader",
      contents: `<p>To save your work, simply press Ctrl-S. Your work will be saved in your browser.</p>`,
      to: [["Done"]]
    }, {
      id: "ideas",
      target: () => { return document.body },
      type: "shader",
      contents: `<h1>Ideas with Polymorph</h1><h2>A whole new space for ideas to grow!</h2> `,
      to: [["Next", "idlist"], ["Skip"]]
    }, {
      id: "idlist",
      target: () => { return polymorph_core.getOperator("nvd5b4").topdiv },
      type: "internal",
      location: 'center',
      contents: `<p>Here's a list of ideas! Click an idea to view more detail about it.</p>`,
      to: [["Next", "idfs"], ["Skip"]]
    }, {
      id: "idfs",
      target: () => { return polymorph_core.baseRect.children[1].outerDiv },
      type: "internal",
      location: 'top',
      contents: `<p>This frame contains various aspects of a project. You can click any of the purple tabs to switch between frames!</p>`,
      to: [["Next", "idsv"], ["Skip"]]
    }, {
      id: "idsv",
      target: document.body,
      type: "shader",
      contents: `<h1>Sharing</h1>
      <p>This document is saved in realtime, so you can collaborate with your friends. Just share the link up the top!</p>`,
      to: [["Done"]]
    }
  ]);
  //wait for a baserect to show before continuing the tutorial
  polymorph_core.on("viewReady", () => {
    polymorph_core.tutorial.continueStart(() => { polymorph_core.tutorial.start(); });
  })
})



///////////////////////////////////////////////////////////////////////////////////////
//Also handle individual tutorials.
/* TODO: change this to topbar format.
polymorph_core.on("titleButtonsReady", () => {
  document.querySelector("li.hleptute").addEventListener("click", () => {
    polymorph_core.target().then((id) => {
      if (polymorph_core.getOperator(id).operator.startTutorial) polymorph_core.getOperator(id).operator.startTutorial();
    })
  })
  document.querySelector("li.hlepdocs").addEventListener("click", () => {
    //navigate to another help file.
    window.open(window.location.pathname + "docs", "_blank");
  })
  document.querySelector("li.hlepreport").addEventListener("click", () => {
    window.open("mailto:steeven.liu2@gmail.com?subject=Polymorph - Issue");
  })
})
*/