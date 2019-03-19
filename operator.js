//operator. Wrapper around an actual base operator. base operator should not change typically.
core.operator = function operator(_type, _rect) {
    this.rect = _rect;
    let me = this;
    this.topdiv = document.createElement("div");
    this.topdiv.style.height = "100%";
    this.topdiv.style.width = "100%";
    this.topdiv.style.overflowY = "auto";
    this.topdiv.overflow = "hidden";
    this.topdiv.position = "relative";
    this.topdiv.style.background = "lightgrey";
    this.innerdiv = document.createElement("div");
    this.topdiv.appendChild(this.innerdiv);
    this.topdiv.style.height = "100%";
    this.topdiv.style.width = "100%";
    this.uuid = guid(6);
    this.bulkhead=document.createElement("div");
    this.bulkhead.style.display="none";
    this.bulkhead.style.background="rgba(0,0,0,0.5)";
    //fill in some innerHTML
    this.bulkhead.innerHTML=`
    <div style="display: flex; width:100%; height: 100%;"><p style="margin:auto; color:white">Click to select this operator.</p></div>
    `
    this.bulkhead.style.width="100%";
    this.bulkhead.style.height="100%";
    this.bulkhead.style.position="absolute";
    this.bulkhead.style.zIndex="100";
    this.topdiv.appendChild(this.bulkhead);
    this.shader=document.createElement("div");
    this.shader.style.width="100%";
    this.shader.style.height="100%";
    this.topdiv.appendChild(this.shader);
    this.options={};
    this.shadow = this.shader.attachShadow({
        mode: "open"
    });
    this.bulkhead.addEventListener("click",function(e){
        me.bulkhead.style.display="none";
        core.submitTarget(me.uuid);
        e.stopPropagation();
    })
    this.reload = function (__type) {
        let data;
        me.options = {
            noShadow: false
        };
        if (typeof __type == "string") {
            this.type = __type;
            this.uuid = guid(6); //make a guid!
        } else {
            this.type = __type.type;
            this.uuid = __type.uuid;
            if (!this.uuid) this.uuid = guid(6); //upgrade older versions.
            data = __type.data;
        }
        //parse options and decide what to do re: a div
        if (core.operators[this.type]) {
            if (core.operators[this.type].options)
                Object.assign(me.options, core.operators[this.type].options);
            //clear the shadow and the div
            this.shadow.innerHTML = "";
            this.innerdiv.innerHTML = "";
            if (me.options.noShadow) {
                this.div = this.innerdiv;
            } else {
                this.div = this.shadow;
            }
            this.baseOperator = new core.operators[this.type].constructor(this);
            this.baseOperator.fromSaveData(data);
            this.baseOperator.container=this;
        } else {
            this.waitOperatorReady(this.type);
        }
    };

    this.waitOperatorReady = function (__type) {
        let h1 = document.createElement("h1");
        h1.innerHTML = "Loading operator...";
        this.div.appendChild(h1);
        this.operatorLoadCallbacks[__type].push({
            op: me,
            data: __type
        });
    };
    this.reload(_type);
    this.toSaveData = function () {
        let obj = {};
        obj.type = this.type;
        obj.uuid = this.uuid;
        obj.data = this.baseOperator.toSaveData();
        return obj;
    };
    this.activateTargets = function () {
        // put a grey disabled div on me of the basediv.
        if (this.options.targetForward){
            this.baseOperator.forwardTarget();
        }else this.bulkhead.style.display="block";
    }
    this.deactivateTargets = function () {
        // put a grey disabled div on me of the basediv.
        if (this.options.targetForward){
            this.baseOperator.forwardUntarget();
        }else this.bulkhead.style.display="none";
    }
};