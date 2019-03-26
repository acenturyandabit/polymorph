//V2.0. Context menu manager; now JQuery indpenedent.
/*
How to use:

1. instantiate
let c = new contextMenuManager(root_element);

2.1 (optional). create a filter - 
function filter(e){
    //e is a normal javascript contextmenu event.

    //return true if you want the menu to be shown
    return true;
    //false otherwise
}

2.2. Layout the HTML
let html=`
        <li class="option1">Option1</li>
        <li class="option2">Option2</li>`;

3. Add a context menu!
menu=c.registerContextMenu(html,context_element, '.delegate_class'(optional), filter)

4.1 Add event hanlders when individual items are clicked.
menu.querySelector(".option1").addEventListener("click",function(){
    
    4.2 Make sure you close the context menu when you want it closed!
    menu.style.display="none";
})
*/
function _contextMenuManager(root) {
    this.registerContextMenu = function (menu, element, delegate, contextmenuEventPassThrough) {
        let thisCTXM = document.createElement("div");
        thisCTXM.innerHTML = menu;
        thisCTXM.style.cssText = "display:none;"
        thisCTXM.classList.add("contextMenu");
        let re = element;
        while (re.parentElement) re = re.parentElement;
        re.appendChild(thisCTXM);
        let f = function (e) {
            //show the context menu
            e.preventDefault();
            if (contextmenuEventPassThrough) {
                if (contextmenuEventPassThrough(e)) {
                    thisCTXM.style.left = e.pageX - thisCTXM.parentElement.getBoundingClientRect().x;
                    thisCTXM.style.top = e.pageY - thisCTXM.parentElement.getBoundingClientRect().y;
                    thisCTXM.style.display = "block";
                }
            } else {
                thisCTXM.style.left = e.pageX - thisCTXM.parentElement.getBoundingClientRect().x;
                thisCTXM.style.top = e.pageY - thisCTXM.parentElement.getBoundingClientRect().y;
                thisCTXM.style.display = "block";
            }
        };
        element.addEventListener("contextmenu", function (e) {
            if (delegate) {
                if (e.target.matches(delegate) || e.target.matches(delegate + " *")) f(e);
            } else f(e);
        })
        element.addEventListener("click", function (e) {
            if (!thisCTXM.contains(e.target)) thisCTXM.style.display = "none";
        })
        return thisCTXM;
    }
    //add styling
    let s = document.createElement("style");
    s.innerHTML = `.contextMenu {
            list-style: none;
            background: white;
            box-shadow: 0px 0px 5px black;
            user-select: none;
            position: absolute;
            z-index:1000;
        }
        .contextMenu li {
            padding: 10px;
            display: block;
        }`;
    root.appendChild(s);
}
contextMenuManager = new _contextMenuManager(document.body);