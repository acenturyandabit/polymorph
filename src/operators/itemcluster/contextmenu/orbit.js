function _itemcluster_extend_contextmenu_orbit() {
    let orbitBtn = htmlwrap(`<li class="orbit">Toggle orbit around point</li>`);
    this.rootContextMenu.appendChild(orbitBtn);
    let orbiterParams;
    orbitBtn.addEventListener("click", (e) => {
        if (orbiterParams) {
            // stop orbiting
            clearInterval(orbiterParams.interval);
            orbiterParams = undefined;
        } else {
            orbiterParams = {};

            // Find the centre to orbit around 
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            orbiterParams.cx = coords.x;
            orbiterParams.cy = coords.y;
            orbiterParams.orbitalSpeed = 0.01; // rads / tick
            orbiterParams.orbitalSpeedDropoff = 0.999; // percent
            // start orbiting
            orbiterParams.interval = setInterval(() => {
                if (this.container.visible()) {
                    let visibleItems = this.getVisibleItems();
                    visibleItems.map(i => {
                        i.r = Math.sqrt((i.x - orbiterParams.cx) * (i.x - orbiterParams.cx) + (i.y - orbiterParams.cy) * (i.y - orbiterParams.cy));
                        i.t = Math.atan2((i.y - orbiterParams.cy), (i.x - orbiterParams.cx));
                        let newAngle = i.t + orbiterParams.orbitalSpeed * (orbiterParams.orbitalSpeedDropoff ** i.r);
                        i.nx = orbiterParams.cx + i.r * Math.cos(newAngle);
                        i.ny = orbiterParams.cy + i.r * Math.sin(newAngle);
                        polymorph_core.items[i.id].itemcluster.viewData[this.settings.currentViewName].x = i.nx;
                        polymorph_core.items[i.id].itemcluster.viewData[this.settings.currentViewName].y = i.ny;
                        this.container.fire("updateItem", { id: i.id, sender: this });
                        this.arrangeItem(i.id);
                    })
                }
            }, 500);
        }
        this.rootContextMenu.style.display = "none";
    });


}