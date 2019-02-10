//V2.0.1 Context menu manager, fixed Z index issues
//TODO:
//SAMPLE CODE: NOT READY
//DEFAULTARGS: NOT READY
//FUNCTION INSTEAD OF OBJECT: NOT READY

contextMenuManager={
    registerContextMenu:(menu,element,delegate, contextmenuEventPassThrough)=>{
        let thisCTXM=document.createElement("div");
        if (typeof menu =="string"){
            thisCTXM.innerHTML=menu;
        }else{
            thisCTXM.appendChild(menu);
        }
        
        thisCTXM.classList.add("contextMenu");
        document.body.appendChild(thisCTXM);
        thisCTXM.style.display='none';
        thisCTXM.style.zIndex="100";
        let f=function(e){
            //show the context menu
            thisCTXM.style.left = e.clientX;// - element.offsetLeft;
            thisCTXM.style.top = e.clientY;// - element.offsetTop;
            thisCTXM.style.display="block";
            e.preventDefault();
            if (contextmenuEventPassThrough)contextmenuEventPassThrough(e);
        };
        if (delegate){ //it's a class
            element.addEventListener("contextmenu", function(e){
                let current=e.target;
                while (current!=element){
                    if (current.matches(delegate)){
                        f(e);
                        return;
                    }else{
                        current=current.parentElement;
                    }
                }
            })
        }else{
            element.addEventListener("contextmenu", f);
        }
        document.body.addEventListener("click",(e)=>{
            if (!(e.target.matches("li"))) thisCTXM.style.display="none";
        })
    },
    init: function(){
        //add styling
        let s = document.createElement("style");
        s.innerHTML=`
        .contextMenu {
            list-style: none;
            background: white;
            box-shadow: 0px 0px 5px black;
            user-select: none;
            position: absolute;
        }
        
        .contextMenu li {
            padding: 10px;
            display: block;
        }`
        document.head.appendChild(s);
    }
}
contextMenuManager.init();