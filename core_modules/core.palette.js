///////////////////////////////////////////////////////////////////////////////////////
//palette functions

/*
Palette looks like this:
{
    rectOuterDivColour: "rgba(stuff)",
    rectInnerDivColour: optional - defaults to rectOuterDivColour
    rectTabColour: optional - defaults to rectOuterDivColour
    containerInnerColour 
}



*/

polymorph_core.rect.prototype.changePalette = function (palette) {
    this.outerDiv.style.background = palette.rectOuterDivColour;
    this.innerDivs.forEach((v) => {
        v.style.background = palette.rectInnerDivColour || palette.rectOuterDivColour;
    })
    this.tabspans.forEach((v) => {
        v.style.background = palette.rectTabColour || palette.rectOuterDivColour;
    })
    this.passthrough("changePalette",palette);
}

polymorph_core.changePalette = function (palette) {
    for (let i in polymorph_core.baseRects) {
        polymorph_core.baseRects[i].changePalette(palette);
    }
}

polymorph_core.container.prototype.changePalette = function (palette) {
    this.topdiv.style.background = palette.containerInnerColour;
}

polymorph_core.on("UIstart", () => {
    let paletteDialog = document.createElement('div');
    paletteDialog.classList.add("dialog");
    paletteDialog = dialogManager.checkDialogs(paletteDialog)[0];
    innerDialog = paletteDialog.querySelector(".innerDialog");
    document.body.appendChild(paletteDialog); // where root is the document
    let d = document.createElement("div");
    d.innerHTML = `
    <h2>Palette management</h2>
    <select class="palettes">
    </select>
    <div class="paletteBody">
        <!--a bunch of controls-->
    </div>
    <!-- for later
    <button class="acpl">Activate palette</button>
    <button class="npl">New palette</button>
    <button class="clnpl">Clone palette</button>
    -->
    <button>Change to blue palette<button>
    `;
    d.querySelector("button").addEventListener("click", () => {
        polymorph_core.changePalette({
            rectOuterDivColour: "blue",
            rectInnerDivColour: "blue",
            rectTabColour: "blue",
            containerInnerColour: "blue"
        })
    })
    innerDialog.appendChild(d);

    document.querySelector(".palettedialog").addEventListener("click", () => {
        paletteDialog.style.display = "block";
    })
});
