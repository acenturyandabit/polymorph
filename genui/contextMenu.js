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

For submenus:
    let html=`
        <li class="option1">Option1
            <ul>
                <li>Suboption 1</li>
                <li>Suboption 2</li>
            </ul>
        </li>
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
        function intellishow(e) {
            let mbr=thisCTXM.getBoundingClientRect();
            let pbr=thisCTXM.parentElement.getBoundingClientRect();
            let _left=e.pageX - pbr.x;
            let _top= e.pageY - pbr.y;
            //adjust for out of the page scenarios.
            /*if (((pbr.x+pbr.w)-(mbr.x+mbr.w))>0)_left =_left-((pbr.x+pbr.w)-(mbr.x+mbr.w));
            if (((pbr.y+pbr.h)-(mbr.y+mbr.h))>0)_top =_top-((pbr.y+pbr.h)-(mbr.y+mbr.h));
            if (mbr.x-pbr.x>0)_left =_left-(mbr.x-pbr.x);
            if (mbr.y-pbr.y>0)_left =_left-(mbr.y-pbr.y);
            */
            //set
            thisCTXM.style.top = _top;
            thisCTXM.style.left = _left;
            thisCTXM.style.display = "block";
        }
        let f = function (e) {
            //show the context menu
            e.preventDefault();
            if (contextmenuEventPassThrough) {
                if (contextmenuEventPassThrough(e)) {
                    intellishow(e);
                }
            } else {
                intellishow(e);
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
            position:relative;
            padding: 2px;
            display: block;
        }
        .contextMenu li:hover {
            background:pink;
        }
        .contextMenu li .submenu {
            display:none;
        }
        .contextMenu li:hover .submenu {
            display: block;
            position: absolute;
            left: 100%;
            margin: 0;
            top: 0;
            padding: 0;
            background: white;
        }
        `;
    root.appendChild(s);
}
contextMenuManager = new _contextMenuManager(document.body);