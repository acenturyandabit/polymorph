function _itemcluster_extend_contextmenu_entropy() {
    let simAnneal = htmlwrap(`<li>Simulated annealing</li>`);
    let simAnneal1 = htmlwrap(`<li>Simulated annealing (tick once)</li>`);
    let simAnnealc = htmlwrap(`<li>Continuous Simulated annealing (toggle)</li>`);
    this.rootContextMenu.appendChild(simAnneal);
    this.rootContextMenu.appendChild(simAnneal1);
    this.rootContextMenu.appendChild(simAnnealc);

    let doSimulatedAnnealing = (nIters) => {
        let visibleItems = this.getVisibleItems();
        // convert into dictionary
        visibleItems = visibleItems.reduce((p, i) => {
            p[i.id] = {
                id: i.id,
                x: i.x,
                y: i.y,
                children: i.children.reduce((q, i) => { q[i] = true; return q }, {})
            }
            return p;
        }, {});

        // pin an arbitrary item
        let dist = (i1, i2) => {
            return Math.sqrt(
                (visibleItems[i1].x - visibleItems[i2].x) ** 2 + (visibleItems[i1].y - visibleItems[i2].y) ** 2
            )
        }

        // biject all edges
        for (let v in visibleItems) {
            for (let c in visibleItems[v].children) visibleItems[c].children[v] = true;
        }

        // negative numbers attract
        let noItems = Object.keys(visibleItems).length;
        let aversionRadius = 200 * (noItems ** 0.5);
        let rangeMaintenance = (d) => -Math.log(d / aversionRadius);
        let attraction = () => -1;

        let OP = Object.entries(visibleItems).reduce((p, i) => {
            p[i[0]] = {};
            Object.assign(p[i[0]], i[1]);
            return p;
        }, {});

        for (let iteration = 0; iteration < nIters; iteration++) {
            for (let i1 in visibleItems) {
                for (let i2 in visibleItems) {
                    if (i1 != i2) {
                        let pairDist = dist(i1, i2);
                        // apply repulsion
                        let dPairDist = rangeMaintenance(pairDist);
                        if (i2 in visibleItems[i1].children) {
                            dPairDist += attraction();
                        }
                        // move both i2 relative to i1, but dont move last (root) item
                        let dt = Math.atan2((visibleItems[i2].y - visibleItems[i1].y), (visibleItems[i2].x - visibleItems[i1].x));
                        visibleItems[i2].x = visibleItems[i1].x + (pairDist + dPairDist) * Math.cos(dt);
                        visibleItems[i2].y = visibleItems[i1].y + (pairDist + dPairDist) * Math.sin(dt);
                        dt = Math.atan2((visibleItems[i1].y - visibleItems[i2].y), (visibleItems[i1].x - visibleItems[i2].x));
                        visibleItems[i1].x = visibleItems[i2].x + (pairDist + dPairDist) * Math.cos(dt);
                        visibleItems[i1].y = visibleItems[i2].y + (pairDist + dPairDist) * Math.sin(dt);
                    }
                }
            }
            // renormalize to 0,0
            let sumX = 0;
            let sumY = 0;
            for (let i in visibleItems) {
                sumX += visibleItems[i].x;
                sumY += visibleItems[i].y;
            }
            for (let i in visibleItems) {
                visibleItems[i].x -= sumX / noItems;
                visibleItems[i].y -= sumY / noItems;
            }
        }
        let sdt = 0;
        for (let i in visibleItems) {
            sdt += Math.sqrt(
                (visibleItems[i].x - OP[i].x) ** 2 + (visibleItems[i].y - OP[i].y) ** 2
            )
        };
        console.log("final deltas: " + sdt);
        Object.values(visibleItems).map((i, ii) => {
            polymorph_core.items[i.id].itemcluster.viewData[this.settings.currentViewName].x = i.x;
            polymorph_core.items[i.id].itemcluster.viewData[this.settings.currentViewName].y = i.y;
            //polymorph_core.items[i.id].title = ii; // useful for debugging
            this.container.fire("updateItem", { id: i.id, sender: this });
            this.arrangeItem(i.id);
        });
    }
    simAnneal.addEventListener("click", (e) => {
        doSimulatedAnnealing(100);
    });

    simAnneal1.addEventListener("click", (e) => {
        doSimulatedAnnealing(1);
    });

    let tickContinuousSimAnneal = -1;
    simAnnealc.addEventListener("click", (e) => {
        if (tickContinuousSimAnneal != -1) {
            clearInterval(tickContinuousSimAnneal);
            tickContinuousSimAnneal = -1;
        } else {
            doContinuousTick();
        }
    });

    let lastTime = 0;
    let doContinuousTick = () => {
        lastTime = Date.now();
        doSimulatedAnnealing(30);
        tickContinuousSimAnneal = setTimeout(doContinuousTick, lastTime - Date.now() + 200);
    }

}