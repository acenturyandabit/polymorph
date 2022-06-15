(() => {
    // rich text
    polymorph_core.RTRenderProperty = (prop) => {
        // convert markdown into HTML
        return prop;
    }


    polymorph_core.RTParseElement = (el, id, prop) => {
        // check if there are any child images
        let deepCloned = el.cloneNode(true);
        let strayImages = 0;
        if (deepCloned.children) {
            for (c of deepCloned.children) {
                if (c.tagName == "IMG" && c.src.slice(0, 5) == "data:") {
                    strayImages++;
                    let rq = new XMLHttpRequest();
                    rq.onreadystatechange = (e) => {
                        if (rq.readyState == XMLHttpRequest.DONE) {
                            if (rq.status == 200) {
                                c.src = `${window.location.protocol}//${window.location.host}/getImage/${rq.responseText}.png`;
                            }
                            strayImages--;
                            if (strayImages == 0) {
                                // send an updateItem
                                polymorph_core.items[id][prop] = deepCloned.innerHTML;
                                polymorph_core.fire("updateItem", { id: id, sender: polymorph_core });
                            }
                        }
                    }
                    rq.open("POST", `${window.location.protocol}//${window.location.host}/saveImage`);
                    rq.setRequestHeader('Content-Type', c.src.split(/;/g)[0].slice(5));
                    rq.send(c.src);
                }
            }
        }
        // if there are, grab the url as a dataurl
        // POST the dataurl to a backend image handler
        // for now, just check whether localhost will take it
        // when it comes back, fire an updateItem to update it.
        return el.innerHTML;
    }
})();