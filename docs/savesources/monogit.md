## monogit

Given the failures of the backend implementation of `hilagit`, the `monogit` save source allows large documents to be saved incrementally, reducing both bandwidth and storage requirements.

### How it works
1. At load time, the gitlite save source keeps a record of the saved status of each item. Every item starts saved. 
2. When items are updated (notified through an `updateItem` event), the item is flagged as unsaved. 
3. When the user presses save, the gitlite operator sends the unsaved items to a backend. 
4. The backend may choose to respond with a list of items which have changed if the document is being edited by multiple individuals; and the gitlite operator will propagate those changes to the user. 

