// V0.1 top bar (file bar? idk what to call it) manager.

/*TODO:

*/

/*
Sample expanded topbar HTML:
<ul class="topbar">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
    <li><a>Item 3</a></li>
    <li><a>Item 4</a></li>
</ul>

Sample contracted topbar HTML:
<ul class="topbar">
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
    <li>Item 4
        <ul>
        <li>SubItem 1</li>
        </ul>
    </li>
</ul>

*/



function _topbarManager(userSettings) {
    let me = this;
    this.settings = {
        style: `
        /*General styling*/
        ul.topbar, ul.topbar ul {
            list-style-type: none;
            margin: 0;
            padding: 0;
            background-color: black;
            overflow: auto;
            font-size: 1em;
        }
        
        ul.topbar li>a {
            user-select: none;
            cursor: pointer;
            display: inline-block;
        }

        ul.topbar li:hover{
            background-color: lightskyblue;
        }

        /*Top level specific styling*/
        ul.topbar>li>a{
            color: white;
            text-align: center;
            text-decoration: none;
            padding: 0.5em 16px;
        }
        
        ul.topbar>li{
            float:left;
            background:black;
        }

        ul.topbar>li>ul {
            font-size: 1em;
        }
        /*sublist specific styling*/
        ul.topbar ul {
            display: none;
            color:black;
            text-align:left;
            position: absolute;
            background-color: #f9f9f9;
            z-index: 1;
            list-style: none;
        }
        
        ul.topbar>li:hover>ul {
            display: block;
        }

        ul.topbar ul>li>a{
            display:block;
            padding: 0.5em;
        }
        `
    }
    Object.assign(this.settings, userSettings);
    //NON-DOM initialisation

    //DOM initalisation

    this._init = function () {
        let s = document.createElement("style");
        s.innerHTML = this.settings.style;
        document.head.append(s);
    };

    if (document.readyState != "loading") this._init();
    else document.addEventListener("DOMContentLoaded", () => this._init());


    this.checkTopbars=function(_root){
        if (!_root)_root=document;
        let els=_root.querySelectorAll("ul.topbar");
        for (let i=0;i<els.length;i++){
            let root=els[i];
            if (!(root.classList.contains('tbmanaged'))){
                root.classList.add("tbmanaged");
                let lis = root.querySelectorAll('li');
                for (let j=0;j<lis.length;j++){
                    let createdA=document.createElement("a");
                    for (let k=0;k<lis[j].childNodes.length;k++){
                        let toInsertNode=lis[j].childNodes[k];
                        if (toInsertNode.nodeName.toLowerCase()!="ul"){
                            createdA.append(toInsertNode);
                            k--;
                        }
                    }
                    lis[j].prepend(createdA);
                }
            }
        }
    }
}