// Game logic file

var PLAYER1_COLOR = "#ff0000";
var PLAYER2_COLOR = "#0000ff";
var PLAYER1_COLOR_NAME = "red";
var PLAYER2_COLOR_NAME = "blue";

function Game(width, height) {
	this.width = width;
	this.height = height;
	this.player1 = new Player(PLAYER1_COLOR);
	this.player2 = new Player(PLAYER2_COLOR);
	this.lastDot;
	this.currentPlayer = this.player1;
    this.copy = false;

	this.bot = Boolean(localStorage.getItem('dots_bot'));

    this.controller = new DotsController(this.bot, _username);

	this.map = new Array(width);
	for (var i = 0; i < width; i++) {
    	this.map[i] = new Array(height);
  	}
  	for (var x = 0; x < this.width; x++) {
  		for (var y = 0; y < this.height; y++) {
  			this.map[x][y] = new Cell(x, y);
  		};
  	};

    this.history = new Array();
	this.takeBackHistory = new Array();

	this.controller.gameCreated();
}

Game.prototype.setData = function(data) {
    this.width = data.width;
    this.height = data.height;

    this.clearMap();
};

Game.prototype.clearMap = function() {

    this.map = new Array(this.width);
    for (var i = 0; i < this.width; i++) {
        this.map[i] = new Array(this.height);
    }
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            this.map[x][y] = new Cell(x, y);
        };
    };

    this.history = new Array();
    this.takeBackHistory = new Array();

	this.controller.updateButtons(this.history.length);

    gameView.draw();
};

Game.prototype.getBestChoises = function() {
    var bestChoises = [];


    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            var cell = this.map[x][y];
            if (cell.color) {
                continue;
            }
            if (bestChoises.length == 0 || bestChoises[0].cost < cell.cost) {
                bestChoises = [];
                bestChoises.push(cell);
            } else if (bestChoises[0].cost == cell.cost) {
                bestChoises.push(cell);
            }
        };
    };
    return bestChoises;
};

// AI algorithm
Game.prototype.getAllBestChoises = function() {
    var bestChoises = [];
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            bestChoises = bestChoises.concat(this.map[x][y]);
        }
    };

    bestChoises.sort(function(a, b) {
        if (a.cost < b.cost)
            return 1;
        else if (a.cost > b.cost)
            return -1;
        else
            return 0;
    });

    return bestChoises;
};

Game.prototype.makeAIDecision = function (allVariants) {
    var startTime = new Date();
    var self = this;

	for (var x = 0; x < this.width; x++) {
  		for (var y = 0; y < this.height; y++) {
  			var cell = this.map[x][y];
  			cell.checked = false;
  			cell.open = false;
  			cell.capturedRegion = false;
  			cell.cost = 0;
  			cell.lastCost = 0;
  		};
  	};

  	var that = this;
  	var clearMap = function() {
  		for (var x = 0; x < that.width; x++) {
	  		for (var y = 0; y < that.height; y++) {
	  			var cell = that.map[x][y];
	  			cell.checked = false;
	  		};
	  	};
  	}

  	var summarizeCost = function() {
  		for (var x = 0; x < that.width; x++) {
	  		for (var y = 0; y < that.height; y++) {
	  			var cell = that.map[x][y];
	  			cell.cost = Math.max(cell.lastCost, cell.cost);
	  			cell.lastCost = 0;
	  		};
	  	};
  	}

  	var enemyColor = this.getEnemyColor(this.currentPlayer.color);

	var bestChoises = [];

  	for (var x = 0; x < this.width; x++) {
  		for (var y = 0; y < this.height; y++) {
  			var cell = this.map[x][y];

  			if (cell.color === this.currentPlayer.color && !cell.captured) {
  				clearMap();
  				this.findPossibleCapturesForStartingCell(cell, enemyColor);
  				summarizeCost();
  			}
  		};
  	};

  	for (var x = 0; x < this.width; x++) {
  		for (var y = 0; y < this.height; y++) {
  			var cell = this.map[x][y];
  			if (cell.color === enemyColor && !cell.captured) {
  				clearMap();
  				this.findPossibleCapturesForStartingCell(cell, this.currentPlayer.color);
  				summarizeCost();
  			}
  		};
  	};

    var bestChoises = this.getBestChoises();

    var bestChoise = bestChoises[0];

    if(allVariants) {
        return bestChoises;
    } else {
        return {x:bestChoise.x, y:bestChoise.y};
    }

}

Game.prototype.getEnemyColor = function (friendColor) {
	return friendColor == PLAYER1_COLOR ? PLAYER2_COLOR : PLAYER1_COLOR;
}

Game.prototype.findSameDotsGroup = function (startingDot) {
	for (var x = 0; x < this.width; x++) {
  		for (var y = 0; y < this.height; y++) {
  			this.map[x][y].capturedRegion = false;
  		}
  	}
	var result = new Array();
	var cellsToCheck = new Array();
	cellsToCheck.push(startingDot);
	startingDot.capturedRegion = true;
	var friendCells = new Array();
	var freeBorders = new Array();
	var isNearMapBorder = false;
	var that = this;
	var tryAddCellToGroup = function(x, y) {
		if (that.isOutOfMap(x, y)) {
			isNearMapBorder = true;
			return;
		}
		var cell = that.map[x][y];
		if (cell.capturedRegion || cell.checked) {
			return;
		}
		cell.capturedRegion = true;
		if (!cell.color) {
			freeBorders.push(cell);
			return;
		}
		if (cell.color == startingDot.color || cell.captured) {			
			friendCells.push(cell);
		}
	}
	while (cellsToCheck.length > 0) {
		friendCells = [];
		for (var i = cellsToCheck.length - 1; i >= 0; i--) {
			var cell = cellsToCheck[i];
			tryAddCellToGroup(cell.x + 1, cell.y);
			tryAddCellToGroup(cell.x - 1, cell.y);
			tryAddCellToGroup(cell.x, cell.y + 1);
			tryAddCellToGroup(cell.x, cell.y - 1);
		};
		result.push.apply(result, cellsToCheck);
		cellsToCheck = friendCells;
	}
	return {"cells": result, "freeBorders": freeBorders, "isNearMapBorder": isNearMapBorder };
}

// Estimating the value of the moves
Game.prototype.findPossibleCapturesForStartingCell = function (cell, byColor) {
	var capturedCells = new Array();
	var cellsToCheck = new Array();

	var friendCells = new Array();
	var freeCells = new Array();

	var optimalFreeCells = new Array();
	var optimalFriendCells = new Array();
	var tmpFreeCells = new Array();
	var optimalCell = undefined;
	var optimalCost = 0;

    var that = this;

    var tryAddCellToGroup = function (x, y) {
        if (that.isOutOfMap(x, y)) {
            return false;
        }
        var cell = that.map[x][y];
        if (!cell.checked) {
            if (!cell.color && !cell.captured) {
                tmpFreeCells.push(cell);
            } else if ((cell.color != byColor && !cell.captured) ||
                (cell.color == byColor && cell.captured)) {
                var region = that.findSameDotsGroup(cell);
                if (region.isNearMapBorder) {
                    return false;
                }
                tmpFreeCells.push.apply(tmpFreeCells, region.freeBorders);
                friendCells.push.apply(friendCells, region.cells);
            }
        }
        return true;
    }

    var enemyCells = [];
    var enemyColor = this.getEnemyColor(game.player2.color); // human colour
    var isYourCell = cell.color == this.currentPlayer.color;

    // If it creates an environment for you, put a dot (cost do not decrease)
    // If not, see if the encirclement interrupts the opponent.
    // if not, decrease depending on the number of points around the opponent

	var initialRegion = this.findSameDotsGroup(cell);
	
	var cost = initialRegion.cells.length  / (initialRegion.freeBorders.length * initialRegion.freeBorders.length * initialRegion.freeBorders.length);

    optimalCost = cost;
	optimalFreeCells = initialRegion.freeBorders;
	optimalFriendCells = initialRegion.cells;
	optimalCell = cell;
	
	var capturedFreeCellsCount = -1;

	while (true) {
		
		if (optimalCell) {
			capturedFreeCellsCount++;
			for (var i = cellsToCheck.length - 1; i >= 0; i--) {
				if (cellsToCheck[i] === optimalCell) {
					cellsToCheck.splice(i, 1);
					break;
				}
			}
			for (var i = optimalFreeCells.length - 1; i >= 0; i--) {
				optimalFreeCells[i].checked = true;
			};
			for (var i = optimalFriendCells.length - 1; i >= 0; i--) {
				optimalFriendCells[i].checked = true;
			};

			cellsToCheck.push.apply(cellsToCheck, optimalFreeCells);
			capturedCells.push.apply(capturedCells, optimalFriendCells);

			for (var i = cellsToCheck.length - 1; i >= 0; i--) {
				if (cellsToCheck[i].lastCost < optimalCost) {
					cellsToCheck[i].lastCost = optimalCost;
				}
			};
		} else {
			break;
		}
		
		if (cellsToCheck.length == 0) {
			break;
		}
		
		optimalFreeCells = [];
		optimalFriendCells = [];
		optimalCell = undefined;
		optimalCost = 0;
		var isFoundNextStep = false;

		for (var i = 0; i < cellsToCheck.length; i++) {
			var cellTocheck = cellsToCheck[i];	
			tmpFreeCells = [];
			friendCells = [];

			if (tryAddCellToGroup(cellTocheck.x-1, cellTocheck.y) &&
				tryAddCellToGroup(cellTocheck.x+1, cellTocheck.y) &&
				tryAddCellToGroup(cellTocheck.x, cellTocheck.y+1) &&
				tryAddCellToGroup(cellTocheck.x, cellTocheck.y-1)) {

				var wallLength = cellsToCheck.length - 1 + tmpFreeCells.length;
				var cost = (capturedCells.length + friendCells.length + (capturedFreeCellsCount + 1) * 0.25)/ (wallLength * wallLength * wallLength);

				if (!isFoundNextStep || cost > optimalCost) {
					optimalCost = cost;
					isFoundNextStep = true;
					optimalFreeCells = tmpFreeCells;
					optimalFriendCells = friendCells;
					tmpFreeCells = [];
					friendCells = [];
					optimalCell = cellTocheck;
				}
			}
		}
	}
};

Game.prototype.appendHistory = function (eventType, data) {
	this.history.push({"event":eventType, "data": data});
};

Game.prototype.switchPlayer = function () {
	if (this.currentPlayer == this.player1) {
		this.currentPlayer = this.player2;
	} else {
		this.currentPlayer = this.player1;
	}
};

Game.prototype.setCurrentPlayer = function(playerIndex) {
    if(playerIndex == 1) {
        this.currentPlayer = this.player1;
    } else if(playerIndex == 2) {
        this.currentPlayer = this.player2;
    }
};

Game.prototype.putDot = function (x, y, checkCaptures, color) {

    if(typeof this.map[x] === 'undefined') {
        throw new Error('<putDot> Wrong bounds: x '+x + ', y ' + y);
    }

	if (this.map[x][y].color || this.map[x][y].captured) {
		return false;
	}

	var dot = this.map[x][y];

    if(typeof color != "undefined") {
        if(color === 1 || color === 0) {
            dot.color = color == 1 ? this.player1.color : this.player2.color;
        } else if(color === this.player1.color || color === this.player2.color) {
            dot.color = color;
        }

    } else {
        dot.color = this.currentPlayer.color;
    }


	if (checkCaptures) {
		this.checkForNewCaptures(dot);
	}
	this.lastDot = dot;
	this.appendHistory("dot", dot);
	this.controller.updateButtons(this.history.length);

    if(this.copy) return;

	if(this.controller.type == "computer") {
		this.controller.putDot__computer(PLAYER1_COLOR == this.currentPlayer.color, x, y);
	}

	var captured = this.countCapturedDots();
	this.controller.actuator.updateCapturedDots(captured[this.controller.player1Color],captured[this.controller.player2Color]);

	return true;
}

Game.prototype.clearCheckedFlagForColor = function (color) {
	for (var x = 0; x < this.width; x++) {
  		for (var y = 0; y < this.height; y++) {
  			var cell = this.map[x][y];
  			if (cell.color == color) {
  				cell.checked = false;
  			}
  		};
  	};
}

Game.prototype.checkForNewCaptures = function (byDot) {
	for (var x = 0; x < this.width; x++) {
  		for (var y = 0; y < this.height; y++) {
  			var cell = this.map[x][y];
  			cell.checked = false;
  			cell.open = false;
  			cell.capturedRegion = false;
  		};
  	};
  	this.checkIsDotGroupCaptured(byDot.x+1, byDot.y, byDot.color);
  	this.clearCheckedFlagForColor(byDot.color);
  	this.checkIsDotGroupCaptured(byDot.x-1, byDot.y, byDot.color);
  	this.clearCheckedFlagForColor(byDot.color);
  	this.checkIsDotGroupCaptured(byDot.x, byDot.y+1, byDot.color);
  	this.clearCheckedFlagForColor(byDot.color);
  	this.checkIsDotGroupCaptured(byDot.x, byDot.y-1, byDot.color);
  	this.clearCheckedFlagForColor(byDot.color);
  	 if (this.lastDot) {
  		this.checkIsDotGroupCaptured(this.lastDot.x, this.lastDot.y, byDot.color);
	}
}

Game.prototype.markCellArraysAsOpen = function () {
	for (var i = arguments.length - 1; i >= 0; i--) {
		for (var j = arguments[i].length - 1; j >= 0; j--) {
			arguments[i][j].open = true;
		}
	}
}

Game.prototype.checkIsDotGroupCaptured = function (startX, startY, byColor) {
	if (this.isOutOfMap(startX, startY)) {
		return;
	}
	var cell = this.map[startX][startY];
	if (cell.checked || (byColor == cell.color && !cell.captured)) {
		return;
	}
	var capturedCells = new Array();
	var cellsToCheck = new Array();
	var nearCells = new Array();
	var wallCells = new Array();

	cell.checked = true;
	cellsToCheck.push(cell);
	var that = this;
	var tryAddCellToGroup = function (x, y) {
		if (that.isOutOfMap(x, y)) {
			that.markCellArraysAsOpen(cellsToCheck, capturedCells, nearCells);
			return false;
		}
		var cell = that.map[x][y];
		if (cell.checked) {
			if (cell.open) {
				that.markCellArraysAsOpen(cellsToCheck, capturedCells, nearCells);
				return false;
			}
		} else {
			cell.checked = true;
			if (byColor == cell.color && !cell.captured) {
				wallCells.push(cell);
			} else {				
				nearCells.push(cell);
			}
		}
		return true;
	}
	while (cellsToCheck.length > 0) {
		for (var i = 0; i < cellsToCheck.length; i++) {
			var cellTocheck = cellsToCheck[i];			
			if (!tryAddCellToGroup(cellTocheck.x-1, cellTocheck.y)) return;
			if (!tryAddCellToGroup(cellTocheck.x+1, cellTocheck.y)) return;
			if (!tryAddCellToGroup(cellTocheck.x, cellTocheck.y+1)) return;
			if (!tryAddCellToGroup(cellTocheck.x, cellTocheck.y-1)) return ;
			capturedCells.push(cellTocheck);
		};
		cellsToCheck = nearCells;
		nearCells = [];
	}
	var hasCapturedDots = false;
	for (var i = capturedCells.length - 1; i >= 0; i--) {
		if (capturedCells[i].color) {
			hasCapturedDots = true;
			break;
		}
	};
	if (!hasCapturedDots) {
		return;
	}
	for (var i = 0; i < capturedCells.length; i++) {
		if (capturedCells[i].color == byColor) {
			capturedCells[i].captured = false;
		} else {
			capturedCells[i].captured = byColor;
		}
	};
	this.optimizeWalls(wallCells, capturedCells);
	return;
}

Game.prototype.optimizeWalls = function (wallCells, capturedCells) {
	for (var i = wallCells.length - 1; i >= 0; i--) {
		wallCells[i].capturedRegion = true;
	};
	for (var i = capturedCells.length - 1; i >= 0; i--) {
		capturedCells[i].capturedRegion = true;
	};

	var that = this;
	var isWayFree = function(x, y) {
		if (that.isOutOfMap(x, y)) {
			return true;
		}
		return !that.map[x][y].capturedRegion;
	}

	var checkIsCellInsideRegion = function(x, y) {
		if (isWayFree(x + 1, y) ||
			isWayFree(x - 1, y) ||
			isWayFree(x, y + 1) ||
			isWayFree(x, y - 1)) {
			return false;
		}
		return true;
	}

	var realWalls = new Array();
	for (var i = wallCells.length - 1; i >= 0; i--) {
		var wall = wallCells[i];
		if (!checkIsCellInsideRegion(wall.x, wall.y)) {
			realWalls.push(wall);
		}
	};

	this.linkWalls(realWalls);
}

Game.prototype.linkWalls = function (wallCells) {
	var sorted = false;
	for (var i = wallCells.length - 1; i >= 0; i--) {
		var first = wallCells[i];
		for (var j = wallCells.length - 1; j >= 0; j--) {
			var second = wallCells[j];
			if (first === second) {
				continue;
			}
			var dx = first.x - second.x;
			var dy = first.y - second.y;
			if (dx >= -1 && dx <= 1 && dy >= -1 && dy <= 1) {
				first.makeLink(second);
			}
		};
	};

	var sortedWallCels = new Array();
	sortedWallCels.push(wallCells[0]);
	while (wallCells.length > 0) {
		var lastWall = sortedWallCels[sortedWallCels.length - 1];
		var foundNext = false;
		for (var i = wallCells.length - 1; i >= 0; i--) {
			var nextWall = wallCells[i];
			if (lastWall.findLinkTo(nextWall) || nextWall.findLinkTo(lastWall)) {
				sortedWallCels.push(nextWall);
				wallCells.splice(i, 1);
				foundNext = true;
				break;
			}			
		};
		if (!foundNext) {
			break;
		}
	}
	this.appendHistory("links", sortedWallCels);
}

Game.prototype.isOutOfMap = function (x, y) {
	return x < 0 || x >= this.width || y < 0 || y >= this.height;
}

Game.prototype.fillField = function(player1Color) {
    var yourColor = this.player1.color;
    var rivalColor = this.player2.color;
    var newEnemyDots = [];

    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            var cell = this.map[x][y];
            if (cell.color == yourColor && !cell.captured) {
                this.eachNeighbour(x, y, function(neighbour) {

                    if(neighbour && neighbour.color == undefined && !neighbour.captured) {

						newEnemyDots.push({x: neighbour.x, y: neighbour.y});
                    }
                });
            }
        }
    }

    for(var i=0; i < newEnemyDots.length; i++) {
        var n = newEnemyDots[i];
        this.putDot(n.x, n.y, true, yourColor);
    }
    gameView.draw();
	return newEnemyDots;
};

Game.prototype.eachNeighbour = function(x, y, callback) {
    var environment = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
    for(var i in environment) {
        var env = environment[i];
        var nX = x + env[0];
        var nY = y + env[1];

        if(!this.isOutOfMap(nX, nY)) {
            callback(this.map[nX][nY]);
        } else {
            callback(null);
        }
    }
};

Game.prototype.isGameOver = function (friendColor) {

	// checking if there is any space left on the field
	var allCellsCaptured = true;
	for (var x = 0; x < this.width; x++) {
		for (var y = 0; y < this.height; y++) {
			var cell = this.map[x][y];
			if (!cell.color && !cell.captured) {
				allCellsCaptured = false;
				break;
			}
		};
		if (!allCellsCaptured) {
			break;
		}
	};

	var captured = this.countCapturedDots();
	if(allCellsCaptured) return true;
	else if(captured[PLAYER1_COLOR] > 19 || captured[PLAYER2_COLOR] > 19) return true;
	else return false;
}

Game.prototype.isDraw = function() {
	var captured = this.countCapturedDots();
	if(this.isGameOver() && captured[PLAYER1_COLOR] == captured[PLAYER2_COLOR]) return true;
	else return false;
};

Game.prototype.countCapturedDots = function (friendColor) {
	var captured = new Array();
	captured[PLAYER1_COLOR] = 0;
	captured[PLAYER2_COLOR] = 0;
	for (var x = 0; x < this.width; x++) {
  		for (var y = 0; y < this.height; y++) {
  			var cell = this.map[x][y];
  			if (cell.color && cell.captured) {
  				captured[cell.color]++;
  			}
  		};
  	};
  	return captured;
}

Game.prototype.takeBackComputer = function(oneTurn) {
	var self = this;
	oneTurn = oneTurn || false;
	if(this.history.length < 2 && !oneTurn) return;

	this.map = new Array(this.width);

	for (var i = 0; i < this.width; i++) {
		this.map[i] = new Array(this.height);
	}
	for (var x = 0; x < this.width; x++) {
		for (var y = 0; y < this.height; y++) {
			this.map[x][y] = new Cell(x, y);
		}
	}

	var _history = this.history.slice();

	// Removing links from the history
	_history.forEach(function(el, index) {
		if(_history[index].event == "links") {
			_history.splice(index, 1);
		}
	});

    if(!oneTurn) {
        _history.forEach(function (el, index) {
            if (_history[index].event == "links") {
                _history.splice(index, 1);
            }
        });
    }

	this.history = new Array();

	this.takeBackHistory.push(_history.pop());
    if(!oneTurn) {
        this.takeBackHistory.push(_history.pop());
    }


	// If you have rewound to the beginning
	if(_history.length == 0) {
		gameView.draw();
	} else {
		_history.forEach(function(el, index) {
			self.putDot(el.data.x, el.data.y, true, el.data.color);
			gameView.draw();
			self.switchPlayer();
		});
	}

    // Status colour update
    if(game.controller.analysis) {
        this.fixCurrentColor();
    }


	if(oneTurn &&  game.currentPlayer.name  != 'Human') {
		game.switchPlayer();
	}

	this.controller.takeBackTakeForwardUpdate(this.history.length, this.takeBackHistory.length);
};

Game.prototype.takeBack = function() {
    if(!this.controller.lastLoadedGame) {
        throw new Error('last loaded game missing');
    }

    var c = this.controller;
    var g = c.lastLoadedGame;
    var h = g.actualHistory;
    var curentH = this.history;

    if(curentH.length == 0) {
        this.controller.actuator.rewind.clearIntervalTakeBack();
        this.fixCurrentColor();
        return;
    }

    var step = 1;

    c.takeBackCounter+=step;

    var cellsToShow = h.length  - c.takeBackCounter;
    var _h = h.slice(0, cellsToShow);
    this.loadMultipleTurns(_h);

    this.controller.takeBackTakeForwardUpdate(this.history.length, c.takeBackCounter);
};

Game.prototype.takeForward = function() {

    if(!this.controller.lastLoadedGame) {
        throw new Error('last loaded game missing');
    }

    var c = this.controller;
    var g = c.lastLoadedGame;
    var h = g.actualHistory;
    var curentH = this.history;
    var step = 1;

    if(c.takeBackCounter == 0) {
        return;
    }

    c.takeBackCounter-=step;
    var cellsToShow = h.length  - c.takeBackCounter;
    var _h = h.slice(0, cellsToShow);

    this.loadMultipleTurns(_h);
    this.controller.takeBackTakeForwardUpdate(this.history.length, c.takeBackCounter);
};

Game.prototype.fixCurrentColor = function() {
    // Updating the current colour status
    if(this.history.length > 0) {
        var lastDotColor = game.history[game.history.length - 1].data.color;
        if(lastDotColor == game.currentPlayer.color) {
            this.switchPlayer();
        }
    } else {
        this.setCurrentPlayer(1);
    }
};

Game.prototype.loadMultipleTurns = function(turns) {
    var self = this;
    this.clearMap();

    turns.forEach(function(el, index) {
        if(el.event == 'newEnemyDots') {
            var h = game.controller.lastLoadedGame.history;
            var turn = h[h.length-1].turn;

            var color = turn.fillFieldColor;

            for(var i=0; i < el.data.length; i++) {
                var newDot = el.data[i];
                self.putDot(newDot.x, newDot.y, true, color);
            }
        } else {
            self.putDot(el.data.x, el.data.y, true,  el.data.color);
            self.switchPlayer();
        }
    });

    if(game.controller.analysis) {
        this.fixCurrentColor();
    }

    gameView.draw();

    var captured = this.countCapturedDots();
    this.controller.actuator.updateCapturedDots(captured[this.controller.player1Color],captured[this.controller.player2Color]);
    this.controller.takeBackTakeForwardUpdate(this.history.length, this.takeBackHistory.length);
};

Game.prototype.toStart = function() {
    this.controller.takeBackCounter = this.controller.lastLoadedGame.actualHistory.length;
    this.clearMap();
    this.fixCurrentColor();
    this.controller.updateCapturedDots();
    this.controller.takeBackTakeForwardUpdate(this.history.length, this.controller.takeBackCounter);
};

Game.prototype.toEnd = function() {

    this.takeBackHistory = [];
    this.controller.takeBackCounter = 0;
    this.controller.loadGame(this.controller.lastLoadedGame, true);
    this.controller.takeBackTakeForwardUpdate(this.history.length, this.controller.takeBackCounter);
};

Game.prototype.clearTakebackHistory = function( ) {
	this.takeBackHistory = new Array();
	this.controller.takeBackTakeForwardUpdate(this.history.length, this.takeBackHistory.length);
};

function Cell(x, y, color) {
	this.x = x;
	this.y = y;
	this.color = color;
	this.captured = false;
	this.links = new Array();
	this.checked = false;
	this.open = false;
	this.capturedRegion = false;
	this.cost = 0;
	this.lastCost = 0;
}

Cell.prototype.findLinkTo = function (dot) {
	for (var i = this.links.length - 1; i >= 0; i--) {
		if (this.links[i].to === dot) {
			return true;
		}
	};
	return false;
}

Cell.prototype.makeLink = function (to) {
	var link = this.findLinkTo(to);
	if (link) {
		return link;
	}
	link = to.findLinkTo(this);
	if (link) {
		return link;
	}
	link = new Link(this, to);
	this.links.push(link);
	return link;
}

function Link(dot, to) {
	this.dot = dot;
	this.to = to;
}

function Player(color, name = 'player') {
	this.color = color;
	this.name = name;
}


var utils = {
	is_touch_device : function() {  
		try {  
		document.createEvent("TouchEvent");  
		return true;  
		} catch (e) {  
		return false;  
		}  
	}
}
