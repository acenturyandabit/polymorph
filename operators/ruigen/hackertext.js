///helpful stuff///
function getRand(arr) {
    if (arr && arr.length) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    // The undefined will be returned if the empty array was passed
}


//////////fakeCode//////
fakeCode = [];
fakeCodeSettings = {
    letters: ['<br>', 'int ', '{', '}', '()', 'while ', 'if ', '==', '='],
    identifiers: ['people', 'history', 'way', 'art', 'world', 'information', 'map', 'two', 'family',
        'government', 'health', 'system', 'computer', 'meat', 'year', 'thanks', 'music', 'person',
        'reading', 'method', 'data', 'food', 'understanding', 'theory', 'law', 'bird', 'literature',
        'problem', 'software', 'control', 'knowledge', 'power', 'ability', 'economics', 'love',
        'internet', 'television', 'science', 'library', 'nature', 'fact', 'product', 'idea',
        'temperature', 'investment', 'area', 'society', 'activity', 'story', 'industry', 'media',
        'thing', 'oven', 'community', 'definition', 'safety', 'quality', 'development', 'language',
        'management', 'player', 'variety', 'video', 'week', 'security', 'country', 'exam', 'movie',
        'organization', 'equipment', 'physics', 'analysis', 'policy', 'series', 'thought', 'basis',
        'boyfriend', 'direction', 'strategy', 'technology', 'army', 'camera', 'freedom', 'paper',
        'environment', 'child', 'instance', 'month', 'truth', 'marketing', 'university', 'writing',
        'article', 'department', 'difference', 'goal', 'news', 'audience', 'fishing', 'growth',
        'income', 'marriage', 'user', 'combination', 'failure', 'meaning', 'medicine', 'philosophy',
        'teacher', 'communication', 'night', 'chemistry', 'disease', 'disk', 'energy', 'nation', 'road',
        'role', 'soup', 'advertising', 'location', 'success', 'addition', 'apartment', 'education',
        'math', 'moment', 'painting', 'politics', 'attention', 'decision', 'event', 'property',
        'shopping', 'student', 'wood', 'competition', 'distribution', 'entertainment', 'office',
        'population', 'president', 'unit', 'category', 'cigarette', 'context', 'introduction',
        'opportunity', 'performance', 'driver', 'flight', 'length', 'magazine', 'newspaper',
        'relationship', 'teaching', 'cell', 'dealer', 'finding', 'lake', 'member', 'message', 'phone',
        'scene', 'appearance', 'association', 'concept', 'customer', 'death', 'discussion', 'housing',
        'inflation', 'insurance', 'mood', 'woman', 'advice', 'blood', 'effort', 'expression',
        'importance', 'opinion', 'payment', 'reality', 'responsibility', 'situation', 'skill',
        'statement', 'wealth', 'application', 'city', 'county', 'depth', 'estate', 'foundation',
        'grandmother', 'heart', 'perspective', 'photo', 'recipe', 'studio', 'topic', 'collection',
        'depression', 'imagination', 'passion', 'percentage', 'resource', 'setting', 'ad', 'agency',
        'college', 'connection', 'criticism', 'debt', 'description', 'memory', 'patience', 'secretary',
        'solution', 'administration', 'aspect', 'attitude', 'director', 'personality', 'psychology',
        'recommendation', 'response', 'selection', 'storage', 'version', 'alcohol', 'argument',
        'complaint', 'contract', 'emphasis', 'highway', 'loss', 'membership', 'possession',
        'preparation', 'steak', 'union', 'agreement', 'cancer', 'currency', 'employment', 'engineering',
        'entry', 'interaction', 'mixture', 'preference', 'region', 'republic', 'tradition', 'virus',
        'actor', 'classroom', 'delivery', 'device', 'difficulty', 'drama', 'election', 'engine',
        'football', 'guidance', 'hotel', 'owner', 'priority', 'protection', 'suggestion', 'tension',
        'variation', 'anxiety', 'atmosphere', 'awareness', 'bath', 'bread', 'candidate', 'climate',
        'comparison', 'confusion', 'construction', 'elevator', 'emotion', 'employee', 'employer',
        'guest', 'height', 'leadership', 'mall', 'manager', 'operation', 'recording', 'sample',
        'transportation', 'charity', 'cousin', 'disaster', 'editor', 'efficiency', 'excitement',
        'extent', 'feedback', 'guitar', 'homework', 'leader', 'mom', 'outcome', 'permission',
        'presentation', 'promotion', 'reflection', 'refrigerator', 'resolution', 'revenue', 'session',
        'singer', 'tennis', 'basket', 'bonus', 'cabinet', 'childhood', 'church', 'clothes', 'coffee',
        'dinner', 'drawing', 'hair', 'hearing', 'initiative', 'judgment', 'lab', 'measurement', 'mode',
        'mud', 'orange', 'poetry', 'police', 'possibility', 'procedure', 'queen', 'ratio', 'relation',
        'restaurant', 'satisfaction', 'sector', 'signature', 'significance', 'song', 'tooth', 'town',
        'vehicle', 'volume', 'wife', 'accident', 'airport', 'appointment', 'arrival', 'assumption',
        'baseball', 'chapter', 'committee', 'conversation', 'database', 'enthusiasm', 'error',
        'explanation', 'farmer', 'gate', 'girl', 'hall', 'historian', 'hospital', 'injury',
        'instruction', 'maintenance', 'manufacturer', 'meal', 'perception', 'pie', 'poem', 'presence',
        'proposal', 'reception', 'replacement', 'revolution', 'river', 'son', 'speech', 'tea',
        'village', 'warning', 'winner', 'worker', 'writer', 'assistance', 'breath', 'buyer', 'chest',
        'chocolate', 'conclusion', 'contribution', 'cookie', 'courage', 'dad', 'desk', 'drawer',
        'establishment', 'examination', 'garbage', 'grocery', 'honey', 'impression', 'improvement',
        'independence', 'insect', 'inspection', 'inspector', 'king', 'ladder', 'menu', 'penalty',
        'piano', 'potato', 'profession', 'professor', 'quantity', 'reaction', 'requirement', 'salad',
        'sister', 'supermarket', 'tongue', 'weakness', 'wedding', 'affair', 'ambition', 'analyst',
        'apple', 'assignment', 'assistant', 'bathroom', 'bedroom', 'beer', 'birthday', 'celebration',
        'championship', 'cheek', 'client', 'consequence', 'departure', 'diamond', 'dirt', 'ear',
        'fortune', 'friendship', 'funeral', 'gene', 'girlfriend', 'hat', 'indication', 'intention',
        'lady', 'midnight', 'negotiation', 'obligation', 'passenger', 'pizza', 'platform', 'poet',
        'pollution', 'recognition', 'reputation', 'shirt', 'sir', 'speaker', 'stranger', 'surgery',
        'sympathy', 'tale', 'throat', 'trainer', 'uncle', 'youth'
    ],
    verbs: ['identify', 'searchFor', 'redirect', 'initialise', 'resolve', 'analyze', 'sendTo', 'tryDestroy'],
    quant_properties: ['length', 'list_length'],
    genRID: (v) => {
        if (Math.random() > 0.5) return getRand(v.data.identifiers);
        else return Math.floor(Math.random() * 100);
    },
    comparators: ['==', '>=', '<=', '>', '<', '!='],
    generators: [
        (v) => { //create identifier
            if (v.data.identifiers.length > v.rt.clientWidth / 40) return 1;
            let newID = fakeCodeSettings.identifiers[Math.floor(Math.random() * fakeCodeSettings
                .identifiers
                .length)];
            v.data.identifiers.push(newID);
            k = document.createElement("span");
            k.innerText = "var " + newID + ";";
            return k;
        },
        (v) => { //delete identifier
            let dedID = v.data.identifiers.pop();
            if (!dedID) return 1;
            k = document.createElement("span");
            k.innerText = "delete " + dedID + ";";
            return k;
        },
        (v) => { //act
            let cid = getRand(v.data.identifiers);
            if (!cid) return 1;
            let args = [];
            n = Math.random() * v.data.identifiers.length - 1;
            for (var i = 0; i < n; i++) args.push(getRand(v.data.identifiers));
            getRand(fakeCodeSettings.verbs);
            k = document.createElement("span");
            k.innerText = cid + "." + getRand(fakeCodeSettings.verbs) + "(" + args
                .join(
                    ",") + ");";
            return k;
        }, (v) => { //create an if statement
            if (v.data.indent > v.rt.clientWidth / 150) return 1;
            let cid = getRand(v.data.identifiers);
            if (!cid) return 1;
            let other = fakeCodeSettings.genRID(v);
            k = document.createElement("span");
            k.innerText = "if (" + cid + getRand(fakeCodeSettings.comparators) + other + "){";
            v.data.post_indent = 1;
            return k;
        }, (v) => { //close the code
            if (v.data.indent == 0) return 1;
            v.data.indent--;
            k = document.createElement("span");
            k.innerText = "}"
            return k;
        }, (v) => { //Create a while loop
            if (v.data.indent > v.rt.clientWidth / 150) return 1;
            let cid = getRand(v.data.identifiers);
            if (!cid) return 1;
            let other = fakeCodeSettings.genRID(v);
            k = document.createElement("span");
            k.innerText = "while (" + cid + getRand(fakeCodeSettings.comparators) + other + "){"
            v.data.post_indent = 1;
            return k;
        }
    ]
}


function startHackerText() {
    $("head").append(`
    <style>
        .hackertext {
            font-family: monospace;
            color: lightgreen;
            font-size: 15px;
            overflow: hidden;
            position: relative;
            background-color:black;
            text-align: left;
            width: 100%;
        }

        .hackertext>div {
            position: absolute;
            bottom: 0px;
            border: none;

        }

        .hackertext>div>span {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            animation: typing 0.7s steps(40, end);
        }

        @keyframes typing {
            from {
                width: 0
            }

            to {
                width: 100%
            }
        }

        
</style>`)
    let things = document.getElementsByClassName("hackertext");
    for (i = 0; i < things.length; i++) {
        e = things[i];
        dv = document.createElement("div");
        e.append(dv);
        fakeCode.push({
            div: dv,
            rt: e,
            data: {
                indent: 0,
                identifiers: [],
            }
        });
    }
    fakeCode.forEach(propagateHack);
}

function propagateHack(v, i) {
    while ((k = fakeCodeSettings.generators[Math.floor(Math.random() * fakeCodeSettings
            .generators
            .length)](v)) == 1);
    k.style["margin-left"] = (v.data.indent * 20) + "px";
    $(v.div).append(k);
    if (v.data.post_indent) {
        v.data.indent++;
        v.data.post_indent = 0;
    }
    while ($(v.div).children().length > 60) {
        $(v.div).find("span:lt(1)").remove();
    }
    setTimeout(() => {
        propagateHack(v, i)
    }, Math.log(k.innerHTML.length) * 200 + 200);
}

if (document.readyState != "loading") startHackerText(); else document.addEventListener("DOMContentLoaded", startHackerText);