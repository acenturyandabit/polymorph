## hilagit

Inspired by `git`, the `hilagit` savesource attempts to solve the problem of having multiple modifications to a document occuring at once, despite `Hi`gh `La`tency.

## How it works
1. Every item is treated like a file.
2. Both the server and a client keep a local copy of the document.
3. When the client fetches the items from the server, the client checks the `_lu_` property of every item and picks the version of the item which has been updated most recently to keep.
4. When the client pushes items to the server, the client pushes a list of all its `_lu_`s. Then the server checks which of those `_lu_`s it needs to fetch from the client, and requests them from the client who sends them over.

## Improvements
- The client has to send all the `_lu_`s at each save. If the client and server both know when the client last pulled, then the client can just keep track of the last pull time and doesn't have to send all the `_lu_`s.

