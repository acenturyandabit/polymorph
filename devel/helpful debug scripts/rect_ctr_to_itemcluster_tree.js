var initialGraph = Object.entries(polymorph_core.items)
    .filter(i => i[1]._rd || i[1]._od)
    .reduce((p, i) => {
        let t = {};
        t[(i[1]._od || i[1]._rd).p] = true;
        p[i[0]] = { title: (i[1]._rd ? "RECT_" : "OPERT_" + i[1]._od.tabbarName + "_") + i[0], from: t, itemcluster: { viewData: {} } };
        p[i[0]].itemcluster.viewData["dodb"] = { x: Math.random() * 300, y: Math.random() * 300 };
        p[i[0]]["uvp2nv"] = true;
        return p
    }, {});
for (let i in initialGraph) {
    for (let j in initialGraph[i].from) {
        if (initialGraph[j]) {
            if (!initialGraph[j].to) {
                initialGraph[j].to = {}
            }
            initialGraph[j].to[i] = true;
        }
    }
}
console.log(
    JSON.stringify(
        initialGraph
    )
)