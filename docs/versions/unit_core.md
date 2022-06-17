# Unit core
Polymorph has a number of core GUI features, but you may not want any of them. Perhaps you just want to take a single operator and combine it with a single save source, and be on your way. Unit-core helps you achieve this.

To use unit-core, here's what you need to do:
1. Get your own web server and serve a public site with four files: 
- `/build/unit_core.html` -> Rename this to `index.html` or whichever in your website.
- `/build/unit_core.js`
- `/src/operators/[desired operator].js` -> Rename this to `operator.js` in your website.
- `/src/savesources/[desired save source].js` -> Rename this to `savesource.js` in your website.
2. Edit the title in `unit_core.html` to reflect whatever subset of Polymorph you're using, or whatever you want :)
3. Start the engine using a userSave: `polymorph_core.start({<usersave>})`.

The usersave should allow the savesource to retrieve a well-formed polymorph document.

## Developing for unit_core
Checking your save source and operator core may be difficult with unit_core since you would be moving files around a lot. To assist with this, unit_core has a debug feature, where you can point unit_core at a particular save source and operator in this repository. To do this, open unit_core in your browser, and run the following lines in the console:
```js
localStorage.setItem("__unitcore_debug_operator","../src/operators/<your-operator>.js");
localStorage.setItem("__unitcore_debug_savesource","../src/saveSources/<your-savesource>.js");
```
Upon reload, this will load the scripts from these locations rather than from the default path of `operator.js` and `savesource.js`.

## Developing unit_core
Actually developing unit_core may be difficult also. Fortunately, there is another debug flag in unit_core that can be set to put unit_core in development mode, where it will use fileManager to load its fileset, instead of taking the concatenated `unit_core.js`:
```js
localStorage.setItem("__unitcore_debug_from","{<usersave>}");
```
Upon reload, this will use the files from `fileManager.js`, and use the provided usersave. Make sure you run `fileManager.js` using Node.js once you're done to save your changes!
