function listItem(_quarterMaster, id, data) {
    let me = this;
    this.quarterMaster = _quarterMaster;

    //Initialise DOM
    this.span = this.quarterMaster.template.cloneNode(true);
    this.quarterMaster.taskList.appendChild(this.span);


    bindDOM(this, this.span.querySelector("[data-role='name']"), 'name');
    bindDOM(this, this.span.querySelector("[data-role='tags']"), 'tags');
    bindDOM(this, this.span.querySelector("[data-role='date']"), 'dateString');
    bindDOM(this, this.span.querySelector("[data-role='id']"), 'id');
    //events for quartermaster

    this.span.querySelector("button").innerText = 'X';
    this.id = id;
    this.passiveLoadProperties = ['name', 'tags', 'dateString', 'dates'];
    this.loadFromData = function (data) {
        for (let i = 0; i < this.passiveLoadProperties.length; i++) {
            this[this.passiveLoadProperties[i]] = data[this.passiveLoadProperties[i]];
        }
        this.taskDescriptions = [];
        if (data.taskDescriptions && data.taskDescriptions.length) {
            for (let i = 0; i < data.taskDescriptions.length; i++) {
                this.taskDescriptions.push(new _quarterMaster.taskDescriptionManager.descriptionHandlers[data.taskDescriptions[i].type](me.quartermaster, data.taskDescriptions[i].data));
            }
        } else {
            this.taskDescriptions.push(new _quarterMaster.taskDescriptionManager.descriptionHandlers.textbox(_quarterMaster));
        }
    }

    this.toSaveData = function () {
        let obj = {};
        for (let i = 0; i < this.passiveLoadProperties.length; i++) {
            obj[this.passiveLoadProperties[i]] = this[this.passiveLoadProperties[i]];
        }
        obj.taskDescriptions = [];
        for (let i = 0; i < this.taskDescriptions.length; i++) {
            obj.taskDescriptions.push({
                type: this.taskDescriptions[i].type,
                data: this.taskDescriptions[i].toSaveData()
            })
        }
        return obj;
    }
    this.trash=function(){
        //hide my div
        for ( let i=0;i<this.taskDescriptions.length;i++){
            this.taskDescriptions[i].div.style.display="none";
        }
        //move my span
        this.quarterMaster.trashList.appendChild(this.span);
        //Change the button
        this.span.querySelector("button").innerText="R";
    }

    this.restore=function(){
        //move my span
        this.quarterMaster.taskList.appendChild(this.span);
        //Change the button
        this.span.querySelector("button").innerText="X";
    }

    /* deprecated
    this.remove = function () {
        try {
            this.span.remove();
            for (let i = 0; i < this.taskDescriptions.length; i++) {
                this.taskDescriptions[i].remove();
            }
        } catch (e) {
            console.log(e);
        }
    }*/
    //TODO: Task indenting
    if (data) {
        this.loadFromData(data);
    }
    
    this.focus = function () {
        this.taskDescriptions[0].div.style.display = "block";
        this.span.classList.add("selected");
    }

    this.defocus = function () {
        this.taskDescriptions[0].div.style.display = "none";
        this.span.classList.remove("selected");
    }

}                                                                      