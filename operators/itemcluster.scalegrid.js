function _itemcluster_extend_scalegrid(me) {
    ///////////////////////////////////////////////////////////////////////////////////////
    //When moving objects, if there is a grid, snap to the grid
    me.alignGrid = (it) => {
        if (polymorph_core.items[me.settings.currentViewName].itemcluster.grid) {
            let g = polymorph_core.items[me.settings.currentViewName].itemcluster.grid;
            if (it.x() > 0) {
                if (it.x() % g > g / 2) it.x(it.x() + (g - it.x() % g));
                else it.x(it.x() - it.x() % g);
            } else {
                if (it.x() % g < -g / 2) it.x(it.x() - (g + it.x() % g));
                else it.x(it.x() - it.x() % g);
            }
            if (it.y() > 0) {
                if (it.y() % g > g / 2) it.y(it.y() + (g - it.y() % g));
                else it.y(it.y() - it.y() % g);
            } else {
                if (it.y() % g < -g / 2) it.y(it.y() - (g + it.y() % g));
                else it.y(it.y() - it.y() % g);
            }
        }
    }

    //When pressing G and scrolling, show the grid menu. The grid should grow as 1,2,5,10,20,50 etc.
    window.addEventListener("keydown", (e) => {
        if (me.container.visible()) {
            if (e.key == "g") {
                me.gridScroll = true;
                me.viewGrid();
            }
            if (me.gridScroll) {
                if (e.key == "ArrowDown") {
                    me.handleGridScroll({ deltaY: 1 });
                } else if (e.key == "ArrowUp") {
                    me.handleGridScroll({ deltaY: -11 });

                }
            }
        }
    })
    window.addEventListener("keyup", (e) => {
        if (e.key == "g") {
            me.gridScroll = false;
            //me.hideGrid();
        }
    })
    me.handleGridScroll = (e) => {
        if (!polymorph_core.items[me.settings.currentViewName].itemcluster.grid) {
            polymorph_core.items[me.settings.currentViewName].itemcluster.grid = 0;
        }
        let g = polymorph_core.items[me.settings.currentViewName].itemcluster.grid;
        let dg = 1;
        if (e.deltaY > 0) {
            switch (g / 10 ** Math.floor(Math.log10(g))) {
                case 0:
                    dg = 1;
                    break;
                case 1:
                    dg = 2;
                    break;
                case 2:
                    dg = 5;
                    break;
                case 5:
                    dg = 10;
                    break;
            }
        } else {
            switch (g / 10 ** Math.floor(Math.log10(g))) {
                case 0:
                    dg = 0;
                    break;
                case 1:
                    if (g == 1) dg = 0;
                    else dg = 0.5;
                    break;
                case 2:
                    dg = 1;
                    break;
                case 5:
                    dg = 2;
                    break;
            }
        }

        if (g == 0 && dg != 0) g = 1;
        else g = polymorph_core.items[me.settings.currentViewName].itemcluster.grid;

        polymorph_core.items[me.settings.currentViewName].itemcluster.grid = dg * 10 ** Math.floor(Math.log10(g));

        me.viewGrid();
    }
    me.hideGrid = () => {

        if (me.tempGridPattern) {
            me.tempGridPattern.remove();
            me.tempGridPattern = undefined;
            me.tempTR.remove();
            me.tempTR = undefined;
        }
    }
    me.viewGrid = () => {
        let g = polymorph_core.items[me.settings.currentViewName].itemcluster.grid;
        //also draw on the grid - and hide it later
        me.hideGrid();
        let vb = me.svg.viewbox();
        me.tempGridPattern = me.svg.pattern(g, g, function (add) {
            add.line(0, 0, 0, g).stroke({ color: '#f06', width: 2 / vb.zoom });
            add.line(0, 0, g, 0).stroke({ color: '#f06', width: 2 / vb.zoom });
        });
        me.tempTR = me.svg.rect(vb.width, vb.height).move(vb.x, vb.y).fill(me.tempGridPattern).back();
    }
}