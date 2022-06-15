// todo: on enter or defocus, create new item
// tab to indent
polymorph_core.registerOperator("workflow", {
    displayName: "Workflowish",
    description: "Nested, plaintext lists. Workflowy emulation. Auto-upgrades to newest workflow.",
    section: "Standard",
    imageurl: "assets/operators/wkflow.PNG",
    hidden: true
}, function(container) {
    polymorph_core.items[container.id]._od.t = "workflow_gf";
    let pc = new polymorph_core.operators["workflow_gf"](container);
    pc.doImport(container.id);
    return pc;
});