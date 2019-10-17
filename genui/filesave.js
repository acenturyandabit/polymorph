//v0. works. full credits to Yair Levy on S/O.

function saveJSON(data,filename) {
    if ((typeof data).toLowerCase() !="string")data=JSON.stringify(data);
    let bl = new Blob([data], {
        type: "text/html"
    });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = filename;
    a.style.display="none";
    document.body.appendChild(a);
    a.click();
}