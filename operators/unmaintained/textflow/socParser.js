function __textflow_soc_parser(instance) {
    instance.parsers["soc"] = (id) => {
        let dataStore = {
            interrupts: [],//stack
            scheduledInterrupts: []//list, because you can have multiple timers for interrupts
        };
        if (!dataStore) dataStore = {};
        Object.assign(dataStore, instance.settings.SOCStore);
        instance.settings.SOCStore = dataStore;
        let initialInterrupt = dataStore.interrupts[dataStore.interrupts.length - 1];
        let prevText = polymorph_core.items[id][instance.settings.titleProperty];
        if (prevText[0] == "\\") {
            function parseCommand(prevText) {
                let readHead = 1;
                let parts = [];
                let groupingStack = [];
                let currentPart = "";
                while (readHead < prevText.length) {
                    let write = false;
                    switch (prevText[readHead]) {
                        case " ":
                            if (!groupingStack.length) {
                                //write to parts
                                parts.push(currentPart);
                                currentPart = "";
                            }
                            break;
                        case "{":
                            groupingStack.push("{");
                            write = true;
                            break;
                        case "}":
                            if (groupingStack[groupingStack.length - 1] == "{") {
                                groupingStack.pop();
                                write = true;
                            } else {
                                //there's an error, fail
                                return {};
                            }
                            break;
                        case "\"":
                            if (groupingStack[groupingStack.length - 1] == "\"") {
                                groupingStack.pop();
                            } else if (!groupingStack[groupingStack.length == "'"]) {
                                groupingStack.push("\"");
                            } else write = true;
                            break;
                        case "'":
                            if (groupingStack[groupingStack.length - 1] == "'") {
                                groupingStack.pop();
                            } else if (!groupingStack[groupingStack.length == "\""]) {
                                groupingStack.push("'");
                            } else write = true;
                            break;
                        case "\\":
                            readHead++;
                            write = true;
                            break;
                        default:
                            write = true;
                    }
                    if (write) {
                        currentPart += prevText[readHead];
                    }
                    readHead++;
                }
                parts.push(currentPart);
                if (groupingStack.length) return {};
                let command = { positionals: [] };
                command.command = parts[0];
                parts.forEach((i, _i) => {
                    if (_i == 0) return;
                    if (i.includes("{")) {
                        i = i.slice(1, i.length - 1);
                        let subparts = i.split("=");
                        command[subparts.shift()] = subparts.join("=");
                    } else {
                        command.positionals.push(i);
                    }
                })
                return command;
            }
            let command = parseCommand(prevText);
            while (command.command) {
                switch (command.command) {
                    case "interrupt":
                        let interrupt = command.positionals.join(" ");
                        if (!polymorph_core.items[interrupt]) polymorph_core.items[interrupt] = {
                            nodes: []
                        };
                        polymorph_core.items[interrupt].interruptHead = interrupt;
                        polymorph_core.items[id].interruptTopic = interrupt;
                        if (dataStore.interrupts.length) polymorph_core.items[interrupt].interruptActive = polymorph_core.items[dataStore.interrupts[dataStore.interrupts.length - 1]].interruptActive + 1;
                        else polymorph_core.items[interrupt].interruptActive = 0;
                        if (dataStore.interrupts.indexOf(interrupt) != -1) {
                            //dont duplicate it
                            dataStore.interrupts.splice(dataStore.interrupts.indexOf(interrupt), 1);
                        }
                        dataStore.interrupts.push(interrupt);
                        instance.container.fire("updateItem", { id: id });
                        instance.container.fire("updateItem", { id: interrupt });
                        break;
                    case "unshift":
                    case "return":
                        let _from = "blank";
                        let _to = "blank";
                        if (dataStore.interrupts.length) {
                            let top = dataStore.interrupts.pop();
                            if (command.command == "return") {
                                delete polymorph_core.items[top].interruptActive;
                            } else {
                                if (dataStore.interrupts.length) {
                                    polymorph_core.items[top].interruptActive = polymorph_core.items[dataStore.interrupts[0]].interruptActive - 1;
                                } else {
                                    polymorph_core.items[top].interruptActive = 0;
                                }
                                dataStore.interrupts.unshift(top);
                            }
                            _from = polymorph_core.items[top].interruptHead;
                            instance.container.fire("updateItem", { id: top });
                        }
                        if (dataStore.interrupts[dataStore.interrupts.length - 1]) {
                            _to = polymorph_core.items[dataStore.interrupts[dataStore.interrupts.length - 1]].interruptHead;
                        }
                        polymorph_core.items[id][instance.settings.titleProperty] = `\\${command.command} ${_from}>>${_to}`;
                        //allow defocus otherwise text wont update
                        setTimeout(() => instance.container.fire("updateItem", { id: id }), 100);
                        break;
                    case "query":
                        let entries=[];
                        if (command.time) {
                            let baseTime = (dateParser.extractTime(command.time)).getTime();
                            for (let i in polymorph_core.items) {
                                if (polymorph_core.items[i].interruptTopic && polymorph_core.items[i].creationDate && polymorph_core.items[i].creationDate > baseTime) {
                                    entries.push(polymorph_core.items[i][instance.settings.titleProperty]);
                                }
                            }
                            entries=entries.join("\n");
                        } else {
                            let queryTopic = command.positionals.join(" ");
                            entries = polymorph_core.items[queryTopic].nodes.map(i => polymorph_core.items[i][instance.settings.titleProperty]).join("\n");
                        }
                        let el = instance.itemListDiv.querySelector(`[data-id="${id}"]`).children[1];
                        el.innerText = entries;
                        el.style.display = "block";
                        polymorph_core.items[id].isSoCQuery = true;
                        instance.container.fire("updateItem", { id: id });
                        break;
                    case "schedule_interrupt":
                        //take the current interrupt and nerf it
                        if (initialInterrupt) {
                            let interruptToSchedule = { interrupt: initialInterrupt };
                            if (command.time) {
                                interruptToSchedule.date = (dateParser.extractTime(command.time)).getTime();
                            } else {
                                interruptToSchedule.date = Date.now() + 1000 * 30;
                            }
                            dataStore.scheduledInterrupts.push(interruptToSchedule);
                            //but also put it on the log for this thing's setInterval to take care of
                            polymorph_core.items[initialInterrupt].interruptSchedule = interruptToSchedule.date;
                            instance.container.fire("updateItem", { id: initialInterrupt });
                            command.command = "return";
                            continue;
                        }
                        break;
                }
                command.command = undefined;
            }
        }

        //all nodes, even return nodes and interrupt nodes. Interrupts should belong to the interrupt that spawned them; returns should belong to the interrupts they're in.
        polymorph_core.items[id].creationDate = Date.now();
        polymorph_core.items[id].interruptTopic = initialInterrupt;
        if (initialInterrupt) {
            if (!polymorph_core.items[initialInterrupt].nodes) polymorph_core.items[initialInterrupt].nodes = [];
            polymorph_core.items[initialInterrupt].nodes.push(id);
            instance.container.fire("updateItem", { id: initialInterrupt });
        }
        instance.container.fire("updateItem", { id: id });
    }
    setInterval(() => {
        if (instance.settings.SOCStore) {
            // 
            var u = instance.settings.SOCStore.scheduledInterrupts.filter(i => {
                if (i.date < Date.now()) {
                    //fire it! by uhm
                    //firing createItem in the operator?
                    let item = {};
                    item[instance.settings.titleProperty] = `\\interrupt ${i.interrupt}`;
                    let id = polymorph_core.insertItem(item);
                    instance.rootItems.push(id);
                    instance.container._fire("updateItem", { id: id });
                    instance.parsers['soc'](id);
                    return false;
                }
                return true;
            })
            instance.settings.SOCStore.scheduledInterrupts = u;
        }
    }, 100);
}