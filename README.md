# Polymorph
[acenturyandabit.github.io/polymorph/](https://acenturyandabit.github.io/polymorph/)

![](https://raw.githubusercontent.com/acenturyandabit/polymorph/largeAssets/assets/readme2.gif)

Polymorph is a very fancy to-do-list that puts you in charge of what it does. With a bit of creativity, you can turn Polymorph into a Knowledge Base, Contact Management System, or automate your entire workflow, without getting into all the code.

Polymorph runs in your browser; out of the box, polymorph has:
- A Workflowy Emulator (workflowish);
- A Mind map generator (itemcluster);
- A To-do list (itemList);
- A scripting interface (scriptRunner)
and a few other odds and ends.

## The Polymorph Edge
Sure, polymorph provides you with elements such as lists, drilldowns, and graphs, but its real superpower is its **incredibly space-efficient organisation framework**. In Polymoprh, you can subdivide your window into functional rectangular areas, and imbue those areas with the elements above. Maybe you want a list next to a graph, or two lists for separate things; Polymorph can do it all. 

Tabs are used to provide quick configuration options and provide flexibility, and a script runner element allows you to automate parts of your workflow such as time logging and organisation. 

This highly modular approach allows you to take charge of your task organisation in a way that no other platform will allow (apart from building up a task management app yourself from scratch, that is.) At the same time, we know you won't be rebuilding your task management system everyday, so modification elements are out-of-the-way until you summon them with a press of a button.

If you'd like to run polymorph with a server backing it, check out the self-hostable `polymorph_backend` project here: [https://github.com/acenturyandabit/polymorph_backend]
## Keeping it straight
Polymorph doesn't use React or Angular or Vue. This means that anyone who knows javascript can contribute; there are no dependencies to install; and code isn't obfuscated*, meaning you can edit it during runtime from the browser.

Polymorph doesn't need to run on a server, just a browser; and Polymorph will be always open source. This means anyone can fork, clone and edit, and mod to their heart's content. 

*: Code is concatenated instead of compiled for deployment, which prevents multiple source downloads, often a bigger load-time-killer than download. 

## Contributing
Check out the developer readme in `/docs/dev/README.md`, then see the issues list! I fix most of my own issues because Polymorph is my day-to-day, but there's always nice-to-haves.

### Apps I admire and have copied
- Workflowy: [https://workflowy.com/] - use the workflowish operator in Polymorph for this.
