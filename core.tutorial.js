function readyTutorial(core) {
  let t = core.tutorial;
  documentReady(() => {
    t.push({
      target: document.body,
      type: "shader",
      contents: `<h1>Welcome to Polymorph!</h1><h2>Productivity, your way.</h2> `,
      to:[["Next","cnd"],["Skip"]]
    });
    t.push({
      id:"cnd",
      target: ()=>{return core.baseRect.outerDiv},
      type: "internal",
      location:'left',
      contents: `<p>Shift-Click and drag this border to split the item! (Then, just click and drag to resize)</p>`,
      to:[["Next","clickop"],["Skip"]]
    });
    t.push({
      id:"clickop",
      target: ()=>{return core.baseRect.outerDiv},
      type: "internal",
      location:'bottom',
      contents: `<p>These boxes contain operators. Click an operator type to get started!</p>`,
      to:[["Next","save"],["Skip"]]
    });
    t.push({
      id:"save",
      target: document.body,
      type: "shader",
      contents: `<p>To save your work, simply press Ctrl-S. Your work will be saved in your browser.</p>`,
      to:[["Done"]]
    });
  });
}