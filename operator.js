//operator. Wrapper around an actual base operator. base operator should not change typically.
//child is this.baseOperator.
core.operator = function operator(_type, _rect) {
    this.rect = _rect;
    let me = this;

    //topmost 'root' div.
    this.topdiv = document.createElement("div");
    this.topdiv.style.height = "100%";
    this.topdiv.style.width = "100%";
    //this.topdiv.style.overflowY = "auto";
    this.topdiv.overflow = "hidden";
    this.topdiv.position = "relative";
    this.topdiv.style.background = "lightgrey";

    //inner div. for non shadow divs. has a uuid for an id.
    this.innerdiv = document.createElement("div");
    this.topdiv.appendChild(this.innerdiv);
    this.innerdiv.id=guid(12);

    //uuid.
    this.uuid = guid(6);
    this.options={};

    //bulkhead for item selection.
    this.bulkhead=document.createElement("div");
    this.bulkhead.style.display="none";
    this.bulkhead.style.background="rgba(0,0,0,0.5)";
    //bulkhead styling
    this.bulkhead.innerHTML=`<div style="display: flex; width:100%; height: 100%;"><p style="margin:auto; color:white">Click to select this operator.</p></div>`
    this.bulkhead.style.width="100%";
    this.bulkhead.style.height="100%";
    this.bulkhead.style.position="absolute";
    this.bulkhead.style.zIndex="100";
    this.topdiv.appendChild(this.bulkhead);
    this.bulkhead.addEventListener("click",function(e){
        me.bulkhead.style.display="none";
        core.submitTarget(me.uuid);
        e.stopPropagation();
    })

    //shadow root.
    this.shader=document.createElement("div");
    this.shader.style.width="100%";
    this.shader.style.height="100%";
    this.topdiv.appendChild(this.shader);
    this.shadow = this.shader.attachShadow({
        mode: "open"
    });

    //reload: called when you reload a function.
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
            this.tabbarName = __type.tabbarName;
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
            if (me.options.outerScroll){
                this.topdiv.style.overflowY="auto";
            }else{
                this.topdiv.style.overflowY="hidden";
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
        this.innerdiv.appendChild(h1);
        if (!core.operatorLoadCallbacks[__type])core.operatorLoadCallbacks[__type]=[];
        core.operatorLoadCallbacks[__type].push({
            op: me,
            data: __type
        });
    };
    this.reload(_type);
    this.toSaveData = function () {
        let obj = {};
        obj.type = this.type;
        obj.tabbarName=this.tabbarName;
        if (this.baseOperator)obj.data = this.baseOperator.toSaveData();
        else obj.data={};
        return obj;
    };
    this.fromSaveData = function (obj) {
        this.type = obj.type;
        this.tabbarName=obj.tabbarName;
        this.reload(this.type);
        this.baseOperator.fromSaveData(obj.data);
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
    this.getOperator=function(id){
        if (this.uuid==id){
            return this;
        }else{
            if (this.baseOperator.getOperator){
                return this.baseOperator.getOperator(id);
            }
        }
    }
    this.listOperators=function(list){
        list.push({id:me.uuid,type:me.type});
        if (this.baseOperator.listOperators){
            this.baseOperator.listOperators(list);
        }
    }
    this.visible=function(){
        return this.topdiv.offsetHeight!=0;
    }
};