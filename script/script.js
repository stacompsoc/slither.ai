// ==UserScript==
// @name         Slither.ai
// @version      0.1
// @description  try to take over the world!
// @author       STACS
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

    // UI STUFF
    var status = "STARTING...";
    var headerDiv = document.createElement('div');
    headerDiv.style.zIndex = 100000000;
    headerDiv.style.width = "100vw";
    headerDiv.style.padding = "5px";
    headerDiv.style.height = "40px";
    headerDiv.style.background = "white";
    headerDiv.id = "botInfoHeader";
    document.getElementById("smh").appendChild(headerDiv);
    headerDiv.textContent = status;

    var repaintHeader = function() {
        headerDiv.textContent = status;
    };

    var distToPlayer = function(food) {
        return Math.abs(food.rx - snake.xx) + Math.abs(food.ry - snake.yy);
    };

    // Returns a score of how desirable a piece of food is for the player
    var foodScore = function(food) {
        var playerToFood = curSnakePos.sub(new Vector2(food.rx,food.ry));
        var foodSize = food.sz * food.sz;

        return foodSize/playerToFood.magnitude();
    };

    // Returns the piece of food the player will move towards
    // This is determined by calling "foodScore" on each piece of food
    var closestFood = function() {
        return foods.reduce(function(best,current) {
            if (current == null) return best;
            if (best == null) throw "No foods :(";
            return foodScore(best) > foodScore(current) ? best : current;
        });
    };

    var directionTowards = function(towardsPos) {
        var snakePos = new Vector2(snake.xx,snake.yy);
        var directionVec = towardsPos.sub(snakePos);
        var angle = directionVec.angle();
        var adjusted = (125 / Math.PI) * angle;
        return adjusted;
    };

    // ----- INTERFACE -----
    var setDirection = function(direction) {
        if (direction >= 0 && direction <= 250) {
            sendPacket(direction);
        } else {
            console.err("INVALID TURNING VALUE: " + direction);
        }
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
    // ----- /INTERFACE -----


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
            var threshold = sumVec.magnitude();

            if (threshold > 0.00027) {
                var avoidDirection = directionTowards(ourSnakePos.add(sumVec));
                status = "AVOIDING THREAT: " + avoidDirection;
                setDirection(avoidDirection);
            } else {
                if (foods.length == 0) {
                    setDirection(directionTowards(new Vector2(grd/2, grd/2)));
                    status = "GOING TOWARDS CENTRE";
                } else {
                    var closest = closestFood();
                    status = "GETTING FOOD";
                    setDirection(directionTowards(new Vector2(closest.rx, closest.ry)));
                }
            }

            repaintHeader();
        } catch (e) {
            console.log("Error caught: " + e);
        }
    }, 50);
})();
