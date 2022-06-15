//if only there was a program that could quickly create indexes of long files?



polymorph_core.registerOperator(
  "httree", {
    outerScroll: true
  },
  function (container) {
    let me = this;
    me.container = container;
    this.settings = {};

    this.style = document.createElement("style");
    this.style.innerHTML = `
        textarea{
            min-width: 5em;
            width:100%;
            height:5em;
        }
        button{
            width: 100%;
            display:block;
        }
        .containerDiv{
            display:flex;
            flex-direction: row;
        }
        .containerDiv>div{
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .smoothHide{
          display:none;
        }

        .bar{
            width: 100%;
            height: 1em;
            background: white;
            border-top: 1px solid black;
            position:relative;
        }
        .bar>button{
            position:absolute;
            width: 1em;
            height:100%;
            display:none;
            right:0;
            padding:0;
        }
        .bar:hover>button{
          display:block;
      }
    `;


    container.div.appendChild(this.style);
    this.rootdiv = document.createElement("div");
    this.rootdiv.style.minWidth = "100%";
    this.rootdiv.style.width = "fit-content";
    this.rootdiv.style.minHeight = "100%";
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.plusbutton = document.createElement("button");
    this.plusbutton.innerText = "+";
    this.rootdiv.appendChild(this.plusbutton);
    this.secondaryDiv = document.createElement("div");
    this.secondaryDiv.classList.add("containerDiv");
    this.rootdiv.appendChild(this.secondaryDiv);
    this.settings.selected = undefined;
    container.div.appendChild(this.rootdiv);
    ///////////////////////////////////////////////////////////////////////////////////////
    //tutorial
    let tu = new _tutorial({
      root: me.rootdiv
    });
    tu.push({
      id: "hello",
      target: me.rootdiv,
      type: "shader",
      contents: `<p>Click any of the + icons to add a new box.</p>
      <p>Type in the boxes to write a message!</p>`,
      to: [
        ["OK!"]
      ]
    });

    ///////////////////////////////////////////////////////////////////////////////////////
    //Selecting and deselecting.
    function select(id) {
      let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
      if (cdiv) {
        cdiv.scrollIntoViewIfNeeded();
        let cbtn = me.rootdiv.querySelector("[data-id='" + id + "']>button");
        cbtn.style.background = "lightpink";
      }
      me.settings.selected = id;
    }
    // deselection for buttons
    function deselect() {
      btns = me.rootdiv.querySelectorAll("button");
      for (let i = 0; i < btns.length; i++) {
        btns[i].style.background = "";
      }
    }

    //selecting and deselecting
    this.secondaryDiv.addEventListener("click", function (e) {
      if (e.target.tagName.toLowerCase() == "textarea") {
        deselect();
        let t = e.target;
        while (!t.dataset.id) {
          t = t.parentElement;
        }
        select(t.dataset.id);
        container.fire("focusItem", {
          sender: me,
          id: t.dataset.id
        });
      }
    });


    ///////////////////////////////////////////////////////////////////////////////////////
    //Item creation
    this.template = document.createElement("div");
    this.template.draggable = true;
    this.template.innerHTML = `
    <span class="bar"><button>x</button></span>
    <textarea></textarea>
    <button>+</button>
    <div class="containerDiv"></div>
    `;

    //this.template.querySelector("img").draggable.true;
    this.template.ondragover = e => {
      e.preventDefault();
    };
    //delegated handler for the plus button
    this.rootdiv.addEventListener("click", function (e) {
      if (e.target.tagName.toLowerCase() == "button") {
        if (e.target.innerText == "+") {
          // if items hidden, just show and return
          if (e.target.style.border) {
            polymorph_core.items[e.target.parentElement.dataset.id].httree.collapsed = false;
            hide(e.target.parentElement.dataset.id);
            container.fire("updateItem", {
              sender: me,
              id: e.target.parentElement.dataset.id
            });
            return;
          }
          //Create a new item
          let it ={};
          it.to={};
          //register it with the polymorph_core
          let id = polymorph_core.insertItem(it);
          polymorph_core.items[e.target.parentElement.dataset.id].to[id]=true;
          if (me.settings.filter && !it[me.settings.filter]) {
            it[me.settings.filter] = true;
          }
          container.fire("updateItem", {
            sender: me,
            id: id
          });
        } else if (e.target.innerText == "x") {
          //remove the current item
          let id=e.target.parentElement.parentElement.dataset.id;
          if (me.settings.filter)delete polymorph_core.items[id][me.settings.filter];
          else delete polymorph_core.items[id].links;
          container.fire("deleteItem", {
            id: e.target.parentElement.parentElement.dataset.id,
            sender: me
          });
        }
      }
    });

    this.drawItem = function (id) {
      //Check if item is shown
      //internal function for making a div
      function mkdiv(id) {
        let cdiv = me.template.cloneNode(true);
        cdiv.ondragover = e => {
          e.preventDefault();
        };
        cdiv.addEventListener("drop", me.drophandle);
        cdiv.dataset.id = id;
        return cdiv;
      }
      //check if item is shown
      if (
        (polymorph_core.items[id].links) &&
        (!me.settings.filter || polymorph_core.items[id][me.settings.filter])
      ) {
        let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
        if (!cdiv) {
          if (polymorph_core.items[id].links.parent) {
            let pdiv = me.rootdiv.querySelector(
              "[data-id='" + polymorph_core.items[id].links.parent + "']"
            );
            if (!pdiv) {
              if (!this.cachedUpdateRequests[polymorph_core.items[id].links.parent])
                this.cachedUpdateRequests[polymorph_core.items[id].links.parent] = [];
              this.cachedUpdateRequests[polymorph_core.items[id].links.parent].push(id);
            } else {
              cdiv = mkdiv(id);
              pdiv.children[3].appendChild(cdiv);
              if (this.cachedUpdateRequests[id])
                for (let i = 0; i < this.cachedUpdateRequests[id].length; i++)
                  this.drawItem(this.cachedUpdateRequests[id][i]);
            }
          } else {
            cdiv = mkdiv(id);
            me.secondaryDiv.appendChild(cdiv);
            if (this.cachedUpdateRequests[id])
              for (let i = 0; i < this.cachedUpdateRequests[id].length; i++)
                this.drawItem(this.cachedUpdateRequests[id][i]);
          }
        }
        if (cdiv) {
          if (polymorph_core.items[id].boxsize) {
            cdiv.children[1].style.minWidth = polymorph_core.items[id].boxsize.w;
            cdiv.children[1].style.height = polymorph_core.items[id].boxsize.h;
          }
          cdiv.children[1].value = polymorph_core.items[id].title || "";
          if (polymorph_core.items[id].style) {
            cdiv.children[1].style.background = polymorph_core.items[id].style.background;
            cdiv.children[1].style.color = polymorph_core.items[id].style.color;
          }
          //also hide children if that applies
          hide(id);
          //also show attribute progressbar if that applies
          barfill(id);
        }
        return true;
      }
      return false;
    };

    container.on("updateItem", d => {
      return this.drawItem(d.id);
    });
    ///////////////////////////////////////////////////////////////////////////////////////
    //Drag and drop
    //delegated drag event handler
    let draggingNode;
    let preventDrag;
    this.rootdiv.addEventListener("mousedown", e => {
      if (e.target.tagName == "TEXTAREA") {
        preventDrag = true;
      }
    });
    this.rootdiv.addEventListener("dragstart", e => {
      if (preventDrag) {
        preventDrag = false;
        return;
      }
      draggingNode = e.target;
    });
    //while dragging, if hovering over a box, higlight one side
    this.rootdiv.addEventListener("drag", e => {
      //reset everyone
      let dataids = container.div.querySelectorAll("[data-id]");
      for (let i = 0; i < dataids.length; i++) {
        dataids[i].style.borderLeft = "none";
        dataids[i].style.borderRight = "none";
      }
      let els = container.div.elementsFromPoint(e.clientX, e.clientY);
      for (let i = 0; i < els.length; i++) {
        if (els[i].matches("[data-id]")) {
          let deltaX = e.clientX - els[i].clientLeft;
          if (deltaX > els[i].clientWidth / 2) {
            els[i].style.borderRight = "3px solid red";
          } else {
            els[i].style.borderLeft = "3px solid red";
          }
        }
      }
    });

    //the drop itself
    this.drophandle = function (e) {
      let dataids = container.div.querySelectorAll("[data-id]");
      for (let i = 0; i < dataids.length; i++) {
        dataids[i].style.borderLeft = "none";
        dataids[i].style.borderRight = "none";
      }
      e.preventDefault();
      let divtarget = e.target;
      while (!(divtarget.matches("[data-id]") || divtarget == me.rootdiv)) {
        divtarget = divtarget.parentElement;
      }
      if (divtarget.matches("[data-id]")) {
        let dropLocation = divtarget.dataset.id;
        e.preventDefault();
        let id = draggingNode.dataset.id;
        //change the httree.parent of the element
        polymorph_core.items[id].links.parent = polymorph_core.items[dropLocation].links.parent;
        //insert the div itself
        divtarget.parentNode.insertBefore(draggingNode, divtarget.nextSibling);
        container.fire("updateItem", {
          sender: this,
          id: id
        });
      }
    };

    //////////////////Handle polymorph_core item updates//////////////////
    //cache requests to items that haven't been updated yet.
    this.cachedUpdateRequests = {};
    //these are optional but can be used as a reference.

    function barfill(id) {
      let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
      if (me.settings.attr && polymorph_core.items[id][me.settings.attr]) cdiv.children[0].style.background = "linear-gradient(to right,red," + polymorph_core.items[id][me.settings.attr] + "%,red," + polymorph_core.items[id][me.settings.attr] + "%, white," + polymorph_core.items[id][me.settings.attr] + "%,white)";
    }

    function hide(id) {
      let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
      if (polymorph_core.items[id].httree && polymorph_core.items[id].httree.collapsed) {
        cdiv.children[3].classList.add("smoothHide"); //style.display = "none";
        cdiv.children[2].style.border = "3px dashed red";
      } else {
        cdiv.children[2].style.border = "";
        cdiv.children[3].classList.remove("smoothHide"); //style.display = "flex";
      }
    }


    //Update item if relevant
    //This will be called for all items when the items are loaded.
    //This is also called when items are created.

    container.on("focusItem", function (d) {
      let id = d.id;
      let s = d.sender;
      if (s == me) return;
      deselect();
      if (polymorph_core.items[id].links) {
        select(id);
      }
      // An item was focused.
    });

    container.on("deleteItem", function (d) {
      let id = d.id;
      let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
      if (cdiv) {
        cdiv.remove();
      }
      // An item was deleted.
    });
    this.refresh = function () {
      // This is called when my parent rect is d.
    };
    //For interoperability between views you may fire() and on() your own events. You may only pass one object to the fire() function; use the properties of that object for additional detail.

    //////////////////Handling local changes to push to polymorph_core//////////////////

    //Register changes with polymorph_core

    this.rootdiv.addEventListener("input", e => {
      if (!e.target.parentElement.matches("[data-id]")) return;
      polymorph_core.items[e.target.parentElement.dataset.id].title = e.target.value;
      let itemID = e.target.parentElement.dataset.id;
      container.fire("updateItem", {
        id: itemID,
        sender: this
      });
    });

    this.rootdiv.addEventListener("mouseup", (e) => {
      if (e.target.tagName == "TEXTAREA") {
        let id = e.target.parentElement.dataset.id;
        polymorph_core.items[id].boxsize = {
          w: e.target.style.minWidth,
          h: e.target.style.height
        };
      }
    })

    //Register focus with polymorph_core
    this.somethingwasfocused = function () {
      container.fire("focusItem", {
        id: itemID,
        sender: this
      });
    };

    //Saving and loading
    this.toSaveData = function () {
      return this.settings;
    };

    this.fromSaveData = function (d) {
      Object.assign(this.settings, d);
      this.processSettings();
    };
    this.processSettings = function () {
      //dummy required for fromsavedata. leave blank or remove processSettings() calls!
    };

    this.quickAdd = function (data) {
      //Create a new item
      let it = {};
      it.httree = {};
      it.httree.parent = me.settings.selected;
      it.title = data;
      //register it with the polymorph_core
      let id = polymorph_core.insertItem(it);
      if (me.settings.filter && !it[me.settings.filter]) {
        it[me.settings.filter] = true;
      }
      //register a change
      container.fire("updateItem", {
        sender: me,
        id: id
      });
      deselect();
      select(id);
      container.fire("updateItem", {
        id: id,
        sender: me
      });
    };

    scriptassert([
      ["contextmenu", "genui/contextMenu.js"]
    ], () => {
      let contextMenuManager = new _contextMenuManager(me.rootdiv);
      let contextedElement;

      function ctxhook(e) {
        let tgt = e.target;
        while (!tgt.matches("[data-id]")) {
          tgt = tgt.parentElement;
        }
        contextedElement = tgt.dataset.id;
        if (me.settings.attr) {
          me.viewContextMenu.querySelector(".attribute").disabled = false;
          me.viewContextMenu.querySelector(".attribute").value = polymorph_core.items[contextedElement][me.settings.attr] || "";
        } else me.viewContextMenu.querySelector(".attribute").disabled = true;
        return true;
      }
      me.viewContextMenu = contextMenuManager.registerContextMenu(
        `
        <li><span>Edit style</span>
          <ul class="submenu">
            <li><input class="background" placeholder="Background"></li>
            <li><input class="color" placeholder="Color"></li>
          </ul>
        </li>
        <li><input class="attribute" placeholder='Attribute value...'></li>
        <li class="reatt">Refresh attribute value</li>
        <li class="collapsechildren">Toggle child visibility</li>
        `,
        me.rootdiv,
        ".bar",
        ctxhook
      );

      function updateStyle(e) {
        if (!polymorph_core.items[contextedElement].style)
          polymorph_core.items[contextedElement].style = {};
        polymorph_core.items[contextedElement].style[e.target.className] = e.target.value;
        container.fire("updateItem", {
          sender: this,
          id: contextedElement
        });
      }

      function refreshAttribute(id) {
        let mediv = me.rootdiv.querySelector("[data-id='" + id + "']");
        if (mediv.children[3].children.length) {
          let ta = 0;
          for (let i = 0; i < mediv.children[3].children.length; i++) {
            if (polymorph_core.items[mediv.children[3].children[i].dataset.id][me.settings.attr]) {
              ta += refreshAttribute(mediv.children[3].children[i].dataset.id);
            }
          }
          ta = ta / mediv.children[3].children.length;
          polymorph_core.items[id][me.settings.attr] = ta;
        }
        //update display
        barfill(id)
        return polymorph_core.items[id][me.settings.attr];
      }

      function validateAttribute(id, state, val) {
        let mediv = me.rootdiv.querySelector("[data-id='" + id + "']");
        switch (state) {
          case 0: // initial set, propagate both ways
            polymorph_core.items[id][me.settings.attr] = val;
            //validate attr of parent
            if (mediv.parentElement.parentElement.dataset.id) {
              validateAttribute(mediv.parentElement.parentElement.dataset.id, 1);
            }
            //validate attr of children
            for (let i = 0; i < mediv.children[3].children.length; i++) {
              validateAttribute(mediv.children[3].children[i].dataset.id, 2, val);
            }
            break;
          case 1: // calls to parents (aggregate)
            let ta = 0;
            for (let i = 0; i < mediv.children[3].children.length; i++) {
              if (polymorph_core.items[mediv.children[3].children[i].dataset.id][me.settings.attr]) {
                ta += polymorph_core.items[mediv.children[3].children[i].dataset.id][me.settings.attr];
              }
            }
            polymorph_core.items[id][me.settings.attr] = ta / mediv.children[3].children.length;
            //validate attr of parent
            if (mediv.parentElement.parentElement.dataset.id) {
              validateAttribute(mediv.parentElement.parentElement.dataset.id, 1);
            }
            break;
          case 2: // calls to children (set)
            polymorph_core.items[id][me.settings.attr] = val;
            //validate attr of children
            for (let i = 0; i < mediv.children[3].children.length; i++) {
              validateAttribute(mediv.children[3].children[i].dataset.id, 2, val);
            }
            break;
        }
        //update display
        barfill(id);
      }
      me.viewContextMenu
        .querySelector(".background")
        .addEventListener("input", updateStyle);
      me.viewContextMenu
        .querySelector(".color")
        .addEventListener("input", updateStyle);
      me.viewContextMenu.querySelector('.attribute').addEventListener("input", (e) => validateAttribute(contextedElement, 0, Number(e.target.value)));
      me.viewContextMenu.querySelector('.reatt').addEventListener("click", (e) => me.viewContextMenu.querySelector(".attribute").value = refreshAttribute(contextedElement));
      me.viewContextMenu.querySelector('.collapsechildren').addEventListener("click", (e) => {
        if (!polymorph_core.items[contextedElement].httree) polymorph_core.items[contextedElement].httree = {};
        polymorph_core.items[contextedElement].httree.collapsed = !polymorph_core.items[contextedElement].httree.collapsed;
        hide(contextedElement);
      });
    });

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `<h2>Filter</h2>
    <p>Only show items with the following property:</p>
    <input class="filterclass"></input>
    `;
    let attr = new polymorph_core._option({
      div: me.dialogDiv,
      type: "text",
      object: me.settings,
      property: "attr",
      label: "Attribute to use for totalling."
    })
    this.showDialog = () => {
      if (this.settings.filter)
        this.dialogDiv.querySelector(
          ".filterclass"
        ).value = this.settings.filter;
      // update your dialog elements with your settings
      attr.load();
    };
    this.dialogUpdateSettings = () => {
      this.settings.filter = this.dialogDiv.querySelector(".filterclass").value;
      // pull settings and update when your dialog is closed.
      container.fire("updateItem", { id: this.container.id });
      for (let i = 0; i < this.secondaryDiv.children.length; i++) {
        this.secondaryDiv.children[i].remove();
      }
      for (let i in polymorph_core.items) {
        this.drawItem(i);
      }
    };

    //support the terminal protocol
    this.callables = {};
    this.callables.add = this.quickAdd;
  }
);