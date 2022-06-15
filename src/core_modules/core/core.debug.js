polymorph_core.generateOperatorTree=()=>{
    for (let i in polymorph_core.items){
        if (polymorph_core.items[i]._od){
            if (!polymorph_core.containers[i]){
                console.log(`ERR uncontained container ${i}`);
            }
        }
        if (polymorph_core.items[i]._rd){
            if (!polymorph_core.containers[i]){
                console.log(`ERR unrected rect ${i}`);
            }
        }
    }
}