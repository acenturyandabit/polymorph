(() => {
    let started = false;
    let svg, _game, hud;
    let neutralColor = "grey";
    let playerColors = ["red", "blue", "green", "yellow", "purple", "pink", "orange"];
    let blobTime = 10;
    let sendFreq = 50;
    function dist(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    };

    function pathFrom(a, b) {//DFS to find path between A and B.
        if (_game.nodePathCaches[a] && _game.nodePathCaches[a][b]) return _game.nodePathCaches[a][b];
        _game.nodes.forEach(i => i.pathfromfrom = -1);
        _game.nodes[a].pathfromfrom = -2;
        let queue = [a];
        while (queue.length) {
            let top = queue.shift();
            _game.nodes[top].connections.forEach((i) => {
                if (_game.nodes[i].pathfromfrom == -1) {
                    _game.nodes[i].pathfromfrom = top;
                    queue.push(i);
                }
            })
            if (_game.nodes[top].connections.includes(b)) {
                //end
                let foremost = b;
                let result = [];
                do {
                    result.unshift(foremost);
                    foremost = _game.nodes[foremost].pathfromfrom;
                } while (foremost != -2);
                if (!_game.nodePathCaches[a]) _game.nodePathCaches[a] = {};
                _game.nodePathCaches[a][b] = result;
                return _game.nodePathCaches[a][b];
            }
        }
        return false;
    }
    let aiOptions = [{
        targeting: ["t_clonode", "t_allfirst"],
        internal: ["i_jason", "i_balance", "i_normal"],
        sending: ["s_doublecaution", "s_allnow", "s_075"]
    }, {
        targeting: "t_fork",
        internal: ["i_jason", "i_balance", "i_normal"],
        sending: ["s_doublecaution", "s_05"]
    }]

    function composeAI() {
        let sequence = [];
        let stack = [aiOptions];
        while (stack.length) {
            let top = stack.pop();
            if (top instanceof Array) {
                stack.push(top[Math.floor(Math.random() * top.length)]);
            } else if (typeof top == "string") {
                sequence.push(top);
            } else {
                for (let i in top) {
                    stack.push(top[i]);
                }
            }
        }
        return sequence;
    }
    function player(index) {
        Object.defineProperty(this, "index", {
            get: () => {
                for (let i = 0; i < _game.players.length; i++) {
                    if (this == _game.players[i]) {
                        return i;
                    }
                }
            }
        })
        this.strategy = composeAI();
        Object.defineProperty(this, "color", {
            get: () => {
                return playerColors[this.index];
            }
        })
        Object.defineProperty(this, "nodes", {
            get: () => {
                let nodes = [];
                for (let i in _game.nodes) {
                    if (_game.nodes[i].owner == this) nodes.push(_game.nodes[i]);
                }
                return nodes;
            }
        })

        if (this.strategy.includes("s_doublecaution")) {
            this.nodeMaxRecords = {};
        }
        this.update = () => {
            //create packets, or upgrade nodes
            let currentNodes = this.nodes;
            let nextNodes = {};
            for (let i = 0; i < currentNodes.length; i++) {
                let adjacentNotMine = [];
                currentNodes[i].connections.forEach(i => {
                    if (_game.nodes[i].owner != this) {
                        adjacentNotMine.push(i);
                    }
                })
                nextNodes = adjacentNotMine.reduce((p, i) => {
                    if (!p[i]) p[i] = { index: i, count: 1 };
                    else p[i].count++;
                    return p;
                }, nextNodes);
            }
            nextNodes = Object.values(nextNodes);
            if (nextNodes.length == 0) return;
            if (this.strategy.includes("t_allfirst")) {
                nextNodes.sort((a, b) => b.count - a.count);
                nextNodes = [nextNodes[0]];
            }
            nextNodes = nextNodes.map(i => i.index);
            let trySendTo = (from, to) => {
                let numToSend = _game.nodes[from].blobs - 1;
                if (_game.nodes[to].owner != this) {
                    if (this.strategy.includes("s_doublecaution")) {
                        numToSend = (this.nodeMaxRecords[to] || 0);
                    }
                }
                if (this.strategy.includes("s_05")) {
                    numToSend = Math.floor(0.5 * _game.nodes[from].blobs);
                }
                if (this.strategy.includes("s_075")) {
                    numToSend = Math.floor(0.75 * _game.nodes[from].blobs);
                }
                _game.sendPacket(this, from, to, numToSend);
            }
            currentNodes.forEach((i) => {
                let paths = nextNodes.map(n => pathFrom(i.index, n));
                let shortestPath = 1000;
                let shortestPathNext = -1;
                paths.forEach(i => {
                    if (i.length < shortestPath) {
                        shortestPath = i.length;
                        shortestPathNext = i[1];
                    }
                })
                if (!i.player[index]) i.player[index] = {};
                if (!i.player[index].sendFreq) i.player[index].sendFreq = 0;
                if (this.strategy.includes("s_doublecaution")) {
                    i.connections.forEach(i => {
                        this.nodeMaxRecords[i] = Math.max((this.nodeMaxRecords[i] || 0), (2 * _game.nodes[i].blobs) + 5);
                    })
                }
                if (i.blobs > 5 && i.player[index].sendFreq > sendFreq) {
                    //I'm allowed to send
                    let sent = false;
                    if (this.strategy.includes("t_fork")) {
                        i.connections.forEach(_i => {
                            if (_game.nodes[_i].owner != this) {
                                trySendTo(i.index, _i);
                                sent = true;
                            }
                        })
                    }
                    if (!sent && _game.nodes[shortestPathNext].owner != this) {
                        trySendTo(i.index, shortestPathNext);
                        sent = true;
                    }
                    if (!sent) {//sending to myself now
                        if (this.strategy.includes("i_jason")) {
                            let smolct = 10000;
                            let smolid = 0;
                            i.connections.forEach(_i => {
                                if (!sent && _game.nodes[_i].owner == this) {
                                    if (_game.nodes[_i].blobs < smolct) {
                                        smolid = _i;
                                        smolct = _game.nodes[_i].blobs;
                                    }
                                }
                            })
                            trySendTo(i.index, smolid);
                        } else if (this.strategy.includes("i_balance")) {
                            i.totalBlobs = i.blobs;
                            let toSend = {};
                            paths.forEach(p => {
                                toSend[p[1]] = toSend[p[1]] || 0;
                                toSend[p[1]]++;
                            })
                            for (let oi in toSend) {
                                _game.sendPacket(this, i.index, Number(oi), Math.floor(i.totalBlobs * toSend[oi] / paths.length));
                            }
                        } else {
                            trySendTo(i.index, shortestPathNext);
                            sent = true;
                        }
                    }
                    i.player[index].sendFreq = 0;
                }
                i.player[index].sendFreq++;
            });
        }
    }
    availableGameOptions = ["new_manhattan", "old_manhattan"];
    function game() {
        //create a graph
        this.nodes = [];
        this.packets = [];
        this.edges = [];//store the lines so we can delete them afterwards. 
        this.nodePathCaches = {};
        gameOptions = [];
        availableGameOptions.forEach(i => {
            if (Math.random() > 0.5) {
                gameOptions.push(i);
            }
        })
        //create 100 nodes, spaced at least k apart; 
        for (let i = 0; i < 100; i++) {
            let pad = 0.1;
            let newNode = {
                //20% pixel padding
                sendFreq: Math.floor(Math.random() * sendFreq),
                x: (pad + Math.random() * (1 - 2 * pad)) * document.body.clientWidth,
                y: (pad + Math.random() * (1 - 2 * pad)) * document.body.clientHeight,
                blobs: 3,
                owner: null,
                player: {},
                blobTimer: 0,
                shields: 3,
                type: "normal", // or 'prod' or 'shield'
                connections: []
            };
            if (gameOptions.includes("old_manhattan")) {
                newNode.x = document.body.clientWidth * (pad + (1 - 2 * pad) / 10 * (i % 10));
                newNode.y = document.body.clientHeight * (pad + (1 - 2 * pad) / 10 * Math.floor(i / 10));
            }
            if (gameOptions.includes("new_manhattan")) {
                let minside = Math.min(document.body.clientWidth, document.body.clientHeight);
                let sidelen = minside * (1 - 2 * pad) / 10;
                let rowcount = Math.floor(document.body.clientWidth * (1 - 2 * pad) / sidelen);
                newNode.x = document.body.clientWidth * pad + sidelen * (i % rowcount);
                newNode.y = document.body.clientHeight * pad + sidelen * Math.floor(i / rowcount);
            }
            this.nodes.push(newNode);
        }
        //trim ones that are too close to prevent inf loop
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                if (dist(this.nodes[i].x, this.nodes[i].y, this.nodes[j].x, this.nodes[j].y) < 40) {
                    this.nodes.splice(j, 1);
                    j--;
                }
            }
        }
        this.nodes.forEach((v, i) => v.index = i);
        //connect nearby this.nodes
        for (let i = 0; i < this.nodes.length; i++) {
            let numCon = 1 + Math.random() * 2;
            if (gameOptions.includes("old_manhattan") || gameOptions.includes("new_manhattan")) {
                numCon = 2 + Math.random() * 2;
            }
            numCon = Math.floor(numCon);
            let closests = [];
            for (let j = 0; j < this.nodes.length; j++) {
                if (i == j) continue;
                let _dist = dist(this.nodes[i].x, this.nodes[i].y, this.nodes[j].x, this.nodes[j].y);
                closests.push({ d: _dist, i: j });
            }
            closests.sort((a, b) => a.d - b.d);
            this.nodes[i].connections = closests.slice(0, numCon).map(i => i.i);
        }

        //two-way all the connections
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].connections.forEach(j => {
                if (this.nodes[j].connections.indexOf(i) == -1) {
                    this.nodes[j].connections.push(i);
                }
            })
        }

        //occasionally you have distinct groups of nodes. Make sure that each node is accessible from another, using a unionfind.
        let unions = [];
        while (unions.length != 1) {
            unions = [];
            let seen = [];
            let unionCount = 0;
            for (let i = 0; i < this.nodes.length; i++) {
                if (seen.indexOf(i) != -1) continue;
                unions.push([]);
                let pile = [i];
                while (pile.length) {
                    let topEl = pile.pop();
                    seen.push(topEl);
                    this.nodes[topEl].connections.forEach((i) => {
                        if (unions[unionCount].indexOf(i) == -1) {
                            unions[unionCount].push(i);
                            pile.push(i);
                        }
                    })
                }
                unionCount++;
            }
            if (unions.length == 1) break;
            //once union find is done, find the closest node pair for each set of unions.
            //connect them.
            //this wont connect everything first try, so loop!!!111
            for (let i = 0; i < unions.length; i++) {
                let otherUnionClosest = -1;
                let thisUnionClosest = -1;
                let otherUnionClosestDist = 1000000;
                for (let j = 0; j < unions.length; j++) {
                    if (j == i) continue;
                    for (let ei = 0; ei < unions[i].length; ei++) {
                        for (let ej = 0; ej < unions[j].length; ej++) {
                            let cdist = dist(this.nodes[unions[i][ei]].x, this.nodes[unions[i][ei]].y, this.nodes[unions[j][ej]].x, this.nodes[unions[j][ej]].y);
                            if (cdist < otherUnionClosestDist) {
                                otherUnionClosestDist = cdist;
                                otherUnionClosest = unions[j][ej];
                                thisUnionClosest = unions[i][ei];
                            }
                        }
                    }
                }
                this.nodes[thisUnionClosest].connections.push(otherUnionClosest);
                this.nodes[otherUnionClosest].connections.push(thisUnionClosest);
            }
        }


        if (this.nodes.length < 10) {
            //abort
            throw "Error: Too few nodes - retrying..."
        }
        //get some players; give them starting this.nodes

        this.players = [];
        for (let i = 0; i < 7; i++) {
            this.players.push(new player(i));
            let randomNode;
            do {
                randomNode = Math.floor(Math.random() * this.nodes.length);
            } while (this.nodes[randomNode].owner != null);
            this.nodes[randomNode].owner = this.players[this.players.length - 1];
        }
        let htmlstr = "";
        this.players.forEach((v, i) => {
            htmlstr += `<p>${playerColors[i]}:${v.strategy}</p>`
        })
        htmlstr += `<p>Game:${gameOptions}</p>`;
        hud.innerHTML = htmlstr;
        this.hasFinished = () => {
            let remainingPlayers = this.nodes.reduce((p, i) => {
                if (p.indexOf(i.owner) == -1) p.push(i.owner);
                return p;
            }, [])
            this.packets.reduce((p, i) => {
                if (p.indexOf(i.owner) == -1) p.push(i.owner);
                return p;
            }, remainingPlayers);
            if (remainingPlayers.length == 1) return true;
            return false;
        }
        this.draw = () => {
            //draw all nodes
            this.nodes.forEach((v, i) => {
                if (!v.circle) {
                    v.circle = svg.circle(20);
                    v.circle.cx(v.x).cy(v.y).fill(neutralColor);
                    v.connections.forEach((ci) => {
                        if (i > ci) {//only draw one direction
                            this.edges.push(svg.line(v.x, v.y, this.nodes[ci].x, this.nodes[ci].y).stroke({ width: 2, color: "white" }).back());
                        }
                    })
                    v.text = svg.text(String(v.blobs)).cx(v.x).cy(v.y);
                }
                if (v.owner) v.circle.fill(v.owner.color);
                else v.circle.fill(neutralColor);
                v.text.text(String(v.blobs)).cx(v.x).cy(v.y);

            })
            //draw all packets
            this.packets.forEach(i => {
                if (!i.circle) {
                    i.circle = svg.circle(10).fill(i.owner.color);
                    i.text = svg.text(String(i.blobs));
                }
                let posX = this.nodes[i.src].x + (this.nodes[i.target].x - this.nodes[i.src].x) * i.progress / i.total;
                let posY = this.nodes[i.src].y + (this.nodes[i.target].y - this.nodes[i.src].y) * i.progress / i.total;
                i.circle.cx(posX).cy(posY);
                i.text.cx(posX).cy(posY).text(String(i.blobs));
            })
        }
        this.update = () => {
            //update nodes: give stuff to people
            this.nodes.forEach(i => {
                if (i.owner) {
                    i.blobTimer++;
                    if (i.blobTimer == blobTime) {
                        i.blobTimer = 0;
                        i.blobs += (1 + Math.floor(Math.log((i.blobs + 1) / Math.log(2))));
                    }
                }
            })
            //update packets: move them
            for (let i = 0; i < this.packets.length; i++) {
                let v = this.packets[i];
                v.progress += 2;
                //nerf self if i have zero blobs (someone's killed me)
                if (v.blobs <= 0) {
                    v.circle.remove();
                    v.text.remove();
                    this.packets.splice(i, 1);
                    i--;
                } else if (v.progress >= v.total) {
                    if (this.nodes[v.target].owner == v.owner) this.nodes[v.target].blobs += v.blobs;
                    else this.nodes[v.target].blobs -= v.blobs;
                    if (this.nodes[v.target].blobs < 0) {
                        this.nodes[v.target].blobs *= -1;
                        this.nodes[v.target].owner = v.owner;
                    }
                    v.circle.remove();
                    v.text.remove();
                    this.packets.splice(i, 1);
                    i--;
                } else {
                    for (let j = i + 1; j < this.packets.length; j++) {
                        let otherPacket = this.packets[j];
                        if (v.target == otherPacket.src && v.src == otherPacket.target && v.progress + otherPacket.progress > v.total && v.owner != otherPacket.owner) {
                            //collide packets
                            if (v.blobs <= otherPacket.blobs) {
                                //kill self
                                this.packets[j].blobs -= v.blobs;
                                v.circle.remove();
                                v.text.remove();
                                this.packets.splice(i, 1);
                                i--;
                                break;
                            } else {
                                this.packets[i].blobs -= otherPacket.blobs;
                                otherPacket.blobs = 0;//and it'll clean itself up.
                            }
                        }
                    }
                    //check against other packets
                }
            }
            //update players: make decisions
            this.players.forEach(i => {
                i.update();
            })
        }
        this.sendPacket = (owner, src, targ, blobs) => {
            if (!this.nodes[src].connections.includes(targ)) {
                return false;
            }
            if (this.nodes[src].blobs < blobs) {
                return false;
            }
            this.nodes[src].blobs -= blobs;
            this.packets.push({
                src: src,
                target: targ,
                owner: owner,
                total: dist(this.nodes[src].x, this.nodes[src].y, this.nodes[targ].x, this.nodes[targ].y),
                progress: 0,
                blobs: blobs
            });
            return true;
        }
        this.destroy = () => {
            this.nodes.forEach(i => {
                i.circle.remove();
                i.text.remove();
            });
            this.packets.forEach(i => {
                i.circle.remove();
                i.text.remove();
            });
            this.edges.forEach(i => i.remove());
        }
    }
    var hidden;
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
        hidden = "hidden";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
    }

    let moveTimer = 400;
    function perStep() {
        if (!started) {
            if (polymorph_core.baseRect) {
                //start
                started = true;
                let d = htmlwrap(`
                    <div style="position:absolute; z-index:-10;width:100vw; height:100vh; top:0px;left:0px;"></div>
                `)
                d.style.top = document.querySelector(".banner").clientHeight;
                d.style.height = `calc(100vh - ${document.querySelector(".banner").clientHeight}px)`;
                d.style.background = document.querySelector(".rectspace").style.background;
                document.querySelector(".rectspace").style.background = "transparent";
                document.body.appendChild(d);
                scriptassert([["svg", "3pt/svg.min.js"]], () => {
                    svg = SVG(d);
                    hud = htmlwrap(`<div style = "position:absolute; top:0px;left:0px;color:white"></div> `);
                    hud.style.opacity = 0.1;
                    d.appendChild(hud)//HUD
                    d.children[0].style.opacity = 0.2;
                });
                document.querySelector("li.showInfluence").addEventListener("mousedown", () => {
                    d.children[0].style.opacity = 1;
                    hud.style.opacity = 0.5;
                    moveTimer = 50;
                    document.querySelector(".rectspace").style.opacity = 0.1;
                });
                function exitMouse() {
                    d.children[0].style.opacity = 0.2;
                    hud.style.opacity = 0.1;
                    moveTimer = 400;
                    document.querySelector(".rectspace").style.opacity = 1;
                }
                document.querySelector("li.showInfluence").addEventListener("mouseup", exitMouse);
                document.querySelector("li.showInfluence").addEventListener("mouseleave", exitMouse);
            }
        } else if (svg) {
            //x y owner:"" connections[] n
            //generate starting nodes
            if (!document[hidden]) {
                if (!_game) _game = new game();
                _game.update();
                _game.draw();
                if (_game.hasFinished()) {
                    _game.destroy();
                    _game = new game();
                }
            }
        }
        setTimeout(perStep, moveTimer);
    }
    perStep();
})();