# Why polymorph?
Polymorph is a open, heavily-customizable all-in-one knowledge management system. But what do these four concepts actually mean?

## Knowledge management system
Underneath each polymorph instance is the polymorph document. A polymorph document is a list of items, which may be tasks, thoughts, or ideas. As a user, you can add, update, delete and visualise these items through a variety of forms, known as _operators_.

A key tenet of polymorph is that information should be free from its mode of representation. For instance, consider a hierarchy of elements:
- Vegetable
    - carrot
    - potato
- Fruit
    - apple
    - peach
You could represent this as bullet points, or as a graph, or you could forgo the hierarchy entirely and just have a list. However, most platforms would confine you to only one of these representations. Polymorph doesn't do that, because sometimes collections of concepts can carry different meaning when represented in different ways.

To achieve this, each polymorph operator can look at the same underlying data but represent it in different ways. For example, the itemcluster operator creates a graph; whilst the workflowish operator creates a nested list.
## All-in-one
To have one piece of software be able to perform the myriad of tasks that a knowledge worker (or any human for that matter) would do had been a pipe dream in the early days of software. However, in trying to create an all-in-one piece of software, a number of challenges arise:
- Specialisation: Some tasks require specialised subtasks, visualisations or operations that don't present in other tasks.
- Context switching: Users of an all-in-one software need to be able to switch between tasks seamlessly instead of dragging windows around everywhere
These two challenges proved insurmountable for developers who could more easily focus on a single enterprise need and bathe in the value it created. Sadly, consumer software experience suffered as a result, and Polymorph was created to fill this gap (at least personally).

To solve these problems, Polymorph has the following features:
- Specialisation: There is still a nontrivial gain to be made by reusing common components like lists and textareas, and polymorph makes it easy to arrange these components on-the-fly to meet novel use cases or redrafts of old ones.
- Context switching: Polymorph binds user interface elements in a (customisable!) hierarchy, meaning you can transition between sets of related elements instead of having to switch between multiple windows at a time.
## Heavily customizable
Polymorph offers both code-level customization by providing a modular open-source system, as well as customization options for the end user using its component arrangement system. This means end users can create their own systems and are not limited to the wishes of the development team.

Additionally, by separating information storage and presentation, polymorph maintains information coherence, unlike other project and knowledge management software where presentation is bound to information, meaning that upending your workflow for a more efficient one takes significantly more time.

## Open
Polymorph is free, without even a sign-up wall, and offers its source for anyone who wants to take it apart. The most innovative and vibrant games are those built for modding, and Polymorph aims to be no exception. 