function bindDOM(base, el, varname, bidirectional=true) {
    //TODO: compensate for existing getters and setters; compensate for existing value.
    let val=base[varname];
    let previous=Object.getOwnPropertyDescriptor(base,varname);


    if (el.tagName.toLowerCase() == "input" || el.tagName.toLowerCase() == "textarea") {
        if (bidirectional){
            Object.defineProperty(base, varname, {
                get: () => {
                    return el.value;
                },
                set: (value) => {
                    el.value = value;
                    if (previous && previous.set){
                        previous.set(value);
                    }
                    
                }
            })
        }else{
            Object.defineProperty(base, varname, {
                get: () => {
                    return previous.get();
                },
                set: (value) => {
                    el.value = value;
                    if (previous && previous.set){
                        previous.set(value);
                    }
                    
                }
            })
        }
        
    } else {
        if (bidirectional){
            Object.defineProperty(base, varname, {
                get: () => {
                    return el.innerText;
                },
                set: (value) => {
                    el.innerText = value;
                    if (previous && previous.set){
                        previous.set(value);
                    }
                    
                }
            })
        }else{
            Object.defineProperty(base, varname, {
                get: () => {
                    return previous.get();
                },
                set: (value) => {
                    el.innerText = value;
                    if (previous && previous.set){
                        previous.set(value);
                    }
                }
            })
        }
    }
    //reset the value
    base[varname]=val;
}