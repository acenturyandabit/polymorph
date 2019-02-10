function _contentDiv() {
    let me=this;
    //Assume empty to start with.
    this.div = document.createElement("div");
    this.div.style.height = "100%";
    this.div.style.width = "100%";
    this.div.overflow = "hidden";
    this.div.style.background = "lightgrey";
    let _innerHTML = `<h1>Select a view</h1>`
    this.div.innerHTML = _innerHTML;
    for (let i in operators) {
        let b= document.createElement("button");
        b.innerHTML=i;
        b.addEventListener("click",()=>{
            me.operator=new operators[b.innerHTML](me.div);
            core.registerOperator(me.operator);
        })
        this.div.appendChild(b);
    }
    
}