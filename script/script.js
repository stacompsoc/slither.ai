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

    var showDebug = function () {
       var div = document.createElement('div');
       div.textContent = "Hello";
       div.style.zIndex = 100000000;
       div.style.background = "white";
       document.getElementsByClassName("sadg1 nsi btnt")[1].appendChild(div);
    };

    showDebug();

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

    var directionTowards = function(x, y) {
        var dy = y - snake.yy;
        var dx = x - snake.xx;
        var angleToTurn = Math.atan(dy/dx) + Math.PI;
        return (125 * angleToTurn) / Math.PI;
    };

    setInterval(function() {
        try {
            if (foods.length == 0) {
                setDirection(directionTowards(grd, grd));
            } else {
                var closest = closestFood();
                setDirection(directionTowards(closest.rx, closest.ry));
            }
        } catch (e) {
            console.log("Error caught: " + e);
        }
    }, 50);
})();
