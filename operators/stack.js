core.registerOperator("stack", {
    displayName: "Stack",
    description: "Stack operators and scroll through them like a browseable webpage."
}, function (operator) {
    let me = this;
    me.operator = operator;
    this.settings = {};

    this.style = document.createElement("style");
    this.style.innerHTML = `
        .addMore{
            padding: 70px 0;
            border: 3px gray dashed;
  text-align: center;
        }
        .root>div{
            position:relative;
        }
    `
    operator.div.appendChild(this.style);

    this.rootdiv = document.createElement("div");
    this.rootdiv.classList.add("root")
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `<div class="addMore"><div>+</div><div>`;
    this.more = this.rootdiv.querySelector(".addMore");
    operator.div.appendChild(this.rootdiv);

    this.rects = [];
    this.addStack = function (r) {
        let obj = {};
        obj.div = document.createElement("div");
        obj.div.style.height = "20em";
        me.rootdiv.insertBefore(obj.div,me.more);
        obj.rect = new _rect(core, obj.div, RECT_ORIENTATION_X, 1, 0);
        if (r) obj.rect.fromSaveData(r);
        me.rects.push(obj);
    }
    this.more.addEventListener("click", this.addStack);
    //////////////////Handle core item updates//////////////////
    //Saving and loading
    this.toSaveData = function () {
        let obj = {};
        obj.settings = this.settings;
        obj.stack = [];
        for (let i = 0; i < this.rects.length; i++) {
            obj.stack.push({
                rect: this.rects[i].rect.toSaveData()
            });
        }
        return obj;
    }

    this.fromSaveData = function (d) {
        if (!d) return;
        Object.assign(this.settings, d.settings);
        this.stack = [];
        for (let i = 0; i < d.stack.length; i++) {
            this.addStack(d.stack[i].rect);
        }
    }
});