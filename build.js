let fs = require("fs");
const compressor = require('node-minify');
let { execSync } = require("child_process");


(async () => {
    execSync("git add .");
    execSync('git commit -m "auto pre-push commit" ');
    execSync("git checkout deploy");
    try {
        execSync("git merge master");
    } catch (err) {
        console.log("merge failed, please resolve.");
        return;
    }
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
    await new Promise((res) => {
        compressor.minify({
            compressor: gcc,
            input: files,
            output: 'deploy.js',
            callback: res
        });
    });

    execSync("rename index.html index-temp.html");
    execSync("copy index_deploy.html index.html");
    execSync('git commit -m "auto-deploy"');
    execSync('git push');
    execSync('git checkout master');
})()
// switch to index build html
// copy the index from the cache into index html
// git add
// git commit 
// git push
