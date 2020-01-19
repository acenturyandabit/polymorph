//cold fill for phones?

if (!isPhone()) {
    let topbarCache = [];
    polymorph_core.topbar = {
        add: (address, content, click) => {
            topbarCache.push({ address: address, content: content, click: click });
        }
    }
    polymorph_core.on("UIstart", () => {
        topbarCache.sort((a, b) => a.address > b.address);
        console.log(topbarCache);
        //add the topbar
        document.querySelector(".topbar").appendChild(htmlwrap(`<li><a class="docName"></a></li>`))
        //change the adder
    });
    /*let addressbits = address.split("/");
    for (let i in addressbits) {
    }*/
} else {
    polymorph_core.topbar = {
        add: (address, content, click) => {
            //we'll deal with this otherwise...
            //actions tab next to operators tab?? sounds good
        }
    }
}