core.registerSaveSource("srv", function () { // a sample save source, implementing a number of functions.
    //initialise here
    this.pushAll = async function (id, data) {
        //push to the source (force save)
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                //alert("Save success!");
            }
        };
        xmlhttp.open("POST", "http://localhost:8080/latest/" + id + "-" + Date.now(), true);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(data));
    }
    this.pullAll = async function (id) {
        let xmlhttp = new XMLHttpRequest();
        let p = new Promise();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                let obj = JSON.parse(this.responseText);
                p.resolve(obj);
            } else if (this.readyState == 4) {
                //failure; direct load or backup!
                if (fail) fail();
            }
        };
        xmlhttp.open("GET", "http://localhost:8080/latest/" + id, true);
        xmlhttp.send();
        return p;
    }
    this.hook = async function (id) { // just comment out if you can't subscribe to live updates.
        //hook to pull changes and push changes.
        if (success) {
            return true;
        } else {
            return false;
        }
    }
    this.unhook = async function (id) { // just comment out if you can't subscribe to live updates.
        //unhook previous hooks.
        if (success) {
            return true;
        } else {
            return false;
        }
    }
})