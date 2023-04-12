// File to update information about the game

function DotsActuator(controller) {
	this.controller = controller;

	this.l1 = $("#gameHeader .onePlayer.floatL .onePlayer__username");
	this.l2 = $("#gameHeader .onePlayer.floatR .onePlayer__username");
	this.r1 = $("#gameHeader .onePlayer.floatL .onePlayer__rank");
	this.r2 = $("#gameHeader .onePlayer.floatR .onePlayer__rank");
	this.yourScore = $(".score .score__your");
	this.rivalScore = $(".score .score__rival");
	this.captured1 = $("#gameHeader .onePlayer.floatR .onePlayer__captureDots .count");
	this.captured2 = $("#gameHeader .onePlayer.floatL .onePlayer__captureDots .count");
	this.statuses = $(".gameInfo .status .status_text");
	this.s_yourMove = $(".gameInfo .status_yourMove");
	this.s_rivalMove = $(".gameInfo .status_rivalMove");
	this.t1 = $(".left.onePlayer__timer");
	this.t2 = $(".right.onePlayer__timer");
	this.timer = $(".onePlayer__timer");

    this.buttons = {
        takeBack: $('.menu-buttons__top .takeback')
    };

	this.rewind = null;
    this.bindRewindPanel();
	this.canvasStatusTimeout = null;
	this.analysisText = '<strong>Free space</strong> - moves in turns for both players</br></br>' +
		'The rules of the game are not limited to the current regime';


	setInterval(this.updateCanvasStatus, 200);
};

DotsActuator.prototype.bindRewindPanel = function() {
    var self = this;
    this.rewind = {
		panel: $('.spectatorRewind'),
        start: $('.spectatorRewind .playManagerButton__start'),
        end: $('.spectatorRewind .playManagerButton__end'),
        prev: $('.spectatorRewind .arrowWrapper__left.takeback'),
        next: $('.spectatorRewind .arrowWrapper__right.takeforward'),
        prevAndNext: $('.spectatorRewind .arrowWrapper__right.takeforward, .spectatorRewind .arrowWrapper__left.takeback'),

        takeBackTimeout: null,
        onTakeBackClicked: function( ) {
            if(self.controller.type == 'loaded' && !self.controller.analysis) {
                game.takeBack();
            }
        },
        onTakeForwardClicked: function( ) {
            if(self.controller.type == 'loaded' && !self.controller.analysis) {
                game.takeForward();
            }
        },
        onMouseUp: function() {
            this.clearIntervalTakeBack();
        },
        clearIntervalTakeBack: function( ) {
            clearInterval(this.takeBackTimeout);
            this.takeBackTimeout = null;
        },
        intervalUpdateTakeback: function(data) {
            if(data.index === 1) { // takeback
                this.onTakeBackClicked();
            } else if(data.index === 2) { // takeforward
                this.onTakeForwardClicked();
            }
        }
    };

    this.rewind.prev.on('click', function(e) {
        self.rewind.onTakeBackClicked();
    });

    this.rewind.prevAndNext.on('mousedown', function(e) {
        if(self.controller.type == 'loaded' && !self.controller.analysis) {
            var index = parseInt($(e.target).parent().attr('data-attr')) || -1;
            self.rewind.takeBackTimeout = window.setInterval(function() {
                self.rewind.intervalUpdateTakeback.call(self.rewind, {index: index})
            }, 150);

            $(document).on("mouseup", function(e) {
                self.rewind.onMouseUp();
                $(document).off("mouseup");
            });
        }
    });

    this.rewind.next.on('click', function(e) {
        self.rewind.onTakeForwardClicked();
    });

    this.rewind.start.on('click', function(e) {
        if(self.controller.type == 'loaded') {
            game.toStart();
        }
    });

    this.rewind.end.on('click', function(e) {
        if(self.controller.type == 'loaded') {
            game.toEnd();
        }
    });

    $(document)
        .on("mousedown", ".pressable:not(.disabled, .active).takeback, .pressable:not(.disabled, .active).takeforward", function(e) {
            if(e.which === 1 && game.takeBackTimeout === null) {
                if(game.type === "computer" || game.type === "loaded" || game.type === "spectator") {
                    var index = $(this).attr("class").indexOf("takeback") != -1 ? 0 : 1; // 0 - takeback, 1 - takeforward
                    game.takeBackOnMousedown(index);
                    console.log("mousedown ", index);
                    // hang the handler on the document
                    $(document).on("mouseup", function() {
                        console.log("Mouseup event");
                        game.takeBackOnMouseup(index);
                        $(document).off("mouseup");
                    });
                }
            }

            return false;
        });
};

DotsActuator.prototype.loadGameView = function(data) {
	if(data.username1) this.label1(data.player1);
	if(data.username2) this.label2(data.player2);

	if(data.status) this.changeStatus(data.status);
	this.setScore(data.score1, data.score2);

	if(typeof data.defaultColors != 'undefined') {
		if(data.defaultColors == true) this.defaultColors();
		else this.alternateColors();
	}

	if(typeof data.captured1 != "undefined" && typeof data.captured2 != "undefined") {
		this.updateCapturedDots(data.captured1, data.captured2);
	}
};

DotsActuator.prototype.onTypeUpdated = function(type) {
	$('.typeE').hide();
	$('.typeE__'+type).show();
};

DotsActuator.prototype.onAnalysisChange = function(a) {
	$('.button_analysis').toggleClass('active', a);
	if(a) {
		this.showCanvasStatus(this.analysisText);
        this.buttons.takeBack.show();
	}

    if(this.controller.type == 'loaded') {
        this.rewind.panel.toggle(!a);
    }

    this.rewind.prevAndNext.toggleClass('disabled', a);
};

DotsActuator.prototype.onePlayer = function(player1) {
	this.label1(player1);
	this.label2('Computer');
	this.yourMove();
	this.rank2("");
	this.dropTimers(true);

	$(".menu-buttons__top .takeback, .menu-buttons__top .takeforward").show();
    $(".mode_button:not(.active)").removeClass("disabled");
};

DotsActuator.prototype.setTimer = function(yourTimer, time) {
	this.timer.html('('+time+')').show();
};

DotsActuator.prototype.dropTimers = function(hide) {
	this.timer.html("(01:00)").removeClass("red_timer").hide();
};

// Имена игроков

DotsActuator.prototype.label1 = function(player) {
	this.l1.html(player.userName).attr("title", player.userName);
	this.l1.attr("attr-userid", player.userId).addClass("active-username");
};

DotsActuator.prototype.label2 = function(player) {
    if(typeof player == 'string') {
        this.l2.html(player)
            .attr("title", player)
            .attr("attr-userid", 0)
            .removeClass("active-username");

    } else {
        this.l2.html(player.userName).attr("title", player.userName);
        this.l2.attr("attr-userid", player.userId).addClass("active-username");
    }

};

DotsActuator.prototype.clearScore = function() {
	this.yourScore.html("0");
	this.rivalScore.html("0");
};

// Counting up during the game
DotsActuator.prototype.updateScore = function( yourWin ) {
	var container = (yourWin) ? this.yourScore : this.rivalScore;
	container.html(+container.text() + 1);
};

// Setting an count
DotsActuator.prototype.setScore = function( score1, score2 ) {
	if(typeof score1 != "undefined") this.yourScore.html(score1);
	if(typeof score2 != "undefined") this.rivalScore.html(score2);
};

DotsActuator.prototype.getScore = function( ) {
    return [parseInt(this.yourScore.html()), parseInt(this.rivalScore.html())]
};

DotsActuator.prototype.clearCapturedDots = function() {
	this.updateCapturedDots(0, 0);
};

DotsActuator.prototype.updateCapturedDots = function(captured1, captured2) {
	this.captured1.text(captured1);
	this.captured2.text(captured2);
};

DotsActuator.prototype.takeBackTakeForwardUpdate = function(takeBackEnabled, takeForwardEnabled) {
	$(".menu-buttons__singlegame .takeback").toggleClass("disabled", !takeBackEnabled );
	$(".menu-buttons__singlegame .takeforward").toggleClass("disabled", !takeForwardEnabled );

    this.rewind.prev.toggleClass('disabled', !takeBackEnabled);
    this.rewind.next.toggleClass('disabled', !takeForwardEnabled);
};

DotsActuator.prototype.yourMove = function() {
	this.statuses.hide();
	this.s_yourMove.show();
};

DotsActuator.prototype.rivalMove = function() {
	this.statuses.hide();
	this.s_rivalMove.show();
};

DotsActuator.prototype.changeStatus = function(code) {
	this.statuses.hide();
	$(".status_text[data-code='"+code+"']").show();
};

DotsActuator.prototype.defaultColors = function( ){
	$(".onePlayer.floatL .color_square")
		.removeClass("color_square__red color_square__blue")
		.addClass("color_square__red");

	$(".onePlayer.floatR .color_square")
		.removeClass("color_square__red color_square__blue")
		.addClass("color_square__blue");
};

DotsActuator.prototype.alternateColors = function( ){
	$(".onePlayer.floatL .color_square")
		.removeClass("color_square__red color_square__blue")
		.addClass("color_square__blue");

	$(".onePlayer.floatR .color_square")
		.removeClass("color_square__red color_square__blue")
		.addClass("color_square__red");
};

DotsActuator.prototype.scrollToTop = function() {
		$('html, body').animate({ scrollTop: 0 }, 300);
}

DotsActuator.prototype.scrollToBottom = function() {
	$('html, body').animate({ scrollTop: $(".bottomContent").offset().top - 200 }, 300);
};

DotsActuator.prototype.showCanvasStatus = function (text) {

    var visibleOnPage = $(".canvas-status span").is(":visible");
	var defaultLatency = this.controller.type == 'loaded' || this.controller.type == 'spectator' ? 5 * 1000 : 5 * 60 * 1000;
    var latency = parseInt(latency) || defaultLatency;
    var fadeInDuration = visibleOnPage ? 0 : 400;
    clearTimeout(this.canvasStatusTimeout);

	$(".canvas-status span").html(text).show();

    //$(".canvas-status span").html(text).fadeIn({duration: fadeInDuration});
	var left = Math.floor($("#content").width()/2-($(".canvas-status").width()/2));
    $(".canvas-status").css("left", left).show();
    this.canvasStatusTimeout = setTimeout(this.hideCanvasStatus, latency);

    setTimeout(this.updateCanvasStatus, 1000);
};

DotsActuator.prototype.updateCanvasStatus = function() {
	var left = Math.floor($("#content").width()/2-($(".canvas-status").width()/2));
    $(".canvas-status").css("left", left);
};

DotsActuator.prototype.hideCanvasStatus = function () {
	clearTimeout(this.canvasStatusTimeout);

	$(".canvas-status span").text('').hide();
};

DotsActuator.prototype.fullScreenOnChange = function(enable) {
	var nextClass = enable ? "fullScreenSmall" : "fullScreenBig";
	$(".fullScreenWrapper .fullScreenControl").removeClass("fullScreenBig fullScreenSmall")
		.addClass(nextClass)
		.attr("title", nextClass == "fullScreenBig" ? 'Expand to full screen' : 'Roll back to normal mode' );

	$("#main-wrapper").removeClass("fullScreenEnabled fullScreenDisabled")
		.addClass(enable ? 'fullScreenEnabled' : 'fullScreenDisabled');

	if(enable) {
		var dH = $( window ).height() - 50;
		var gH = $('#game-field').height();

		//var nextScale = dH / gH;
		var nextScale = parseFloat((dH / gH).toFixed(1));
		if(nextScale < 0.9) {
			nextScale = 1;
		}
		game.controller.changeScale(nextScale);
	} else {
		game.controller.changeScale(1);
	}

};
