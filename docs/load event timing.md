# Sequence of events from load
(n) means this is fired multiple times
- operatorAdded(n)
- UIsetup: UI is going to be setup
- UIstart: UI components have been setup.
- resetDocument
- loadDocument
-- sanitycheck
-- fromsavedata
- updateItem(n)
- updateSettings


new timing: 
- operatorAdded (n)
- UIsetup
- UIstart
- resetDocument
- loadDocument(source)
-- getFrom(source):
--- sanitycheck (the data)
---- decode
---- check if doc name is the same as expected
---- upgrade
--- integrateData(the data)
---- updateItem(n)
---- core.updateSettings (? its just the _meta item)