# Quartermaster: moddable, self-hosted todo list.
Successor of Maido. (It was really high time for a refactor :3)

## The gist of it 
This is a simple todolist which runs off html and javascript. No docker, node.js or any of that fluff required. Just click index.html and run :)

Demo: TODO

## Core principles
You know how web kanban boards come with many features like priorities, completion percentage, and so on that you probably don't want in your face all the time?

Quartermaster doesn't do that. But it can and will support them, if you want! 

Quartermaster aims to be as simple but extensible as possible. The base is loaded with features but there is an addin api from which you can develop your own addins as you desire.

Each task only has 4 things: a name, tags (metadata), a date and a description. Aside from that, it's up to you, the user, to manage what task properties you want.

## Core features
- Powerful relative date manager. Want to do a task one hour from now? Dont type 4:32:11am 4/3/2019! Just type +1h. Easy.
- Progressive web app support! To keep it away from the rest of your hundreds of tabs.



If you want to contribute, submit a pull request! If you want features or whatnot and you want them *pronto*, email me: steeven.liu2@gmail.com

Enjoy :D


Runs off the genUI framework, made by yours truly. Standard UI components, on an include-as-you-go basis, without the overhead. Just include feature_you_want.js!