//V2.0. Context menu manager; now JQuery indpenedent.

contextMenuManager={
    registerContextMenu:(menu,element,delegate, contextmenuEventPassThrough)=>{
        let thisCTXM=document.createElement("div");
        thisCTXM.innerHTML=menu;
        thisCTXM.style.cssText=
        thisCTXM.classList.add("contextMenu");
        let re=element;
        while (re.parentElement)re=re.parentElement;
        re.appendChild(thisCTXM);
        let f=function(e){
            //show the context menu
            thisCTXM.style.left = e.pageX-thisCTXM.parentElement.getBoundingClientRect().x;
            thisCTXM.style.top = e.pageY-thisCTXM.parentElement.getBoundingClientRect().y;
            thisCTXM.style.display="block";
            e.preventDefault();
            if (contextmenuEventPassThrough)contextmenuEventPassThrough(e);
        };
        element.addEventListener("contextmenu",function(e){
            if (delegate){
                if (e.target.matches(delegate) || e.target.matches(delegate+" *"))f(e);
            }else f(e);
        })
        document.body.addEventListener("click", function(e){
            if (!thisCTXM.contains(e.target))thisCTXM.style.display="none";
        })
        return thisCTXM;
    },
    init: function(root){
        //add styling
        let s =document.createElement("style");
        s.innerHTML=`.contextMenu {
            list-style: none;
            background: white;
            box-shadow: 0px 0px 5px black;
            user-select: none;
            position: absolute;
            z-index:100;
        }
        
        .contextMenu li {
            padding: 10px;
            display: block;
        }`;
        root.appendChild(s);
    }
}
//contextMenuManager.init();