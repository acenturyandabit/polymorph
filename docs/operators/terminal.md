Interacting with the terminal over websockets:
1. create a ws server
2. on connect, send commands

ws commands:
- upii (\w+) (.+?) : update item $1 with $2 json. (Uses object.assign.)