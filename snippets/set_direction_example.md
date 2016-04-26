## Setting the direction of the snake

* Click "Play"
* Open the dev console
* Run the following:

```javascript
var packet = new Uint8Array(1);
var valueToSend = 253
packet[0] = valueToSend;
ws.send(packet);
```

* Watch the snake turn.

## Notes on the value
* **0-250** - send in order to turn the snake
* **253** - enter speed mode
* **254** - leave speed mode
