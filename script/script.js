// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://slither.io
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var direction = 0;
    var step = 5;

    var distToPlayer = function(food) {
        return Math.abs(food.rx - snake.xx) + Math.abs(food.ry - snake.yy);
    };

    var closestFood = function() {
        return foods.reduce(function(x,y) {
            if (y == null) return x;
            if (x == null) throw "No foods :(";
            return distToPlayer(x) > distToPlayer(y) ? y : x;
        });
    };

    // dirRads must be <= 250 and >= 0
    var setDirection = function(dirRads) {
        sendPacket(dirRads);
    };

    var enterSpeedMode = function() {
        sendPacket(253);
    };

    var exitSpeedMode = function() {
        sendPacket(254);
    };

    var sendPacket = function(val) {
        var packet = new Uint8Array(1);
        packet[0] = val;
        ws.send(packet);
    };

    setInterval(function() {
        try {
            var closest = closestFood();
            var dy = closest.ry - snake.yy;
            var dx = closest.rx - snake.xx;
            var angleToTurn = Math.atan(dy/dx) + Math.PI;
            setDirection((125 * angleToTurn) / Math.PI);
        } catch (e) {
            console.log("Error caught: " + e);
        }
    }, 50);
})();
