// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://slither.io
// @grant        none
// ==/UserScript==

function Vector2(x,y) {
	this.x = x;
	this.y = y;
};

Vector2.prototype.magnitude = function() {
	return Math.hypot(thix.x,this.y);
};

Vector2.prototype.norm = function() {
	var mag = this.magnitude;
	return new Vector2(this.x/mag,this.y/mag);
};

Vector2.prototype.scalarMul = function(scalar) {
	return new Vector2(scalar*this.x, scalar*this.y);
};

Vector2.prototype.add = function(otherVec) {
	return new Vector2(this.x + otherVec.x, this.y + otherVec.y);
};

Vector2.prototype.sub = function(otherVec) {
	return new Vector2(this.x - otherVec.x, this.y - otherVec.y);
};

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
        var radians = Math.atan2(dy, dx);

        while (radians < 0) {
            radians += Math.PI * 2;
        }

        var adjusted = (125 / Math.PI) * radians;
        return adjusted;
    };

    setInterval(function() {
        try {
            var xtot = 0;
            var ytot = 0;

            for (var snakeId in os) {
                if (os.hasOwnProperty(snakeId)) {
                    if (snakeId != "s" + snake.id) {
                        // Opponent Snake
                        var currentSnake = os[snakeId];

                        for (var point in currentSnake.pts) {
                            var pt = currentSnake.pts[point];

                            var vx = pt.xx - snake.xx;
                            var vy = pt.yy - snake.yy;

                            var len = Math.sqrt((vx*vx) + (vy*vy));

                            vx /= len;
                            vy /= len;

                            vx *= (1 / (len * len));
                            vy *= (1 / (len * len));

                            xtot += vx;
                            ytot += vy;
                        }
                    }
                }
            }

            xtot *= -1;
            ytot *= -1;

            var threat = Math.sqrt((xtot * xtot) + (ytot * ytot));
            if (threat > 0.0003) {
                var avoidDirection = directionTowards(snake.xx + xtot, snake.yy + ytot);
                console.log("AVOIDING THREAT: " + avoidDirection);
                setDirection(avoidDirection);
            } else {
                if (foods.length == 0) {
                    setDirection(directionTowards(grd/2, grd/2));
                } else {
                    var closest = closestFood();
                    setDirection(directionTowards(closest.rx, closest.ry));
                }
            }
        } catch (e) {
            console.log("Error caught: " + e);
        }
    }, 50);
})();
