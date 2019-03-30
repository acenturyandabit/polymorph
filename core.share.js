// hook the html button
documentReady(() => {
    let sharebtn = document.querySelector(".banner button.sharer");
    let dlg = document.createElement("div");
    dlg.classList.add("dialog");
    dlg = dialogManager.checkDialogs(dlg)[0];
    let innerdialog = dlg.querySelector(".innerDialog");
    document.body.appendChild(dlg);
    innerdialog.innerHTML = `<h1>Sharing options</h1>
    <h2>tinyurl link:</h2>
    <button class="tinyurl">Click to generate</button>
    <iframe><iframe>
    `;
    sharebtn.addEventListener("click", function () {
        dlg.style.display = "block";
    });
    innerdialog.querySelector("button.tinyurl").addEventListener("click", function () {
        //Hacky version where we use an iframe r i p
        let ifr=innerdialog.querySelector("iframe");
        ifr.src="http://tinyurl.com/api-create.php?url=" + window.location.href;
    }   );
})