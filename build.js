let fs = require("fs");
const minify = require('@node-minify/core');
const gcc = require('@node-minify/google-closure-compiler');
let { execSync } = require("child_process");


(async () => {
    execSync("git add .");
    execSync('git commit -m "auto pre-push commit" ');
    execSync("git checkout deploy");
    // minify the files in index.html
    let indexHTMLdata = String(fs.readFileSync("index.html"));
    indexHTMLdata = indexHTMLdata.split(/\r?\n/g);
    let begin = false;
    let files = [];
    for (let line of indexHTMLdata) {
        if (!begin) {
            if (line.includes("<!--Build starts here-->")) {
                begin = true;
            }
        } else {
            let result;
            if (line.includes("<!--Build ends here-->")) {
                begin = false;
            } else if (result = /    <script src="(.+?)"><\/script>/.exec(line)) {
                //console.log(result[1]);
                files.push(result[1]);
            }
        }
    }
    minify({
        compressor: gcc,
        input: files,
        output: 'bar.js',
        callback: function (err, min) { }
    });
})
// switch to index build html
// copy the index from the cache into index html
// git add
// git commit 
// git push
