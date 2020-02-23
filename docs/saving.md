Save source design

4 basic functions of save sources:
- I pull data from you, when asked.
- I receive change orders from you, and push them to the user.
- I push change orders to you, when I change
- I push data to you, when I save.

## Firebase notes

Issue: limited bandwidth.
Solution: get changes fibbonacilly (1,1,2,3,5,8), sorting by date_changed. Stop fetching once done.

Issue: Each savesource is standalone, but we want to reduce bandwidth so we dont download the whole firebase stack, only changes.
Solution: In which case, firebase is constructed so that it caches locally and then goes to FB and updates there. This also allows offline!

## save order
1. Load from multiple sources with fallbacks.
2. Save to all sources if possible - if not then save to as many as you can. 
3. Load order shouldn't matter if we're merging, but use load order because otherwise it's too messy?
4. Load into live doc rather than load all, to save time.

Use firebase, because i just need a database and its not worth clouding up the comp server.


When making a new doc, have the option to pull from a remote server. Time to make the home operator! Can only be accessed from an empty polymorph? How is it different from filescreen then?

so, I start doc 1 on local. I push to remote by adding a savesource. [ the savesource needs to know to get pushed to rather than to pull from. ] 
I start doc 2 on local2. I tell it to connect to remote and pull doc1. 