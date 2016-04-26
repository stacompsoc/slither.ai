// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://slither.io
// @grant        none
// ==/UserScript==


var Vector2 = (function() {
	var Vector2 = function(x,y) {
		this.x = x;
		this.y = y;
	};

	Vector2.prototype.magnitude = function() {
		return Math.hypot(this.x,this.y);
	};

	Vector2.prototype.norm = function() {
		var mag = this.magnitude();
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

	Vector2.prototype.toString = function() {
		return "(" + this.x + ", " + this.y + ")";
	};

	Vector2.prototype.angle = function() {
		var ang = Math.atan2(this.y,this.x);
		if(ang < 0) {
			ang += Math.PI*2;
		}
		return ang;
	};

	return Vector2;
})();


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

    var directionTowards = function(towardsPos) {
    	var snakePos = new Vector2(snake.xx,snake.yy);

    	var directionVec = towardsPos.sub(snakePos);
        
        var angle = directionVec.angle();

        var adjusted = (125 / Math.PI) * angle;
        return adjusted;
    };

    setInterval(function() {
    	if(!playing) return;

    	var ourSnakePos = new Vector2(snake.xx,snake.yy);

        try {
        	var sumVec = new Vector2(0,0);

            for (var snakeId in os) {
                if (os.hasOwnProperty(snakeId)) {
                    if (snakeId != "s" + snake.id) {
                        // Opponent Snake
                        var currentSnake = os[snakeId];

                        for (var point in currentSnake.pts) {
                            var pt = currentSnake.pts[point];

                            var opponentSegmentPos = new Vector2(pt.xx,pt.yy);

                            var vecToOpponent = opponentSegmentPos.sub(ourSnakePos);

                            var opponentMagnitude = vecToOpponent.magnitude();

                            var normVec = vecToOpponent.norm();

                            var vectorInverse = normVec.scalarMul(1/(opponentMagnitude*opponentMagnitude));

                            sumVec = sumVec.add(vectorInverse);
                        }
                    }
                }
            }

            sumVec = sumVec.scalarMul(-1);

            var threat = sumVec.magnitude();
            if (threat > 0.0003) {
                var avoidDirection = directionTowards(ourSnakePos.add(sumVec));
                console.log("AVOIDING THREAT: " + avoidDirection);
                setDirection(avoidDirection);
            } else {
                if (foods.length == 0) {
                    setDirection(directionTowards(new Vector2(grd/2, grd/2)));
                } else {
                    var closest = closestFood();
                    setDirection(directionTowards(new Vector2(closest.rx, closest.ry)));
                }
            }
        } catch (e) {
            console.log("Error caught: " + e);
        }
    }, 50);
})();
