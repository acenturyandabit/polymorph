(function () {
  core.registerOperator("itemCluster", function (operator) {
    let me = this;
    me.operator = operator;
    this.settings = {
      currentViewName: undefined,
      maxZ: 1
    };

    this.rootdiv = document.createElement("div");
    this.rootdiv.style.overflow = "none";
    //Add div HTML here
    this.rootdiv.innerHTML = innerHTML;
    this.viewName = this.rootdiv.querySelector(".viewName");
    this.leftLabel = this.rootdiv.querySelector(".leftLabel");
    this.rightLabel = this.rootdiv.querySelector(".rightLabel");
    this.leftLabelContainer = this.rootdiv.querySelector(".leftLabelContainer");
    this.rightLabelContainer = this.rootdiv.querySelector(
      ".rightLabelContainer"
    );
    this.viewgear = this.rootdiv.querySelector(".gears");
    this.viewDropdown = this.rootdiv.querySelector(".viewNameDrop");
    this.viewDropdownContainer = this.rootdiv.querySelector(
      ".viewNameContainer"
    );
    this.viewDropdownButton = this.rootdiv.querySelector(".listDrop");
    this.itemSpace = this.rootdiv.querySelector(".backwall");
    operator.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //these are optional but can be used as a reference.
    core.on("updateItem", function (d) {
      let id = d.id;
      let sender = d.sender;
      if (sender == me) return;
      if (me.arrangeItem) me.arrangeItem(id, true);
      //Check if item is shown
      //Update item if relevant
      //This will be called for all items when the items are loaded.
    });

    //////////////////Handling local changes to push to core//////////////////

    //----------For views----------//
    this.viewName.addEventListener("keyup", function (e) {
      core.items[me.settings.currentViewName].synergist.viewName =
        e.currentTarget.innerText;
      core.fire("updateItem", {
        id: me.settings.currentViewName,
        sender: me
      });
    });

    this.switchView = function (ln, assert) {
      me.settings.currentViewName = ln;
      if (!me.settings.currentViewName) {
        //Show blank
      } else {
        if (!core.items[me.settings.currentViewName]) return;
        if (!core.items[me.settings.currentViewName].synergist) {
          if (assert) {
            core.items[me.settings.currentViewName].synergist = {
              viewName: core.items[ln].title
            };
          } else {
            return;
          }
        }
        this.viewName.innerText =
          core.items[me.settings.currentViewName].synergist.viewName;
        for (i in core.items) {
          if (core.items[i].synergist && core.items[i].synergist.viewData) {
            if (me.arrangeItem) me.arrangeItem(i);
            //position the item appropriately.
          }
        }
      }
    };

    this.makeNewView = function () {
      let itm = new _item();
      //register it with the core
      let id = core.insertItem(itm);
      itm.title = "New view";
      itm.synergist = {
        type: "blank",
        viewName: "New View"
      };
      //register a change
      core.fire("create", {
        sender: this,
        id: id
      });
      core.fire("updateItem", {
        sender: this,
        id: id
      });
      this.switchView(id);
      return id;
    };

    this.cloneView = function () {
      let itm = new _item();
      //register it with the core
      let id = core.insertItem(itm);
      itm.title = "New view";
      itm.synergist = {
        type: "blank",
        viewName: "New View"
      };
      itm.title = core.items[me.settings.currentViewName].synergist.viewName;
      itm.synergist.viewName =
        core.items[me.settings.currentViewName].synergist.viewName;
      //register a change
      core.fire("create", {
        sender: this,
        id: id
      });
      core.fire("updateItem", {
        sender: this,
        id: id
      });
      this.switchView(id);
    };

    this.destroyView = function (viewName, auto) {
      // Destroy the synergist property of the item but otherwise leave it alone
      delete core.items[viewName].synergist;
      this.switchView();
    };

    ////////////////////////Banner///////////////////////////////
    //----------View options menu----------//
    this.viewgear.addEventListener("click", () => {
      //show the view settings
      me.viewSettings.style.display = "block";
    });

    scriptassert([
      ["dialog", "genui/dialog.js"]
    ], () => {
      dialogManager.checkDialogs(me.rootdiv);
      me.viewSettings = me.rootdiv.querySelector(".dialog.backOptionsMenu");
    });

    this.viewDropdown.addEventListener("click", function (e) {
      if (e.target.tagName.toLowerCase() == "a") {
        if (e.target.dataset.isnew) {
          //make a new view
          nv = me.makeNewView();
          me.switchView(nv);
        } else {
          ln = e.target.dataset.listname;
          me.switchView(ln);
        }
      } else {
        if (e.target.tagName.toLowerCase() == "em") {
          nv = Date.now().toString();
          nv = me.makeNewView();
          me.switchView(nv);
        }
      }
      me.viewDropdown.style.display = "none";
      e.stopPropagation();
    });

    this.viewDropdownButton.addEventListener("click", function () {
      me.viewDropdown.innerHTML = "";
      for (i in core.items) {
        if (core.items[i].synergist && core.items[i].synergist.viewName) {
          let aa = document.createElement("a");
          aa.dataset.listname = i;
          aa.innerHTML = core.items[i].synergist.viewName;
          me.viewDropdown.appendChild(aa);
        }
        //v = synergist.views[i].name;
      }
      let aa = document.createElement("a");
      aa.dataset.isnew = "yes";
      aa.innerHTML = `<em>Add another view</em>`;
      me.viewDropdown.appendChild(aa);
      me.viewDropdown.style.display = "block";
    });

    this.rootdiv.addEventListener("mousedown", function (e) {
      let p = e.target;
      while (p != me.rootdiv) {
        if (p == me.viewDropdown) return;
        p = p.parentElement;
      }
      me.viewDropdown.style.display = "none";
    });
    scriptassert([
      ["contextmenu", "genui/contextMenu.js"]
    ], () => {
      let contextMenuManager = new _contextMenuManager(me.rootdiv);

      me.rootcontextMenu = contextMenuManager.registerContextMenu(`
      <li class="pastebtn">Paste</li>`, me.rootdiv);
      me.rootcontextMenu.querySelector(".pastebtn").addEventListener("click", () => {
        if (me.cpyelem) {
          let rect = me.itemSpace.getBoundingClientRect();
          let rect2 = me.rootcontextMenu.getBoundingClientRect();
          core.items[me.cpyelem].synergist.viewData[me.settings.currentViewName] = {
            x: (rect2.left - rect.left) / me.itemSpace.clientWidth +
              (core.items[me.settings.currentViewName].synergist.cx || 0),
            y: (rect2.top - rect.top) / me.itemSpace.clientHeight +
              (core.items[me.settings.currentViewName].synergist.cy || 0),
          }
          me.rootcontextMenu.style.display = "none";
          me.arrangeItem(me.cpyelem);
          core.fire("updateItem", {
            id: me.cpyelem,
            sender: me
          });
        }
      })
      me.viewContextMenu = contextMenuManager.registerContextMenu(
        `<li class="viewDeleteButton">Delete</li>
                <li class="viewCloneButton">Clone view</li>`,
        me.viewDropdownContainer
      );
      me.viewDeleteButton = me.viewContextMenu.querySelector(
        ".viewDeleteButton"
      );
      me.viewDeleteButton.addEventListener("click", e => {
        //delete the view
        me.destroyView(synergist.currentView);
        me.viewContextMenu.style.display = "none";
      });

      me.viewCloneButton = me.viewContextMenu.querySelector(".viewCloneButton");
      me.viewCloneButton.addEventListener("click", e => {
        //delete the view
        me.cloneView(synergist.currentView);
        me.viewContextMenu.style.display = "none";
      });
      me.itemContextMenu = contextMenuManager.registerContextMenu(
        `<li class="deleteButton">Delete</li>
        <li class="cpybtn">Copy (between views)</li>
        <li class="subview">Open Subview</li>
        <li>Edit style</li>
        <li><input class="background" placeholder="Background"></li>
        <li><input class="color" placeholder="Color"></li>
        <li class="orientation">Reorient subitems</li>
        `,
        me.rootdiv,
        ".floatingItem",
        e => {
          let cte = e.target;
          while (!cte.matches(".floatingItem")) cte = cte.parentElement;
          me.contextedElement = cte;
          return true;
        }
      );

      function updateStyle(e) {
        let cid = me.contextedElement.dataset.id;
        if (!core.items[cid].style) core.items[cid].style = {};
        core.items[cid].style[e.target.className] = e.target.value;
        core.fire("updateItem", {
          sender: this,
          id: cid
        });
      }
      me.itemContextMenu
        .querySelector(".background")
        .addEventListener("input", updateStyle);
      me.itemContextMenu
        .querySelector(".color")
        .addEventListener("input", updateStyle);

      me.itemContextMenu
        .querySelector(".deleteButton")
        .addEventListener("click", e => {
          //delete the div and delete its corresponding item
          me.removeItem(me.contextedElement.dataset.id);
          me.itemContextMenu.style.display = "none";
        });
      me.itemContextMenu
        .querySelector(".cpybtn")
        .addEventListener("click", e => {
          //delete the div and delete its corresponding item
          me.cpyelem = me.contextedElement.dataset.id;
          me.itemContextMenu.style.display = "none";
        });
      me.itemContextMenu
        .querySelector(".orientation")
        .addEventListener("click", e => {
          //toggle the synergist orientation
          core.items[me.contextedElement.dataset.id].synergist.subitemOrientation = !core.items[me.contextedElement.dataset.id].synergist.subitemOrientation;
          //reupdate
          me.arrangeItem(me.contextedElement.dataset.id);
          me.itemContextMenu.style.display = "none";
        });

      me.itemContextMenu
        .querySelector(".subView")
        .addEventListener("click", e => {
          //delete the div and delete its corresponding item
          core.items[
              me.contextedElement.dataset.id
            ].synergist.viewName = me.deltas[me.contextedElement.dataset.id]
            .getText()
            .split("\n")[0];
          me.switchView(me.contextedElement.dataset.id);
          me.itemContextMenu.style.display = "none";
        });
    });

    ////////////////////////////ITEMS
    this.itemSpace.addEventListener("click", function (e) {
      if (
        e.target.matches(".floatingItem") ||
        e.target.matches(".floatingItem *")
      ) {
        let it = e.target;
        while (!it.matches(".floatingItem")) it = it.parentElement;
        if (me.preselected) me.preselected.classList.remove("selected");
        me.preselected = it;
        it.classList.add("selected");
      }
    });

    this.dragging = false;
    this.itemSpace.addEventListener("mousedown", function (e) {
      if (
        e.target.matches(".floatingItem") ||
        e.target.matches(".floatingItem *")
      ) {
        if (e.which != 1) return;
        if (!e.getModifierState("Shift")) {
          let it = e.target;
          while (!it.matches(".floatingItem")) it = it.parentElement;

          if (it.classList.contains("selected")) return;
          if (me.dragging) return;
          me.movingDiv = it;
          let relements = me.rootdiv.querySelectorAll(".floatingItem");
          let minzind = me.settings.maxZ;
          for (let i = 0; i < relements.length; i++) {
            relements[i].style.border = "";
            let contest = Number(relements[i].style["z-index"]);
            if (minzind > contest) minzind = contest;
          }
          core.fire("focus", {
            id: it.dataset.id,
            sender: me
          });
          it.style.border = "3px solid #ffa2fc";
          me.settings.maxZ -= minzind;
          me.settings.maxZ += 1;
          for (let i = 0; i < relements.length; i++) {
            let contest = Number(relements[i].style["z-index"]);
            relements[i].style["z-index"] = contest - minzind + 1;
          }
          it.style["z-index"] = ++me.settings.maxZ;
          me.dragging = true;
          let rect = it.getBoundingClientRect();
          me.dragDX = e.pageX - (rect.left + document.body.scrollLeft);
          me.dragDY = e.pageY - (rect.top + document.body.scrollTop);
          //e.preventDefault();
          //return false;
        } else {
          let it = e.target;
          while (!it.matches(".floatingItem")) it = it.parentElement;
          me.linkingDiv = it;
          let rect = it.getBoundingClientRect();
          me.linking = true;
        }
      } else {
        //shift to pan
        if (e.which != 1) return;
        if (e.getModifierState("Shift")) {
          me.globalDrag = true;
          me.dragDX = e.pageX;
          me.dragDY = e.pageY;
          me.ocx = core.items[me.settings.currentViewName].synergist.cx || 0;
          me.ocy = core.items[me.settings.currentViewName].synergist.cy || 0;
        }
      }
    });

    let c = new capacitor(300, 100, () => {
      me.switchView(me.settings.currentViewName);
    });

    this.itemSpace.addEventListener("mousemove", function (e) {
      if (me.dragging) {
        if (me.movingDiv.parentElement.parentElement.matches(".floatingItem")) {
          //nested items
          me.itemSpace.appendChild(me.movingDiv);
          me.clearParent(me.movingDiv.dataset.id);
          //me.items[me.movingDiv.dataset.id].viewData[me.currentView].parent = undefined;
        }
        me.movingDiv.classList.add("moving");
        let rect = me.itemSpace.getBoundingClientRect();
        me.movingDiv.style.left = e.clientX - me.dragDX - rect.left;
        me.movingDiv.style.top = e.clientY - me.dragDY - rect.top;
        let elements = me.rootdiv.getRootNode().elementsFromPoint(e.clientX, e.clientY);
        //borders for the drag item in item
        let fi = me.rootdiv.querySelectorAll(".floatingItem");
        for (let i = 0; i < fi.length; i++) {
          fi[i].style.border = "";
        }
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].matches(".floatingItem") && elements[i] != me.movingDiv) {
            elements[i].style.border = "3px dotted red";
            break;
          }

        }
        //highlighting for the bottom tray

      } else if (me.linking) {
        // draw a line from the object to the mouse cursor
        let rect = me.linkingDiv.getBoundingClientRect();
        let rect2 = me.itemSpace.getBoundingClientRect();
        me.linkingLine.plot(
          rect.left + rect.width / 2 - rect2.left,
          rect.top + rect.height - rect2.top,
          e.clientX - rect2.left,
          e.clientY - rect2.top
        );
      } else if (me.globalDrag) {
        // shift the view by delta
        core.items[me.settings.currentViewName].synergist.cx =
          me.ocx - (e.pageX - me.dragDX) / me.itemSpace.clientWidth;
        core.items[me.settings.currentViewName].synergist.cy =
          me.ocy - (e.pageY - me.dragDY) / me.itemSpace.clientHeight;
        //arrange all items
        c.submit();
      }
    });

    this.itemSpace.addEventListener("mouseup", e => {
      me.handleMoveEnd(e);
    });
    this.itemSpace.addEventListener("mouseleave", e => {
      me.handleMoveEnd(e);
    });

    me.handleMoveEnd = function (e, touch) {
      if (me.globalDrag) {
        setTimeout(() => c.submit(), 500);
        me.globalDrag = false;
      }
      if (me.dragging) {
        //disengage drag
        me.dragging = false;
        me.movingDiv.classList.remove("moving");

        let fi = me.rootdiv.querySelectorAll(".floatingItem");

        for (let i = 0; i < fi.length; i++) {
          fi[i].style.border = "";
        }


        //define some stuff
        let thing = me.movingDiv.dataset.id;
        let elements = me.rootdiv
          .getRootNode()
          .elementsFromPoint(e.clientX, e.clientY);
        /*
                  case 1: hidden
                  case 2: dragged into another object
                  case 3: dragged to a position
                */
        for (let i = 0; i < elements.length; i++) {
          if (
            elements[i].matches(".floatingItem") &&
            elements[i] != me.movingDiv
          ) {
            me.setParent(thing, elements[i].dataset.id);
            break;
          }
        }
        me.updatePosition(thing);
        core.fire("updateItem", {
          sender: me,
          id: thing
        });
      } else if (me.linking) {
        //reset linking line
        me.linkingLine.plot(0, 0, 0, 0);
        me.linking = false;
        //change the data
        let linkedTo;
        let elements = operator.div.elementsFromPoint(e.clientX, e.clientY);
        for (let i = 0; i < elements.length; i++) {
          if (
            elements[i].matches(".floatingItem") &&
            elements[i] != me.linkingDiv
          ) {
            linkedTo = elements[i];
            break;
          }
        }
        if (linkedTo) {
          //add a new line connecting the items
          me.toggleLine(me.linkingDiv.dataset.id, linkedTo.dataset.id);
          //push the change
          core.fire("updateItem", {
            sender: me,
            id: me.linkingDiv.dataset.id
          });
          core.fire("updateItem", {
            sender: me,
            id: linkedTo.dataset.id
          });
        }
      }
    };

    this.itemSpace.addEventListener("dblclick", function (e) {
      if (e.target == me.itemSpace || e.target.tagName.toLowerCase() == "svg") {
        let rect = me.itemSpace.getBoundingClientRect();
        me.createItem(
          (e.pageX - rect.left) / me.itemSpace.clientWidth +
          (core.items[me.settings.currentViewName].synergist.cx || 0),
          (e.pageY - rect.top) / me.itemSpace.clientHeight +
          (core.items[me.settings.currentViewName].synergist.cy || 0)
        );
        // Make a new item
      }
    });

    this.itemSpace.addEventListener("click", function (e) {
      let fi = me.rootdiv.querySelectorAll(".floatingItem");
      for (let i = 0; i < fi.length; i++) {
        fi[i].classList.remove("selected");
      }
    });

    this.resize = function () {
      me.switchView(me.settings.currentViewName,true);
      if (me.arrangeItem) {
        for (let i in core.items) {
          me.arrangeItem(i);
        }
      }
      /*setTimeout(() => {
                if (me.updateLines) {
                    for (let i in core.items) {
                        if (me.updateLines && core.items[i].synergist) me.updateLines(i);
                    }
                }
            }, 500);*/
    };

    //----------item functions----------//
    this.updatePosition = function (id) {
      let it = me.rootdiv.querySelector(".floatingItem[data-id='" + id + "']");
      core.items[id].synergist.viewData[this.settings.currentViewName].x =
        (it.getBoundingClientRect().left -
          me.itemSpace.getBoundingClientRect().left) /
        me.itemSpace.clientWidth +
        (core.items[me.settings.currentViewName].synergist.cx || 0);
      core.items[id].synergist.viewData[this.settings.currentViewName].y =
        (it.getBoundingClientRect().top -
          me.itemSpace.getBoundingClientRect().top) /
        me.itemSpace.clientHeight +
        (core.items[me.settings.currentViewName].synergist.cy || 0);
      me.arrangeItem(id);
    };

    this.clearParent = function (id) {
      delete core.items[id].links.parent;
      let itm = me.itemSpace.querySelector(
        ".floatingitem[data-id='" + id + "']"
      );
      itm.style.border = "";
      itm.style.position = "absolute";
    };

    this.setParent = function (childID, parentID) {
      if (!core.items[childID].links) core.items[childID].links = {};
      core.items[childID].links.parent = parentID;
      core.fire("updateItem", {
        sender: this,
        id: childID
      });
      me.arrangeItem(childID);
    };

    scriptassert([
      ["quill", "3pt/quill.min.js"]
    ], () => {
      let s = document.createElement("link");
      s.rel = "stylesheet";
      s.href = "3pt/quill.bubble.css";
      s.type = "text/css";
      s.addEventListener("load", function () {
        me.deltas = {}; //this is necessary apparently.
        let typecap = new capacitor(300, 100, id => {
          core.fire("updateItem", {
            sender: me,
            id: id
          });
        });
        me.itemSpace.addEventListener("keyup", function (e) {
          if (
            e.target.matches(".floatingItem *") ||
            e.target.matches(".floatingItem")
          ) {
            let lt = e.target;
            while (!lt.matches(".floatingItem")) {
              lt = lt.parentElement;
            }
            let id = lt.dataset.id;
            core.items[id].synergist.description = me.deltas[id].getContents();
            typecap.submit(id);
          }
        });
        me.waitingChildren = {};
        me.arrangeItem = function (id, extern) {
          if (!core.items[id].synergist || !core.items[id].synergist.viewData)
            return;
          if (!core.items[id].synergist.viewData[me.settings.currentViewName]) {
            //if an item of it exists, hide the item
            let it = me.rootdiv.querySelector(
              ".floatingItem[data-id='" + id + "']"
            );
            if (it) it.style.display = "none";
            return; //dont care about things i dont care about
          }
          //visual aspect of updating position.
          //Check if the item actually exists yet
          let it = me.rootdiv.querySelector(
            ".floatingItem[data-id='" + id + "']"
          );
          if (!it) {
            it = document.createElement("div");
            it.classList.add("floatingItem");
            it.dataset.id = id;
            it.style.resize = "both";
            let dchilds = document.createElement("div");
            dchilds.style.display = "flex";
            it.appendChild(dchilds);
            let dqiv = document.createElement("div");
            it.appendChild(dqiv);
            me.itemSpace.appendChild(it);
            me.deltas[id] = new Quill(dqiv, {
              theme: "bubble"
            }); //picky quill needs to be attached to dom to initalise :/

            //check whether or not description is quill compatible; if not, then upgrade.
            if (
              core.items[id].synergist.description &&
              typeof core.items[id].synergist.description == "string"
            ) {
              core.items[id].synergist.description = [{
                insert: core.items[id].synergist.description
              }];
            }
            me.deltas[id].setContents(core.items[id].synergist.description);
          }
          //if in this view, position it
          if (core.items[id].synergist.viewData[me.settings.currentViewName]) {
            //position it
            it.style.display = "block";
            it.children[0].style.flexDirection = (core.items[id].synergist.subitemOrientation) ? "row" : "column";
            it.style.left =
              Math.floor(
                (core.items[id].synergist.viewData[me.settings.currentViewName]
                  .x -
                  (core.items[me.settings.currentViewName].synergist.cx || 0)) *
                me.itemSpace.clientWidth
              ) + "px";
            it.style.top =
              Math.floor(
                (core.items[id].synergist.viewData[me.settings.currentViewName]
                  .y -
                  (core.items[me.settings.currentViewName].synergist.cy || 0)) *
                me.itemSpace.clientHeight
              ) + "px";
            if (core.items[id].style) {
              it.style.color = core.items[id].style.color;
              it.style.background = core.items[id].style.background;
            }
          } else {
            //otherwise hide it
            it.style.display = "none";
          }
          //set the contents of the quill
          if (extern) {
            me.deltas[id].setContents(core.items[id].synergist.description);
          }
          //also enforce parent, if possible; otherwise add it to a queue
          if (core.items[id].links && core.items[id].links.parent) {
            let parentElement = me.itemSpace.querySelector(
              ".floatingItem[data-id='" + core.items[id].links.parent + "']"
            );
            if (parentElement) {
              try {
                parentElement.children[0].appendChild(it);
                it.style.border = "1px solid black";
                it.style.position = "static";
              } catch (e) {
                console.log(e);
              }
            } else {
              if (!me.waitingChildren[core.items[id].links.parent])
                me.waitingChildren[core.items[id].links.parent] = [];
              me.waitingChildren[core.items[id].links.parent].push(id);
              //cry
            }
          }
          //rearrange all my orphaned children, if i have any
          if (me.waitingChildren[id]) {
            while (me.waitingChildren[id].length) {
              childid = me.waitingChildren[id].pop();
              me.arrangeItem(childid);
            }
          }
          //if (me.updateLines) me.updateLines(id);
        };
        me.switchView(me.settings.currentViewName, true);
        // arrange all items on startup
        for (let i in core.items) {
          me.arrangeItem(i);
        }
      });
      operator.div.appendChild(s);
      //delegate event handlers for all quills because jesus
      /*
            me.rootdiv.addEventListener("keyup",(e)=>{
                me.selfunset=true;
                let id;
                let r=e.target;
                while (r!=me.rootdiv){
                    if (r.dataset.id){
                        id=r.dataset.id;
                        break;
                    }
                    r=r.parentElement;
                }
                core.fire("updateItem",{sender:me,id:id});
            })*/
    });

    this.createItem = function (x, y) {
      let itm = new _item();
      //register it with the core
      let id = core.insertItem(itm);
      itm.title = "";
      itm.synergist = {
        viewData: {},
        description: ""
      };
      itm.synergist.viewData[me.settings.currentViewName] = {
        x: x,
        y: y
      };
      //register a change
      core.fire("create", {
        sender: this,
        id: id
      });
      core.fire("updateItem", {
        sender: this,
        id: id
      });
      this.arrangeItem(id);
    };

    this.removeItem = function (id) {
      delete core.items[id].synergist.viewData[me.settings.currentViewName];

      //also remove all lines attached to it
      if (me.activeLines) {
        let pairs = [];
        for (let s in me.activeLines) {
          for (let e in me.activeLines[s]) {
            if (e == id || s == id)
              pairs.push({
                s: s,
                e: e
              });
          }
        }
        for (let i = 0; i < pairs.length; i++) {
          me.toggleLine(pairs[i].s, pairs[i].e);
        }
      }
      me.arrangeItem(id);
      /*core.fire("deleteItem", {
        id: id
      });*/
    };
    ///////////////////////////////////////////////////////////////////////////////////////

    //////////////////Lines API//////////////////
    //
    scriptassert([
      ["svg", "3pt/svg.min.js"]
    ], () => {
      this.svg = SVG(this.itemSpace);
      me.linkingLine = me.svg.line(0, 0, 0, 0).stroke({
        width: 5
      });
      me.activeLines = {};
      me.toggleLine = function (start, end) {
        //check if linked; if linked, remove link
        if (!core.items[start].synergist.links)
          core.items[start].synergist.links = {};
        if (core.items[start].synergist.links[end]) {
          delete core.items[start].synergist.links[end];
          if (me.activeLines[start]) me.activeLines[start][end].remove();
          delete me.activeLines[(start, end)];
        } else {
          //otherwise create link
          core.items[start].synergist.links[end] = true;
          me.enforceLine(start, end);
        }
      };

      me.enforceLine = function (start, end) {
        //check if line already exists
        if (me.activeLines[start] && me.activeLines[start][end]) {
          l = me.activeLines[start][end];
        } else {
          l = me.svg.line(0, 0, 0, 0).stroke({
            width: 3
          });
          if (!me.activeLines[start]) me.activeLines[start] = {};
          me.activeLines[start][end] = l;
        }
        let sd = me.rootdiv.querySelector("[data-id='" + start + "']");
        let ed = me.rootdiv.querySelector("[data-id='" + end + "']");
        if (!sd || !ed) {
          l.remove();
          return;
        }
        let r1 = sd.getBoundingClientRect();
        let r2 = ed.getBoundingClientRect();
        let rb = me.itemSpace.getBoundingClientRect();
        //if either is not visible, then dont draw
        if (sd.style.display == "none" || ed.style.display == "none") {
          l.hide();
          return;
        }
        l.show();
        l.plot(
          r1.left + r1.width / 2 - rb.left,
          r1.top + r1.height - rb.top,
          r2.left + r2.width / 2 - rb.left,
          r2.top - rb.top
        );
      };
      me.toDrawLineCache = {};
      me.updateLines = function (id) {
        //check cache to see if any lines need to be drawn to me
        if (me.toDrawLineCache[id]) {
          for (let i = 0; i < me.toDrawLineCache[id].length; i++) {
            me.enforceLine(me.toDrawLineCache[id][i], id);
          }
        }
        delete me.toDrawLineCache[id];
        //for all my lines, if other element exists, draw line to it
        if (core.items[id]) {
          if (core.items[id].synergist && core.items[id].synergist.links) {
            for (let i in core.items[id].synergist.links) {
              if (me.rootdiv.querySelector("[data-id='" + i + "']")) {
                me.enforceLine(id, i);
              } else {
                if (!me.toDrawLineCache[i]) me.toDrawLineCache[i] = [];
                me.toDrawLineCache[i].push(id);
              }
            }
          }
        }
        //also redraw the lines that link to me
        if (me.activeLines) {
          for (let s in me.activeLines) {
            for (let e in me.activeLines[s]) {
              if (e == id) me.enforceLine(s, e);
            }
          }
        }
      };
      let freeze = false;
      let observer = new MutationObserver(() => {
        if (freeze) return;
        freeze = true;
        let itemlist = me.itemSpace.querySelectorAll(".floatingItem");
        for (let i = 0; i < itemlist.length; i++) {
          me.updateLines(itemlist[i].dataset.id);
        }
        setTimeout(() => {
          freeze = false;
        }, 100);
      });
      observer.observe(this.itemSpace, {
        childList: true,
        attributes: true,
        subtree: true //Omit or set to false to observe only changes to the parent node.
      });
    });

    //Saving and loading
    this.toSaveData = function () {
      return this.settings;
    };

    this.fromSaveData = function (d) {
      Object.assign(this.settings, d);
      this.processSettings();
    };

    //Handle a change in settings (either from load or from the settings dialog or somewhere else)
    this.processSettings = function () {
      // add a new view if there is no existing view
      if (this.settings.currentViewName == undefined) {
        let itm = new _item();
        let id = core.insertItem(itm);
        itm.title = "New View";
        itm.synergist = {
          type: "blank",
          viewName: "main"
        };
        this.settings.currentViewName = id;
        this.switchView(id);
        core.fire("create", {
          id: id
        });
        core.fire("updateItem", {
          id: id
        });
      } else {
        this.switchView(this.settings.currentViewName);
      }
    };

    this.updateSettings = function () {
      //nothing necessary here atm
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `<h1>Mode</h1>
    <select data-role="operationMode">
    <option value="standalone">Standalone</option>
    <option value="focus">Display view from focused item</option>
    </select>
    <h2>Operator to link focus to:<h2>
    <input data-role="focusOperatorID" placeholder="Operator UID (use the button)">
    <button class="targeter">Select operator</button>
    `;
    let targeter = this.dialogDiv.querySelector("button.targeter");
    targeter.addEventListener("click", function () {
      core.target().then((id) => {
        me.dialogDiv.querySelector("[data-role='focusOperatorID']").value = id;
        me.settings['focusOperatorID'] = id
        me.focusOperatorID = me.settings['focusOperatorID'];
      })
    })
    this.showDialog = function () {
      for (i in me.settings) {
        let it = me.dialogDiv.querySelector("[data-role='" + i + "']");
        if (it) it.value = me.settings[i];
      }
      // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
      let its = me.dialogDiv.querySelectorAll("[data-role]");
      for (let i = 0; i < its.length; i++) {
        me.settings[its[i].dataset.role] = its[i].value;
      }
      me.updateSettings();
      core.fire("viewUpdate");
      // pull settings and update when your dialog is closed.
    }

    core.on("focus", (e) => {
      if (me.settings.operationMode == "focus") {
        if (e.sender.container.uuid == me.settings.focusOperatorID) {
          me.switchView(e.id, true);
        }
      }
    })
  });

  var innerHTML = `<style>
    .floatingItem img {
        display: none;
        min-height: 1em;
    }
    
    .floatingItem{
        position:absolute;
        box-sizing:border-box;
    }
    
    .floatingItem,
    .floatingSetupMenu {
        border-radius: 8px;
    }
    
    .floatingItem>div{
        font-size:0.9em;
    }
    
    .floatingItem .floatingItem{
        border: 1px solid black;
        border-radius: 0;
        padding: 2px;
        margin: 5px;
        min-width: 9vw;
    }
    
    .floatingItem:hover img,
    .floatingItem:focus img {
        margin: 8px;
        display: block;
        float: right;
    }
    
    .floatingItem {
        background: white;
        width: fit-content;
        transition: left 0.5s ease, top 0.5s ease;
    }
    
    .synergist>.floatingItem {
        position: absolute;
    }
    
    .synergist-container {
        display: flex;
        height: 100%;
        flex-direction: column;
        overflow:hidden;
    }
    
    /*---------------------Banner----------------*/
    .synergist-banner {
        flex: 1 1 auto;
        position: relative;
        display: block;
        flex-direction: column;
        z-index: 2;
    }
    
    .synergist-banner h1{
        padding: 3px;
    }
    
    .synergist-banner a>span {
        border-radius:4px;
        display: inline-block;
    }
    
    .synergist-banner a>span>span {
        padding: 3px;
    }
    
    a.viewNameContainer{
        background-color:rgb(132, 185, 218);
    }
    
    .synergist-banner a .gears{
        padding: 2px;
        margin-bottom: -0.2em;
        height: 0.8em;
        display: inline-block;
    }
    
    /*
    .synergist-banner .plusbutton{ 
        padding: 10px;
        background: lightblue;
        border-radius: 10px;
        margin: 10px;
        position: absolute;
        right: 0;
        bottom: 0;
    }
    */
    /*------------view options menu----------*/
    .done{
        margin-top: auto;
    }
    /*------------Back wall----------*/
    .backwall {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
    }
    
    .leftLabelContainer,
    .rightLabelContainer {
        font-size: 30px;
    }
    
    .leftLabelContainer:not(.phone) {
        position: absolute;
        left: 0px;
        top: 50%;
    }
    
    .rightLabelContainer:not(.phone) {
        position: absolute;
        right: 0px;
        top: 50%;
    }
    .viewNameDrop{
        position: absolute;
        background-color: #f9f9f9;
        z-index: 1;
        list-style: none;
    }

    .viewNameDrop>a{
        display:block;
    }

    .viewNameDrop>a:hover{
        display:block;
        background:lavender;
    }

    .leftLabelContainer.phone {
        position: absolute;
        left: 50%;
        bottom: 0px;
        transform: translateX(-50%);
    }
    
    .rightLabelContainer.phone {
        position: absolute;
        left: 50%;
        top: 0px;
        transform: translateX(-50%);
    }
    
    .synergist {
        user-select: none;
    }
    
    /*------------Floatingsettings----------*/
    .floatingSetupMenu {
        position: absolute;
        background: white;
    }
    
    .floatingSetupMenu>span {
        padding: 10px;
        display: block;
    }
    
    .floatingItem.moving {
        box-shadow: 5px 5px 5px black;
        transition: none;
    }
    
    .floatingItem.selected {
        border: 3px dotted rgb(0, 110, 255);
    }

    </style>
    <div class="synergist-container">
    <div class="synergist-banner">
        <span class="topbar">
            <a>View:</a>
            <span>
                <a class="viewNameContainer"><span><span contenteditable class="viewName" data-listname='main' style="cursor:text"></span><span
                            class="listDrop">&#x25BC</span>
                    </span><img class="gears" src="resources/gear.png"></a>
                <div class="viewNameDrop" style="display:none">
                </div>
            </span>
        </span>
    </div>
    <div class="synergist"  style="flex: 1 1 100%;position: relative;">
        <div class="backwall">
        </div>
        <div class="dialog backOptionsMenu">
            <h2>Options</h2>
            <p>View type:<select class="viewType">
                    <option value="blank">Blank</option>
                    <option value="singleAxis">Single Axis</option>
                    <!--<option value="doubleAxis">Double Axis</option>-->
                </select> </p>
        </div>
        <div class="dialog moreMenu">
            <h2>More options</h2>
            <section class="wsm">
                <h3>Weighted scoring matrix</h3>
                <button>Generate weighted scoring matrix</button>
            </section>
        </div>
    </div>
</div>
<div class="floatingSetupMenu" style="display:none; position:absolute;">
    <span>Background:<input class="jscolor backcolor" onchange="fireman.thing.backColorUpdateReceived(this.jscolor)"
            value="ffffff"></span>
    <span>Text:<input class="jscolor forecolor" onchange="fireman.thing.foreColorUpdateReceived(this.jscolor)" value="ffffff"></span>
</div>`;
})();