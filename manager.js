var __manager_profiles=[
    {
        condition: ()=>{return isPhone()},
        files:{
            core:{p:"phoneCore.js"},
        }
    },
    {
        files:{
            templates:{p:"templates.js"},
            core_dialog:{p:"core.dialog.js"},
            core_tutorial:{p:"core.tutorial.js"},
            core:{p:"core.js"},
            operator:{p:"operator.js"},
            opSelect:{p:"operators/opSelect.js"},
            itemList:{p:"operators/itemList.js"},
            descbox:{p:"operators/descbox.js"},
            calendar:{p:"operators/calendar.js"},
            synergist:{p:"operators/synergist.js"},
            stack:{p:"operators/stack.js"},
            terminal:{p:"operators/terminal.js"},
            inspector:{p:"operators/inspector.js"},
            subframe:{p:"operators/subframe.js"},
            sorter:{p:"operators/sorter.js"},
            httree:{p:"operators/httree.js"},
            chat:{p:"operators/chat.js"},
            synergist_2:{p:"operators/synergist.2.js"},
            outputToText:{p:"saveSources/outputToText.js"},
            localforage2:{p:"saveSources/localforage2.js"},
            firebase:{p:"saveSources/firebase.js"},
            server:{p:"saveSources/server.js"},
            gdrive:{p:"saveSources/gdrive.js"},
        }
    }
];
(function (){
    let loaded=false;
    for (i=0;i<__manager_profiles.length;i++){
        if (__manager_profiles[i].condition && __manager_profiles[i].condition()){
            //load all files from phone
            scriptassert(__manager_profiles[i].files,()=>{core.start();});
            loaded=true;
        }
    }
    if (!loaded){
        scriptassert(__manager_profiles[__manager_profiles.length-1].files,()=>{core.start();});
    }
})()