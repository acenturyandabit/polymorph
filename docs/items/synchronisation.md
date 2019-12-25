# Static sync vs dynamic sync
I have two operators, and I want items to be shared between them. How do I do this?

Active sync is if two operators "create" the same item at the same time. This means:
- The operator that the user interacts with fires a `createItem` which is picked up by the second operator.
- If the item is deleted in one operator, it remains visible in the other operator, unless the deleteItem is called.
- We can add extra data to the item in both operators during creation.

Static sync is if two operators both have the same filter properties. This means:
- The operator that the user interacts with adds the fitler property. The second operator responds to the upateItem and renders the item.
- If the item is deleted in one operator, it is deleted in the other.
- It is quicker to setup - just set both operators' settings.filter to be the same.

As may be expected, Polymorph implements both methods. I started with static sync but then realised active sync is so much more flexible.