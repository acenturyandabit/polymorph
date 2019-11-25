//todo: add filter

core.registerOperator("roundshow", {
    displayName: "Roundshow",
    description: "A method of showing hierarchical data with circles. For use with the knowledge base."
}, function (container) {
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {
        filter: guid(),
        nameProp: "title",
        confidenceProp: "confidence"
    };

    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `<div class="svg" style="width:100%;height:100%;"></div>`;

    container.div.appendChild(this.rootdiv);
    let opacity=0.7;
    ////////////////////////////////////////////////////////////
    // Tree function
    function createTree(root) {
        me.settings.currentRoot = root;
        let links = [];
        for (let i in core.items) {
            if (core.items[i].to) {
                for (j in core.items[i].to) {
                    //dont add bidirectional links
                    if (!(core.items[j].to && core.items[j].to[i])) {
                        links.push([i, j]);//go from i to j
                    }
                }
            }
        }
        // sort links by id so it's deterministic
        links.sort((a, b) => { return a[0] > b[0] ? 1 : (a[0] < b[0] ? -1 : 0) });
        //create a map of string to int
        let mapo = {};
        let mapa = [];
        function enmap(str) {
            if (!mapo[str]) {
                mapa.push(str);
                mapo[str] = mapa.length - 1;
            }
            return mapo[str];
        }
        for (i = 0; i < links.length; i++) {
            links[i][0] = enmap(links[i][0]);
            links[i][1] = enmap(links[i][1]);
        }
        //also enmap things we care about but dont have links
        for (let i in core.items) {
            if (core.items[i][me.settings.filter]) {
                enmap(i);
            }
        }
        //add each link; perform multiparent check and determinism
        let directParents = mapa.map(() => -1);
        let unionParents = mapa.map((v, i) => i);
        function getParent(n) {
            while (unionParents[n] != n) n = unionParents[n];
            return n;
        }
        function join(a, b) {
            unionParents[a] = getParent(b);
        }
        links.forEach((v) => {
            if (directParents[v[1]] == -1 && getParent(v[1]) != getParent(v[0])) {
                directParents[v[1]] = v[0];
                join(v[0], v[1]);
            }
        })
        //directparents is our tree
        //create a list of children from the parentList
        let children = {};
        let roots = [];
        for (let i = 0; i < directParents.length; i++) {
            if (directParents[i] == -1) {
                roots.push(mapa[i]);
            } else {
                children[mapa[directParents[i]]] = children[mapa[directParents[i]]] || [];
                children[mapa[directParents[i]]].push(mapa[i]);
            }
        }
        //finally, convert it into a single object
        let tree = {};
        function populate(obj, itm) {
            if (children[itm]) for (let i = 0; i < children[itm].length; i++) {
                obj[children[itm][i]] = {};
                populate(obj[children[itm][i]], children[itm][i]);
            }
        }
        if (root) {
            if (children[root]) roots = children[root];
            else return {};
        }
        for (let i = 0; i < roots.length; i++) {
            tree[roots[i]] = {};
            populate(tree[roots[i]], roots[i]);
        }
        me.tree = tree;
        return tree;
    }

    me.renderTree = function (tree) {
        me.storedTree = tree;
    }
    let preID;
    me.showCentre = (e) => {
        let id = me.settings.currentRoot;
        if (e && e.target) {
            let et = e.target;
            while (et.tagName.toLocaleUpperCase() != "SVG") {
                if ((et.tagName.toLocaleUpperCase() == "TEXT" || et.tagName.toLocaleUpperCase() == "PATH") && et.dataset.item) {
                    id = et.dataset.item;
                    break;
                }
                else et = et.parentElement;
            }
        }
        if (id==preID)return;
        let smallerW = Math.min(this.rootdiv.offsetWidth, this.rootdiv.offsetHeight) - 5;
        let centre = smallerW / 2;
        let innerR = smallerW / 6;
        me.coreText.font({ size: 30, anchor: "middle" }).text((add) => {
            add.tspan(core.items[id][this.settings.nameProp]);
            add.tspan((core.items[id][this.settings.confidenceProp] * 100).toFixed(2) + "%").newLine();
        }).x(centre).cy(centre).front();
        let cols = hslToRgb(((core.items[id][this.settings.confidenceProp] || 0)) * 0.3, 1, 0.5);
        me.centreItem.cx(centre).cy(centre).radius(innerR).attr({
            fill: `rgba(${cols[0]},${cols[1]},${cols[2]},${opacity})`
        }).data('item', me.settings.currentRoot);
        preID=id;
    }

    scriptassert([["svg", "3pt/svg.min.js"]], () => {
        me.svg = SVG(me.rootdiv.querySelector(".svg"));
        me.renderTree = (tree) => {
            if (me.arcs) me.arcs.forEach((v) => {
                v.remove();
            })
            me.arcs = [];
            //render two levels of the tree, no animations or anything fancy
            let l2c = 0;
            let itemsToRender = {};
            for (i in tree) {
                itemsToRender[i] = {
                    arcsize: Object.keys(tree[i]).length || 1,
                    children: tree[i]
                };
                l2c += itemsToRender[i].arcsize;
            }
            let smallerW = Math.min(this.rootdiv.offsetWidth, this.rootdiv.offsetHeight) - 5;
            let innerR = smallerW / 6;
            let middleR = smallerW / 3;
            let outerR = smallerW / 2;
            let c2c = 0;
            let centre = smallerW / 2;
            for (i in itemsToRender) {
                //draw a sector for it
                let cols = hslToRgb(((core.items[i][this.settings.confidenceProp] || 0)) * 0.3, 1, 0.5);
                me.arcs.push(me.svg.path(`
                M ${innerR * Math.cos(2 * Math.PI * c2c / l2c) + centre} ${innerR * Math.sin(2 * Math.PI * c2c / l2c) + centre}
                A ${innerR} ${innerR} 0 ${(itemsToRender[i].arcsize / l2c) > 0.5 ? 1 : 0} 1 ${innerR * Math.cos(2 * Math.PI * (c2c + itemsToRender[i].arcsize) / l2c - 0.001) + centre} ${innerR * Math.sin(2 * Math.PI * (c2c + itemsToRender[i].arcsize) / l2c - 0.001) + centre}
                L ${middleR * Math.cos(2 * Math.PI * (c2c + itemsToRender[i].arcsize) / l2c - 0.001) + centre} ${middleR * Math.sin(2 * Math.PI * (c2c + itemsToRender[i].arcsize) / l2c - 0.001) + centre}
                A ${middleR} ${middleR} 0 ${(itemsToRender[i].arcsize / l2c) > 0.5 ? 1 : 0} 0 ${middleR * Math.cos(2 * Math.PI * c2c / l2c) + centre} ${middleR * Math.sin(2 * Math.PI * c2c / l2c) + centre}
                L ${innerR * Math.cos(2 * Math.PI * c2c / l2c) + centre} ${innerR * Math.sin(2 * Math.PI * c2c / l2c) + centre}
                Z
                `).attr({
                    fill: `rgba(${cols[0]},${cols[1]},${cols[2]},${opacity})`
                    , stroke: '#000'
                    , 'stroke-width': 1
                }).data('item', i));//.mouseover((e) => { me.showCentre(e) }).mouseout(() => { me.showCentre() }));
                //label it
                //upside down text is hard to read.
                let rotationAngle = 360 * (c2c + itemsToRender[i].arcsize / 2) / l2c;
                if (rotationAngle > 270) rotationAngle = rotationAngle - 360;
                if (rotationAngle > 90) rotationAngle = -(180 - rotationAngle);
                //limit the text so we dont print everything
                let printableText = core.items[i][this.settings.nameProp];
                if (printableText) printableText = printableText.slice(0, 30);
                if (core.items[i][this.settings.nameProp]) me.arcs.push(me.svg.text(printableText.slice(0, 15) + "\n" + printableText.slice(15, 30)).cx((innerR + (middleR - innerR) / 2) * Math.cos(2 * Math.PI * (c2c + itemsToRender[i].arcsize / 2) / l2c) + centre).cy(
                    (innerR + (middleR - innerR) / 2) * Math.sin(2 * Math.PI * (c2c + itemsToRender[i].arcsize / 2) / l2c) + centre
                ).attr({
                    fill: '#000'
                    , stroke: '#000'
                    , 'stroke-width': 1
                }).data('item', i).rotate(rotationAngle)
                );
                //draw a sector for its children
                if (Object.keys(itemsToRender[i].children).length) {
                    for (j in itemsToRender[i].children) {
                        let cols = hslToRgb(((core.items[j][this.settings.confidenceProp] || 0)) * 0.3, 1, 0.5);
                        me.arcs.push(me.svg.path(`
                            M ${middleR * Math.cos(2 * Math.PI * c2c / l2c) + centre} ${middleR * Math.sin(2 * Math.PI * c2c / l2c) + centre}
                            A ${middleR} ${middleR} 0 ${l2c == 1 ? 1 : 0} 1 ${middleR * Math.cos(2 * Math.PI * (c2c + 1) / l2c - 0.001) + centre} ${middleR * Math.sin(2 * Math.PI * (c2c + 1) / l2c - 0.001) + centre}
                            L ${outerR * Math.cos(2 * Math.PI * (c2c + 1) / l2c - 0.001) + centre} ${outerR * Math.sin(2 * Math.PI * (c2c + 1) / l2c - 0.001) + centre}
                            A ${outerR} ${outerR} 0 ${l2c == 1 ? 1 : 0} 0 ${outerR * Math.cos(2 * Math.PI * c2c / l2c) + centre} ${outerR * Math.sin(2 * Math.PI * c2c / l2c) + centre}
                            L ${middleR * Math.cos(2 * Math.PI * c2c / l2c) + centre} ${middleR * Math.sin(2 * Math.PI * c2c / l2c) + centre}
                            Z
                            `).attr({
                            fill: `rgba(${cols[0]},${cols[1]},${cols[2]},${opacity})`
                            , stroke: '#000'
                            , 'stroke-width': 1
                        }).data('item', j));//.mouseover((e) => { me.showCentre(e) }).mouseout(() => { me.showCentre() }));
                        //label it
                        //upside down text is hard to read.
                        let rotationAngle = 360 * (c2c + 0.5) / l2c;
                        if (rotationAngle > 270) rotationAngle = rotationAngle - 360;
                        if (rotationAngle > 90) rotationAngle = -(180 - rotationAngle);
                        //limit the text so we dont print everything
                        let printableText = core.items[j][this.settings.nameProp];
                        if (printableText) printableText = printableText.slice(0, 15);
                        if (core.items[j][this.settings.nameProp])
                            me.arcs.push(me.svg.text(printableText.slice(0, 15)).cx((middleR + (outerR - middleR) / 2) * Math.cos(2 * Math.PI * (c2c + 0.5) / l2c) + centre).cy(
                                (middleR + (outerR - middleR) / 2) * Math.sin(2 * Math.PI * (c2c + 0.5) / l2c) + centre
                            ).attr({
                                fill: '#000'
                                , stroke: '#000'
                                , 'stroke-width': 1
                            }).data('item', j).rotate(rotationAngle));
                        c2c += 1;
                    }
                } else {
                    c2c += 1;
                }
                //draw an arc for its children
            }
            //draw the centre as well
            if (!me.coreText) {
                me.coreText = me.svg.text("");
            }
            if (!me.centreItem) {
                me.centreItem = me.svg.circle(innerR)
                    .data('role', 'return');
            }
            me.coreText.font({ size: 30, anchor: "middle" }).text((add) => {
                add.tspan(core.items[me.settings.currentRoot][this.settings.nameProp]);
                add.tspan((core.items[me.settings.currentRoot][this.settings.confidenceProp] * 100).toFixed(2) + "%").newLine();
            }).x(centre).cy(centre).front();
            let cols = hslToRgb(((core.items[me.settings.currentRoot][this.settings.confidenceProp] || 0)) * 0.3, 1, 0.5);
            me.centreItem.cx(centre).cy(centre).radius(innerR).attr({
                fill: `rgba(${cols[0]},${cols[1]},${cols[2]},${opacity})`
            }).data('item', me.settings.currentRoot);
            me.svg.mouseover(me.showCentre).mouseout(() => me.showCentre());
        }
        //add some click handlers
        me.rootdiv.querySelector(".svg").addEventListener("click", (e) => {
            if (e.target.parentElement.dataset.item || e.target.dataset.item) {
                let currentItem = e.target.dataset.item || e.target.parentElement.dataset.item;
                //set the centre item so we can go back up the tree
                me.centreItem.data('return', me.settings.currentRoot);
                //focus it
                container.fire("focus", { id: currentItem });
            }
        })

        if (me.storedTree) me.renderTree(me.storedTree);

        me.rootdiv.querySelector(".svg [data-role='return']").addEventListener("click", (e) => {
            if (me.centreItem.data('return') == me.settings.currentRoot) {
                me.centreItem.data('return', null);
            }
            let itm = me.rootdiv.querySelector(".svg [data-role='return']").dataset.return;
            let tree = createTree(itm);
            me.renderTree(tree);
            container.fire("focus", { sender: this, id: itm });
            if (itm) me.coreText.text(core.items[itm][this.settings.nameProp] || "Root").cx(200).cy(200);
            else me.coreText.text("Root").cx(200).cy(200);
        })
    })

    container.on("focus", (d) => {
        let id = d.id;
        //Show the item at the centre
        me.coreText.text(core.items[id][this.settings.nameProp]);
        me.coreText.cx(200).cy(200);
        me.settings.currentRoot = id;
        //render the subtree
        let tree = createTree(id);
        me.renderTree(tree);
    })

    //////////////////Handle core item updates//////////////////

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", function (d) {
        let id = d.id;
        //do stuff with the item.
        if (d.sender == "GARBAGE_COLLECTOR") return;
        if (container.visible()) {
            let tree = createTree(me.settings.currentRoot);
            me.renderTree(tree);
        }
        //return true or false based on whether we can or cannot edit the item from this container.
        //otherwise your items _may_ be deleted by the core garbage collector :/
        return false;
    });

    this.refresh = function () {
        // This is called when my parent rect is resized.
    }

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your container is started OR your container loads for the first time
        Object.assign(this.settings, d);
        let tree = createTree(me.settings.currentRoot);
        me.renderTree(tree);
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    let ops = [new _option({
        div: this.dialogDiv,
        type: "text",
        object: this.settings,
        property: "filter",
        label: "Filter items by:"
    }), new _option({
        div: this.dialogDiv,
        type: "text",
        object: this.settings,
        property: "nameProp",
        label: "Property to use for name:"
    }),
    new _option({
        div: this.dialogDiv,
        type: "text",
        object: this.settings,
        property: "confidenceProp",
        label: "Confidence property:"
    })
    ];
    this.showDialog = function () {
        // update your dialog elements with your settings
        for (let i = 0; i < ops.length; i++)ops[i].load();
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

});