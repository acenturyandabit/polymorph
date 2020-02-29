// V1.0 top bar (file bar? idk what to call it) manager.

/*TODO:

*/

/*


*/

function _topbar(parent, options) {
    this.node = document.createElement("ul");
    this.node.classList.add("topbar");
    //check if we need to inject style
    if (!document.querySelector("style.topbar")) {
        let s = document.createElement("style");
        s.classList.add("topbar");
        s.innerHTML = `
        /*General styling*/
        ul.topbar, ul.topbar ul {
            list-style-type: none;
            margin: 0;
            padding: 0;
            background: black;
            overflow: auto;
            font-size: 1em;
            z-index: 1000;
        }
        
        ul.topbar li>a {
            user-select: none;
            cursor: pointer;
            display: inline-block;
            z-index: 1000;
        }

        ul.topbar li{
            background:black;
        }

        ul.topbar li:hover{
            background-color: lightskyblue;
            z-index: 1000;
        }

        /*Top level specific styling*/
        ul.topbar>li>a{
            color: white;
            text-align: center;
            text-decoration: none;
            padding: 0.5em 16px;
            z-index: 1000;
        }
        
        ul.topbar>li{
            float:left;
            background:black;
            z-index: 1000;
        }

        ul.topbar>li>ul {
            font-size: 1em;
            z-index: 1000;
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
            z-index: 1000;
        }
        
        ul.topbar>li:hover>ul {
            display: block;
            z-index: 1000;
        }

        ul.topbar ul>li>a{
            display:block;
            color:white;
            padding: 0.5em;
            z-index: 1000;
        }
        `;
        this.node.appendChild(s);
    }
    if (parent) parent.appendChild(this.node);

    let addToList = (el, base, pathName) => {
        let a = document.createElement("a");
        let li = document.createElement("li");
        li.dataset.topbarname = pathName;
        a.appendChild(el);
        li.appendChild(a);
        base.appendChild(li);
        return li;
    }
    this.add = this.appendChild = (string, domEl) => {
        // string is domel; string is one string, string is path, string is path and domel is domel
        if (typeof (string) != "string") {
            domEl = string;
            string = "";
        }
        let bits = string.split("/");
        if (!domEl) {
            domEl = document.createElement("a");
            domEl.innerText = bits[bits.length - 1];
        }
        let base = this.node;
        while (bits.length > 1) {
            let nextBit = bits.shift();
            if (nextBit) {
                let newBase = base.querySelector(`[data-topbarname="${nextBit}"]>ul`);
                if (!newBase) {
                    let newBaseLi = base.querySelector(`[data-topbarname="${nextBit}"]`);
                    if (!newBaseLi) {
                        let tempA = document.createElement("a");
                        tempA.innerText = nextBit;
                        newBaseLi = addToList(tempA, base, nextBit);
                    }
                    base = document.createElement("ul");
                    newBaseLi.appendChild(base);
                } else {
                    base = newBase;
                }
            }
        }
        //check if the domelement already exists; it might
        if (!base.querySelector(`[data-topbarname="${bits[0]}"]`)) {
            return addToList(domEl, base, bits[0]);
        }
    }
}