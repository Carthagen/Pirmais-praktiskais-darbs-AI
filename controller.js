// File to run the control structure over the game

function DotsController(bot, username) {
	this.bot = bot;
    this.botEngine = username == 'Legacy';
	this.userid = 1;
	this.username = username;

    this.type = "computer";
    this.analysis = false;
    this.lastLoadedGame = null;
    this.takeBackCounter = 0;
    this.endGameState = 'waiting'; // waiting => pending => completed

    this.player1 = null;
    this.player2 = null;

	this.rivalUsername = "Компьютер";
	this.player1Color = "#ff0000";
	this.player2Color = "#0000ff";
	this.isYourMove = true;

	this.actuator = new DotsActuator(this);
    this.width = 600;
    this.height = 600;
    this.sizeX = 20;
    this.sizeY = 20;
    this.scale = 1;

	this.onLoad();
    this.changeScale(1);
};

DotsController.prototype.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

DotsController.prototype.setAnalysis = function(a) {

    if(this.analysis && !a) {
        game.controller.actuator.hideCanvasStatus();
    }

    this.analysis = a;
    this.actuator.onAnalysisChange(a);

    if(game.controller.type == "computer" && !window.isFullScreenMode()) {
        // нужно сбросить игру, чтобы ходить первым
        game.controller.onePlayer();
    }

    if(!this.analysis && this.type == 'loaded') {
        if(this.lastLoadedGame) {
            this.loadGame(this.lastLoadedGame, true);
        } else {
            this.lastLoadedGame = null;
        }
    }

    if(a && game.history.length > 0) {
        var lastDotColor = game.history[game.history.length - 1].data.color;
        if(lastDotColor == game.currentPlayer.color) {
            game.switchPlayer();
        }
    }

};

DotsController.prototype.defaultColors = function() {
	this.player1Color = "#ff0000";
	this.player2Color = "#0000ff";
	this.actuator.defaultColors();
};

DotsController.prototype.alternateColors = function() {
	this.player1Color = "#0000ff";
	this.player2Color = "#ff0000";
	this.actuator.alternateColors();
};

DotsController.prototype.isMovesFirst = function() {
	return (this.player1Color == "#ff0000");
};

DotsController.prototype.onePlayer = function() {
    this.setType("computer");

    this.player1 = new Player(PLAYER1_COLOR, 'Player');
    this.player2 = null;

    game.currentPlayer = game.player1;
	this.isYourMove = true;
	this.clearGameField();
	this.actuator.clearScore();
	this.defaultColors();
	this.actuator.onePlayer(this.player1);
    this.actuator.takeBackTakeForwardUpdate(false, false);
};

DotsController.prototype.updateButtons = function(hLength) {
    var tB = hLength > 0;
    game.controller.actuator.takeBackTakeForwardUpdate(tB, false)
};

DotsController.prototype.setType = function(type) {
    this.type = type;

    if(type != 'loaded') {
        this.lastLoadedGame = null;
    }

    this.actuator.onTypeUpdated(this.type);
    this.showCurrentModeMessage();

    clearTimeout(this.turnTimeout);
};

DotsController.prototype.showCurrentModeMessage = function(mode) {
    var statuses = {
        'default': 'The game is played until the whole field is filled',
        'blitz': 'The game is played until 20 points have been captured',
        'real_blitz' : 'Play is played until the whole field is filled, 5 minutes per game'
    };
    if(!this.analysis) {
        var text = statuses[mode];
        text = '<strong>' + text + '</strong>';
    } else {
        text = this.actuator.analysisText;
    }

    this.actuator.showCanvasStatus(text);
};

DotsController.prototype.syncTurns = function(data) {
    var color = 1;
    var numberOfTurns = 0;
    function _iterateHistory(history) {
        for(var i=0; i < history.length; i++) {
            var turn = history[i];
            if(turn.length == undefined) {
                if(turn.turn && !turn.turn.endGame && turn.action != 'timeout') {
                    color = typeof turn.turn.color != 'undefined' ? turn.turn.color : color;
                    game.putDot(turn.turn.x, turn.turn.y, true, color);
                    color = Math.abs(color - 1);
                    numberOfTurns++;
                }
            } else {
                _iterateHistory(turn);
            }
        }
    };
    this.clearGameField();

    _iterateHistory(data);
    gameView.draw();

    return numberOfTurns;
};

DotsController.prototype.yourMove = function() {
	this.isYourMove = true;
	this.actuator.yourMove();
};

DotsController.prototype.rivalMove = function() {
	this.isYourMove = false;
	this.actuator.rivalMove();
};

DotsController.prototype.gameOverScreenComputer = function(currentPlayerColor) {
	var captured = game.countCapturedDots();
	var gameOverDlgTitle = this.msg != '' ? this.msg : "Game ened";
	var player1Username = game.controller.username;
	var player2Username = game.controller.rivalUsername;

    var winner = null;

	var gameStatistics = "<br>" +
		"<b>" + player1Username + "</b> grabbed " + captured[PLAYER2_COLOR] + " points<br>" +
		"<b>" + player2Username + "</b> grabbed " + captured[PLAYER1_COLOR] + " points<br>";
	var gameResult = "";
	if (captured[PLAYER1_COLOR] == captured[PLAYER2_COLOR]) {
		gameResult = "Draw";
        winner = null;
	} else if (currentPlayerColor) {
		if (((captured[PLAYER1_COLOR] > captured[PLAYER2_COLOR]) && currentPlayerColor == PLAYER2_COLOR) ||
			((captured[PLAYER2_COLOR] > captured[PLAYER1_COLOR]) && currentPlayerColor == PLAYER1_COLOR)) {
			gameResult = "Win";
            winner = true;
		} else {
			gameResult = "Loose";
            winner = false;
		}
		game.controller.actuator.updateScore(captured[PLAYER1_COLOR] < captured[PLAYER2_COLOR]);
	} else {
		game.controller.actuator.updateScore(captured[PLAYER1_COLOR] < captured[PLAYER2_COLOR]);
	}

    var statusTable = {
        null: 4,
        true: 2,
        false: 3
    };

    game.controller.actuator.changeStatus(statusTable[winner]);

    gameResult = gameResult;

    // end game
    newgame = confirm(gameResult + ". Play with the computer again?");

    if (newgame) {
        var currentScore = game.controller.actuator.getScore();
        var newScore = [];
        if(winner != null) {
            newScore[0] = winner ? currentScore[0]+1 : currentScore[0];
            newScore[1] = winner ? currentScore[1]+1 : currentScore[1];
        }
        game.controller.onePlayer();
		game.controller.actuator.clearCapturedDots();
        game.controller.actuator.setScore(newScore[0], newScore[1]);
    }
};

DotsController.prototype.gameOver = function(yourWin, isDraw) {
	var status = isDraw ? 4 : (yourWin ? 2 : 3);
	this.actuator.changeStatus(status);
};

DotsController.prototype.clearGameField = function() {
    game.clearMap();
    this.endGameState = 'waiting';
	this.actuator.clearCapturedDots();
};

// Called whenever an instance is created Game()
DotsController.prototype.gameCreated = function() {
	$(".menu-buttons__singlegame .takeback, .menu-buttons__singlegame .takeforward").addClass("disabled");
};

DotsController.prototype.putDot__computer = function(yourTurn, x, y) {
	// Updating the data on encircled points
	var captured = game.countCapturedDots();
	this.actuator.updateCapturedDots(captured[this.player1Color],captured[this.player2Color]);

	// Updating the backstroke buttons
	this.takeBackTakeForwardUpdate(game.history.length, game.takeBackHistory.length);
    if(yourTurn) {
        this.actuator.rivalMove();
    } else {
        this.actuator.yourMove();
    }
};

DotsController.prototype.putDot = function( yourMove ) {
	// Updating the data on encircled points
	var captured = game.countCapturedDots();
	this.actuator.updateCapturedDots(captured[this.player1Color],captured[this.player2Color]);

    if(this.type == "spectator") {

    } else {
        // Updating whose turn it is now
        if(yourMove) this.rivalMove();
        else this.yourMove();
    }

    if(!yourMove && this.bot) {
        var self = this;
        var aiTurn = this.makeAiTurn();

        if(game.history.length < 2 && game.history[0]) {
            if(!this.checkBounds(aiTurn.x, aiTurn.y)) {

                aiTurn = {};
                var turn0 = game.history[0].data;
                var m = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0,1], [1, 0], [1, 1], [0, 1]];
                for(var i=0; i < m.length; i++) {
                   var nX = turn0.x + m[i][0];
                   var nY = turn0.y + m[i][1];
                    if(this.checkBounds(nX, nY)) {
                        aiTurn.x = nX;
                        aiTurn.y = nY;
                        break;
                   }
                }
            }
        }

        var timeout = this.getRandomInt(300, 1200);
        clearTimeout(this.turnTimeout);

        if (this.botEngine) {

        } else {
            this.turnTimeout = setTimeout(function() {
                self.emitTurn(aiTurn.x, aiTurn.y);
            }, timeout);
        }
    }
};

DotsController.prototype.checkBounds = function(x, y) {
    if( x < Math.floor(game.width/2)-3 || y < Math.floor(game.height/2)-3 ||
        x > Math.floor(game.width/2)+2 || y > Math.floor(game.height/2)+2) {
        return false;
    }
    return true;
};

// Sending a move to an opponent
DotsController.prototype.emitTurn = function(x, y) {
    if(game.history.length < 2) {
        if(!this.checkBounds(x, y)) {
            game.controller.actuator.showCanvasStatus("Make a move to the centre square", 2000);
            return;
        }
    }

    this.actuator.hideCanvasStatus();
};

DotsController.prototype.takeBackTakeForwardUpdate = function(historyLength, takeBackHistoryLength) {
    var allowedType = ['computer', 'loaded'].indexOf(this.type) != -1;
	var takeBackEnabled = allowedType ? (historyLength > 0) : false;
	var takeForwardEnabled = allowedType ? (takeBackHistoryLength > 0) : false;

	this.actuator.takeBackTakeForwardUpdate(takeBackEnabled, takeForwardEnabled);
};

DotsController.prototype.time = function(data) {
	var player1Time = data.user.userId == this.player1.userId;
	this.actuator.setTimer(player1Time, data.userTimeFormat);
};


DotsController.prototype.makeAiTurn = function() {
    game.makeAIDecision();
    var dec1 = game.getAllBestChoises();
    var decision1 = dec1[0];

    updateChartData([dec1[0], dec1[1], dec1[2]]);
    setParent(decision1);

    return decision1;
};

DotsController.prototype.onLoad = function() {
    this.actuator.label1({
        userId: this.userid,
        userName: this.username
    });
};

DotsController.prototype.changeScale = function(scale, fromFullscreen) {
    this.scale = scale;
    var width = this.width*this.scale;
    var height = this.height*this.scale;
    var rewindPanelHeight = $('.spectatorRewind').height() || 25;

    var content = $('#content');
    content.width(width);
    content.height(height + rewindPanelHeight);

    var gameSurface = $('#gameSurface')[0];
    gameSurface.width = width;
    gameSurface.height = height;

    $(".gameSquare, #bottom-block").width(width);

    if (typeof gameView == 'object') {
        gameView.__updateDataOnScale(scale);
        gameView.draw();
    }

    if(scale == 1) {
        if(true) {
            $('html').css('overflow-x', 'hidden');
        }

        if(window.isFullScreenMode && !window.isFullScreenMode()) {
            $('.fullScreenControl').removeClass('fullScreenBig fullScreenSmall').addClass('fullScreenBig');
        }

    } else {
        if(true) {
            $('html').css('overflow-x', 'auto');
        }
        $('.fullScreenControl').removeClass('fullScreenBig fullScreenSmall').addClass('fullScreenSmall');
    }

    if(true) {
        $("#game-field").width($('#gameSurface').width());
        $("#main-wrapper").width( 1000 + $('#gameSurface').width() - 600);
    }


    this.actuator.updateCanvasStatus();
    this.drawCoordinates();

    var sel = $('.tableWrap')[0];
    if(sel) {
        sel.style.display='none';
        sel.offsetHeight; // no need to store this anywhere, the reference is enough
        sel.style.display='';
    }

    if(typeof window.fixTemplate == 'function') {
        window.fixTemplate();
    }



};

DotsController.prototype.changeSize = function(width, height) {

    // 20x20 String
    if(typeof height === "undefined" && typeof width === "string") {
        width = width.split("x");
        height = parseInt(width[1]);
        width = parseInt(width[0]);
    }

    this.sizeX = width;
    this.sizeY = height;

    if(width == 39 && height == 32) {
        this.width = 780;
        this.height = 640;
    } else {
        this.width = 600;
        this.height = 600;
    }

    var content = $('#content');
    content.width(this.width);
    content.height(this.height);

    $("#gameSurface").attr({
        width: this.width+"px",
        height: this.height+"px"
    });

    game.setData({
        width: width,
        height: height
    });

    gameView.draw();

    this.changeScale(this.scale);

    if(this.type == "loaded") {
        //this.actuator.hideCanvasStatus();
    } else {
        this.actuator.updateCanvasStatus();
    }

    this.drawCoordinates();
};

DotsController.prototype.drawCoordinates = function() {
    var scale = this.scale;
    var defaultSize = 30;
    var cellsMultiplier = 1;

    $('.hor-coords .cell').slice(20).hide();
    $('.vert-coords .cell:lt(12)').hide();
    $('.vert-coords').css({top: '7px'});

    if(this.sizeX == 30) {
        $('.hor-coords .cell:gt(19):lt(10)').show();
        $('.vert-coords .cell:lt(12):gt(1)').show();
        $('.vert-coords').css({top: '4px'});
        cellsMultiplier = 0.667;
    }

    if(this.sizeX == 39) {
        $('.hor-coords .cell:gt(19):lt(20)').show();
        $('.vert-coords .cell').show();
        $('.vert-coords').css({top: '4px'});
        cellsMultiplier = 0.667;
    }



    $('.hor-coords .cell').css({
        width: this.scale * defaultSize * cellsMultiplier
    });
    $('.vert-coords .cell').css({
        height: this.scale * defaultSize * cellsMultiplier
    });
};

DotsController.prototype.loadGame = function(data, dontChangeScale) {
    this.setType("loaded");
    this.lastLoadedGame = data;

    var fieldSize = data.initData.inviteData.fieldSize ? data.initData.inviteData.fieldSize : "20x20";

    if(!dontChangeScale) {
        this.changeSize(fieldSize);
        this.changeScale(1);
    }

	this.clearGameField();
	this.actuator.clearScore();

    // if localPlayer was in game

    if(data.players[0].isPlayer || data.players[1].isPlayer) {

        if(data.players[0].isPlayer) {
            this.player1 = data.players[0];
            this.player2 = data.players[1];
        } else if(data.players[1].isPlayer) {
            this.player1 = data.players[1];
            this.player2 = data.players[0];
        }

        var firstPlayer = data.initData ? data.initData.first : data.players[0];

        if(firstPlayer == this.player1) {
            this.defaultColors();
        } else {
            this.alternateColors();
        }

    } else {
        this.player1 = data.players[0];
        this.player2 = data.players[1];
        if(data.initData) {
            if(data.initData.first == data.players[0]) {
                this.defaultColors();
            } else if(data.initData.first == data.players[1]) {
                this.alternateColors();
            }
        }


    }

	var statusCode = 3;

	// draw
	if(data.winner == null) {
		statusCode = 4;
	} else {
		if(this.player1.userId == data.winner.userId) {
            if(data.action ==  "throw") {
                statusCode = 9;
            } else if(data.action == "timeout") {
                statusCode = 10;
            } else if(data.action == "user_leave") {
                statusCode = 11;
            }

            else {
                statusCode = 2;
            }
		} else if(this.player2.userId == data.winner.userId) {
            if(data.action ==  "throw") {
                statusCode = 6;
            }  else if(data.action == "timeout") {
                statusCode = 7;
            } else if(data.action == "user_leave") {
                statusCode = 8;
            }
            else {
                statusCode = 3;
            }

		}
	}
    this.syncTurns(data.history);

    var actualHistory = game.history.slice();
    actualHistory.forEach(function(el, index, arr) {
        if(arr[index].event != "dot") {
            arr.splice(index, 1);
        }
    });

    if(data.newEnemyDots) {
        actualHistory.push({event: 'newEnemyDots', data: data.newEnemyDots})
    }

    this.lastLoadedGame.turnsNumber = actualHistory.length;
    this.lastLoadedGame.actualHistory = actualHistory;


    this.takeBackCounter = 0;

    this.actuator.takeBackTakeForwardUpdate(data.history.length > 0, false);

    if(data.history[data.history.length-1] && data.history[data.history.length-1].turn) {
        var turn = data.history[data.history.length-1].turn;
        var newEnemyDots = turn.newEnemyDots;
        var fillFieldColor = turn.fillFieldColor;
        if(newEnemyDots) {
            for(var i in newEnemyDots) {
                var dot = newEnemyDots[i];
                game.putDot(dot.x, dot.y, true, fillFieldColor);
            }
            gameView.draw();
        }
    }

    var score_parsed = JSON.parse(data.score);
	var view = {
        player1: this.player1,
        player2: this.player2,
		username1: this.player1.userName,
		username2: this.player2.userName,
		status: statusCode,
		score1: score_parsed[this.player1.userId],
		score2: score_parsed[this.player2.userId],
		defaultColors: (data.initData.first.userId == this.player1.userId)
	};

	this.actuator.loadGameView(view);

    var captured = game.countCapturedDots();
    this.actuator.updateCapturedDots(captured[this.player1Color],captured[this.player2Color]);
	this.actuator.scrollToTop();
	gameView.draw();
};

DotsController.jumpToTurn = function() {

};

DotsController.prototype.updateCapturedDots = function( ){
    var captured = game.countCapturedDots();
    this.actuator.updateCapturedDots(captured[this.player1Color],captured[this.player2Color]);
};
