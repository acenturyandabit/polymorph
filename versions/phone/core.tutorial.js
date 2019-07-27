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

    t.push({
      id: "ideas",
      target: ()=>{return document.body},
      type: "shader",
      contents: `<h1>Ideas with Polymorph</h1><h2>A whole new space for ideas to grow!</h2> `,
      to:[["Next","idlist"],["Skip"]]
    });
    t.push({
      id:"idlist",
      target: ()=>{return core.getOperator("nvd5b4").topdiv},
      type: "internal",
      location:'center',
      contents: `<p>Here's a list of ideas! Click an idea to view more detail about it.</p>`,
      to:[["Next","idfs"],["Skip"]]
    });
    t.push({
      id:"idfs",
      target: ()=>{return core.baseRect.children[1].outerDiv},
      type: "internal",
      location:'top',
      contents: `<p>This frame contains various aspects of a project. You can click any of the purple tabs to switch between frames!</p>`,
      to:[["Next","idsv"],["Skip"]]
    });
    t.push({
      id:"idsv",
      target: document.body,
      type: "shader",
      contents: `<h1>Sharing</h1>
      <p>This document is saved in realtime, so you can collaborate with your friends. Just share the link up the top!</p>`,
      to:[["Done"]]
    });
  });
}


///////////////////////////////////////////////////////////////////////////////////////
//Also handle individual tutorials.
core.on("titleButtonsReady",()=>{
  document.querySelector("li.hleptute").addEventListener("click", ()=>{
    core.target().then((id)=>{
      if (core.getOperator(id).baseOperator.startTutorial)core.getOperator(id).baseOperator.startTutorial();
    })
  })
  document.querySelector("li.hlepdocs").addEventListener("click", ()=>{
    //navigate to another help file.
    window.open(window.location.path+"/docs","_blank");
  })
})
