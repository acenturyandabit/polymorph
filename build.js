let fs = require("fs");
let { execSync } = require("child_process");


(async () => {
    execSync("git add .");
    execSync('git commit -m "auto pre-push commit" ');
    execSync("git checkout master");
    try {
        execSync("git merge develop");
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
                files.push(process.cwd() + "/" + result[1]);
            }
        }
    }
    //concatenator
    fs.writeFileSync("cat.js", fs.readFileSync(files[0]));
    for (let i = 1; i < files.length; i++) {
        fs.appendFileSync("cat.js", ";\n\n");  // #safe
        fs.appendFileSync("cat.js", fs.readFileSync(files[i]));
    }


    /*console.log("minifying....");
    try {
        await compressor.minify({
            compressor: 'gcc',
            input: process.cwd() + "/cat.js",
            output: 'deploy.js',
            options: {
                compilationLevel: 'WHITESPACE_ONLY'
            }
        });
    } catch (e) {
        console.log("Errors detected: " + e);
        return;
    }

    console.log("done minifying.");
    */
    
    execSync("del index-temp.html");
    execSync("rename index.html index-temp.html");
    execSync("copy index_deploy.html index.html");
    execSync('git add .');
    execSync('git commit -m "auto-deploy"');
    execSync('git push');
    execSync('git checkout develop');
})()
// switch to index build html
// copy the index from the cache into index html
// git add
// git commit 
// git push
