(() => {

    /*let customCSSDialog = document.createElement("div");
    loadDialog.classList.add("dialog");
    customCSSDialog = dialogManager.checkDialogs(
        customCSSDialog, { zIndex: 999 })[0];
    let customCSSInnerDialog = document.querySelector(".innerDialog");
    customCSSInnerDialog.innerHTML = `
    <h2>Edit the background css here.</h2> 
    <textarea style="width: 100%; height: calc(100% - 50px); resize:none">
    `;
    document.body.appendChild(customCSSDialog);
    */
    let customCSSInnerDialog = document.createElement("div");
    customCSSInnerDialog.innerHTML = `
    <h2>Edit the css here.</h2> 
    <p>Background css</p>
    <textarea class="bgcss" style="width: 100%; height: 10vh; resize:none"></textarea>
    <p>Rect colors</p>
    <textarea class="rtcss" style="width: 100%; height: 30vh; resize:none"></textarea>
    <button class='save'>Save</button><button class='reset'>Reset</button>
    `;

    // Background css
    let base_css = {
        bg: `
.rectspace{
    background: url('assets/purplestars.jpeg');
}
    `,
        rt: `
.tab.active{
    background: #8093FF;
}

.tab{
    background:#C074E8;
}

.rect_outer_div{
    background:rgba(230, 204, 255,0.1);
}
    `
    };
    let cssTextarea = customCSSInnerDialog.querySelector(".bgcss");
    let rtcssTextarea = customCSSInnerDialog.querySelector(".rtcss");
    let saveBtn = customCSSInnerDialog.querySelector(".save");
    let resetBtn = customCSSInnerDialog.querySelector(".reset");

    let storedCSS;
    try {
        storedCSS = JSON.parse(localStorage.getItem("custom-css"));
    } catch (e) {}
    if (!storedCSS) storedCSS = Object.assign({}, base_css);
    cssTextarea.value = storedCSS.bg;
    rtcssTextarea.value = storedCSS.rt;

    let globalStyleElement = document.createElement("style");
    document.body.appendChild(globalStyleElement);
    let updateCSS = () => {
        storedCSS.bg = cssTextarea.value;
        storedCSS.rt = rtcssTextarea.value;
        localStorage.setItem("custom-css", JSON.stringify(storedCSS));
        globalStyleElement.innerHTML = storedCSS.bg + "\n" + storedCSS.rt;
        // update all containers
        for (let ctr in polymorph_core.containers) {
            if (polymorph_core.containers[ctr].operator) {
                polymorph_core.containers[ctr].operator.rootStyle.innerHTML = storedCSS.rt;
            }
        }
    };
    updateCSS();
    polymorph_core.updateCSS = updateCSS;

    saveBtn.addEventListener("click", updateCSS);

    resetBtn.addEventListener("click", (e) => {
        cssTextarea.value = base_css.bg;
        rtcssTextarea.value = base_css.rt;
        updateCSS();
    });

    (() => {
        polymorph_core.on("UIstart", () => {
            polymorph_core.topbar.add("File/Custom CSS").addEventListener("click", () => {
                polymorph_core.dialog.prompt(customCSSInnerDialog);
            });
        });
    })();

})();