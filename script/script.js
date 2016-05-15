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

    Vector2.prototype.gameDirection = function() {
        return (125 / Math.PI) * this.angle();
    };

    return Vector2;
})();


(function() {
    'use strict';

    // CONSTANTS
    var fov = 124; // Food gathering field of view (0-250)

    // STATE
    var snakeDirV = new Vector2(0,0);
    var snakePosV = new Vector2(0,0);
    var enabled = true;
    var draw = true;

    // The direction to point the player when we're next allowed to send a packet.
    var targetDirection = 0;

    // UI STUFF
    var status = "STARTING...";

    document.addEventListener('keydown', function(e) {
        if (e.keyCode == 65) {
            enabled = !enabled;
        }
    }, false);

    var repaintHeader = function() {
        var canvas = document.getElementsByTagName("canvas")[2];
        var ctx = canvas.getContext("2d");
        ctx.font = '30pt Helvetica';
        ctx.fillStyle = "#7FFF00";
        ctx.fillText("slither.ai v0.2 " + (enabled?"on":"off") + " - press 'a' to toggle", 50, 70);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("status: " + status, 50, 110);
        ctx.fill();
    };

    var distToPlayer = function(food) {
        return Math.abs(food.rx - snake.xx) + Math.abs(food.ry - snake.yy);
    };

    // Returns a score of how desirable a piece of food is for the player
    var foodScore = function(food) {
        var foodSize = food.sz;

        return foodSize/distanceToFood(food);
    };

    var distanceToFood = function(food) {
        return snakePosV.sub(new Vector2(food.rx,food.ry)).magnitude();
    };

    var foodWithinFov = function(food) {
        var towardsFood = directionTowards(new Vector2(food.rx, food.ry));
        var snakeDir = snakeDirV.gameDirection();
        return (gameAngleDifference(towardsFood, snakeDir) < (fov/2));
    };

    // Returns the piece of food the player will move towards
    // This is determined by calling "foodScore" on each piece of food
    var closestFood = function() {
        var best = foods.filter(function(food) {
            if (food == null) return false;

            if (distanceToFood(food) > 60) {
                return true;
            } else {
                if (foodWithinFov(food)) {
                    return true;
                } else {
                    return false;
                }
            }
        }).reduce(function(best,current) {
            // Find the piece of food with the best score
            if (best == null) throw "No foods :(";
            if (current == null) return best;
            return foodScore(best) > foodScore(current) ? best : current;
        }, {xx: 0, yy: 0, sz: 1});

        return best;
    };

    var directionTowards = function(towardsPos) {
        return towardsPos.sub(snakePosV).gameDirection();
    };

    var gameAngleDifference = function(a, b) {
        var phi = Math.abs(b - a) % 250;
        return phi > 125 ? 250 - phi : phi;
    };

    // ----- INTERFACE -----
    var setDirection = function(direction) {
        if (direction >= 0 && direction <= 250) {
            targetDirection = direction;
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

    var getDrawPosition = function(vec) {
        return new Vector2(mww2 + (vec.x - view_xx) * gsc, mhh2 + (vec.y - view_yy) * gsc);
    };

    var drawLineOverlay = function(destination, thickness, colorString) {
        var canvas = document.getElementsByTagName("canvas")[2];
        var ctx = canvas.getContext("2d");
        ctx.strokeStyle = colorString;
        ctx.lineWidth = thickness;

        ctx.beginPath();
        var foodLineFrom = getDrawPosition(destination);
        ctx.moveTo(foodLineFrom.x,foodLineFrom.y);

        var foodLineTo = getDrawPosition(snakePosV);
        ctx.lineTo(foodLineTo.x,foodLineTo.y);
        ctx.stroke();
    };

    // Send packet to set player's direction on a delay, to avoid running in to rate-limit.
    setInterval(function() {
        sendPacket(targetDirection);
    }, 55);

    // ----- /INTERFACE -----
    setInterval(function() {
        repaintHeader();
        if(!enabled) return;

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

                            var vecToOpponent = opponentSegmentPos.sub(snakePosV);
                            var opponentMagnitude = vecToOpponent.magnitude();

                            var normVec = vecToOpponent.norm();
                            var vectorInverse = normVec.scalarMul(3600/(gsc * (Math.pow(opponentMagnitude, 2))));
                            sumVec = sumVec.add(vectorInverse);
                        }
                    }
                }
            }

            sumVec = sumVec.scalarMul(-1);
            var threshold = sumVec.magnitude();

            if (threshold > 1) {
                var avoidDirection = directionTowards(snakePosV.add(sumVec));
                status = "avoiding threat, threshold: " + threshold.toFixed(2);
                setDirection(avoidDirection);
                drawLineOverlay(snakePosV.add(sumVec.norm().scalarMul(200)), threshold * 10, "#FF0000");
            } else {
                if (foods.length == 0) {
                    setDirection(directionTowards(new Vector2(grd/2, grd/2)));
                    status = "returning to centre";
                } else {
                    var closest = closestFood();
                    status = "feeding, threshold: " + threshold.toFixed(2);
                    setDirection(directionTowards(new Vector2(closest.rx, closest.ry)));
                    drawLineOverlay(new Vector2(closest.rx, closest.ry), 7, "#7FFF00");
                }
            }

            if (snake) {
                var newSnakePosV = new Vector2(snake.xx, snake.yy);
                snakeDirV = newSnakePosV.sub(snakePosV);
                snakePosV = newSnakePosV;
            }
        } catch (e) {
            console.log("Error caught: " + e);
        }
    }, 50);

    //setInterval(function() {
    //    repaintHeader();
    //}, 10);
})();
