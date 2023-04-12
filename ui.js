//File with game window operation activation

function extend(Child, Parent) {
	var F = function() { }
	F.prototype = Parent.prototype
	Child.prototype = new F()
	Child.prototype.constructor = Child
	Child.superclass = Parent.prototype
}

function UI() {
	var that = this;
	this.currentView = undefined;
	this.currentController = undefined;
	this.screenStack = [];

	this.displayModalView = function (screenId, onDone) {
		var view = $('#' + screenId).clone();
		$('#content').append(view);
		view.addClass('modalDialog');
		that.currentView.show();
		onDone(view);
	}

	this.displayView = function (screenId, onDone) {
		if (screenId == '') {
			onDone();
			return;
		}
		that.currentView = $('#' + screenId).clone();
		$('#content').append(that.currentView);
		that.currentView.fadeIn(400, onDone);
	}

	this.pushController = function(newController) {
		if (that.currentController) {
			that.currentController.onGone();
		}
		that.screenStack.push(newController);
		that.currentController = newController;
		that.currentController.onShow();
	}

	this.popController = function(count) {
		if (typeof count == 'undefined') {
			count = 1;
		}
		while (count > 0) {
			that.screenStack.pop();
			count--;
		}
		if (that.currentController) {
			that.currentController.onGone();
		}
		var controller = that.screenStack[that.screenStack.length - 1];
		controller.onRestoreState();
		that.currentController = controller;
	}
}

var d_ui = new UI();

function ViewController() {}


ViewController.prototype.onGone = function () {}
ViewController.prototype.onShow = function () {}
ViewController.prototype.onRestoreState = function () {
	this.onShow();
}

function MainMenuScreen() {
	MainMenuScreen.superclass.constructor.apply(this, []);
}
extend(MainMenuScreen, ViewController);

MainMenuScreen.prototype.onShow = function () {
	gameView.draw();
	d_ui.pushController(new GameConfigScreen('ai'));
}

function AboutScreen() {
	AboutScreen.superclass.constructor.apply(this, []);
}
extend(AboutScreen, ViewController);
AboutScreen.prototype.onShow = function () {}
AboutScreen.prototype.onGone = function () {}
function GameConfigScreen(gameMode) {
	GameConfigScreen.superclass.constructor.apply(this, []);
	this.mapWidth = undefined;
	this.mapHeight = undefined;
	this.gameMode = gameMode;
}
extend(GameConfigScreen, ViewController);
GameConfigScreen.prototype.onShow = function () {
	var that = this;
	that.mapWidth = 30;
	that.mapHeight = 30;
	d_ui.pushController(new AIGameScreen(that));
}
function GameOverScreen(msg, currentPlayerColor) {
	GameOverScreen.superclass.constructor.apply(this, []);
	this.msg = msg;
	this.currentPlayerColor = currentPlayerColor;
}
extend(GameOverScreen, ViewController);

GameOverScreen.prototype.onShow = function () {
	var that = this;
	var captured = game.countCapturedDots();
	var gameOverDlgTitle = this.msg != '' ? this.msg : "Game over";
	var player1Username = game.controller.username;
	var player2Username = game.controller.rivalUsername;

	var gameStatistics = "<br>" +
		"<b>" + player1Username + "</b> Grabbed " + captured[PLAYER2_COLOR] + " Points<br>" +
		"<b>" + player2Username + "</b> Grabbed " + captured[PLAYER1_COLOR] + " Points<br>";
	var gameResult = "";
	if (captured[PLAYER1_COLOR] == captured[PLAYER2_COLOR]) {
		gameResult = "Draw";
	} else if (this.currentPlayerColor) {
		if (((captured[PLAYER1_COLOR] > captured[PLAYER2_COLOR]) && this.currentPlayerColor == PLAYER2_COLOR) ||
			((captured[PLAYER2_COLOR] > captured[PLAYER1_COLOR]) && this.currentPlayerColor == PLAYER1_COLOR)) {
			gameResult = "Win";
		} else {
			gameResult = "Loose";
		}

		game.controller.actuator.updateScore(captured[PLAYER1_COLOR] < captured[PLAYER2_COLOR]);

	} else {
		if (captured[PLAYER1_COLOR] > captured[PLAYER2_COLOR]) {
			gameResult = PLAYER1_COLOR + " Win!";
		} else {
			gameResult = PLAYER2_COLOR + " Win!";
		}

		game.controller.actuator.updateScore(captured[PLAYER1_COLOR] < captured[PLAYER2_COLOR]);
	}
	$('#gameOverDlgTitle').html(gameOverDlgTitle);
	$('#gameResult').html(gameResult);
	$('#gameStatistics').html(gameStatistics);
}

function AIGameScreen(config) {
	AIGameScreen.superclass.constructor.apply(this, []);
	this.config = config;
}
extend(AIGameScreen, ViewController);

AIGameScreen.prototype.onShow = function () {
	game.player1.name = "Human";
	game.player2.name = "Bender";
	gameView.game = game;
	gameView.centerViewOnPage();
	gameView.draw();

	gameView.onClickCell = function(x, y) {

		if (game.controller.type == "computer" || game.controller.analysis) {
			if (game.putDot(x, y, true)) {
				if(game.controller.analysis) {
					game.switchPlayer();
					game.controller.takeBackTakeForwardUpdate(game.history.length, game.takeBackHistory.length);
				} else {
					game.clearTakebackHistory();
					game.switchPlayer();

					if (!game.isGameOver()) {
						var decision = game.controller.makeAiTurn();
						var available = game.putDot(decision.x, decision.y, true);
						var stop = false;

						haha:
							if(!available) {
								console.log("move ", decision.x, " : ", decision.y, " NOT available");

								function getRandomInt(min, max) {
									return Math.floor(Math.random() * (max - min + 1)) + min;
								}

								while(!available || !stop) {
									var randX = getRandomInt(0, game.width-1);
									var randY = getRandomInt(0, game.height-1);

									console.log("-- trying... ", randX, randY);

									available = game.putDot(game.map[randX][randY].x, game.map[randX][randY].y, true);

									if(available) {
										console.log("-- FIND ", randX, randY);
										break haha;
									}
								}
							} else {
								game.clearTakebackHistory();
							}
						game.switchPlayer();
					}
				}
			}
			if (game.isGameOver() && !game.controller.analysis) {
				game.controller.gameOverScreenComputer(game.player1.color);
			}
		}
		gameView.draw();
	};
}
AIGameScreen.prototype.onGone = function () {}
