// ==UserScript==
// @name         Slither.ai
// @version      0.3
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
        var foodSize = food.sz * food.sz * 0.5;

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

    var getDrawPosition = function(vec) {
        return new Vector2(mww2 + (vec.x - view_xx) * gsc, mhh2 + (vec.y - view_yy) * gsc);
    };

    var drawLineOverlay = function(destination, colorString) {
        var canvas = document.getElementsByTagName("canvas")[2];
        var ctx = canvas.getContext("2d");
        ctx.strokeStyle = colorString;
        ctx.lineWidth = 7;

        ctx.beginPath();
        var foodLineFrom = getDrawPosition(destination);
        ctx.moveTo(foodLineFrom.x,foodLineFrom.y);

        var foodLineTo = getDrawPosition(snakePosV);
        ctx.lineTo(foodLineTo.x,foodLineTo.y);
        ctx.stroke();
    };

    // ----- /INTERFACE -----
    setInterval(function() {
        if(!playing) return;

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
                            var vectorInverse = normVec.scalarMul(1/(opponentMagnitude*opponentMagnitude));
                            sumVec = sumVec.add(vectorInverse);
                        }
                    }
                }
            }

            sumVec = sumVec.scalarMul(-1);
            var threshold = sumVec.magnitude();

            if (threshold > 0.00027) {
                var avoidDirection = directionTowards(snakePosV.add(sumVec));
                status = "AVOIDING THREAT: " + avoidDirection;
                setDirection(avoidDirection);
                drawLineOverlay(snakePosV.add(sumVec.norm().scalarMul(200)), "#FF0000");
            } else {
                if (foods.length == 0) {
                    setDirection(directionTowards(new Vector2(grd/2, grd/2)));
                    status = "GOING TOWARDS CENTRE";
                } else {
                    var closest = closestFood();
                    status = "GETTING FOOD";
                    setDirection(directionTowards(new Vector2(closest.rx, closest.ry)));
                    drawLineOverlay(new Vector2(closest.rx, closest.ry), "#7FFF00");
                }
            }

            // Update State and Screen
            repaintHeader();

            if (snake) {
                var newSnakePosV = new Vector2(snake.xx, snake.yy);
                snakeDirV = newSnakePosV.sub(snakePosV);
                snakePosV = newSnakePosV;
            }
        } catch (e) {
            console.log("Error caught: " + e);
        }
    }, 50);
})();
