// File for drawing each frame of the game

function GameView(game, canvas) {
    this.game = game;
    this.canvas = canvas;

    this.cellWidth = Math.min(this.canvas.width / this.game.width);
    this.xOffset = 0;
    this.yOffset = 0;
    this.enabled = true;

    this.startMousePosX = 0;
    this.startMousePosY = 0;
    this.clickDetectDelta = 5;
    this.mx = 0;
    this.my = 0;
    this.drag = false;
    this.onMoveX = null;
    this.onMoveY = null;
    this.animatedLinks = false;

    var that = this;

    this.touchStartListener = function(e){
        //e.preventDefault();
        this.drag = true;
    };

    this.touchEndListener = function(e){
        alert(e.type);
        //e.preventDefault();
        this.drag = false;
    };

    this.mouseDownListener = function(e) {
        that.onMouseDown(e);
    };
    this.mouseUpListener = function(e) {
        that.onMouseUp(e);
    };
    this.mouseMoveListener = function(e) {
        that.onMouseMove(e);
    };
    this.mouseOutListener = function(e) {
        that.onMouseOut(e);
    };


    if (utils.is_touch_device()) {
        this.canvas.addEventListener("touchstart", this.touchStartListener, false);
        this.canvas.addEventListener("click touchend", this.touchEndListener, false);
        //this.canvas.addEventListener("touchmove", this.mouseMoveListener, false);
    }

    this.canvas.addEventListener("mousedown", this.mouseDownListener, false);
    this.canvas.addEventListener("mouseup", this.mouseUpListener, false);
    // �������������� �������� ���� ������ diva
    this.canvas.addEventListener("mousemove", this.mouseMoveListener, false);
    this.canvas.addEventListener("mouseout", this.mouseOutListener, false);

}

GameView.prototype.calculateWaypoints = function( vertices ) {
    // calc waypoints traveling along vertices
    var waypoints = [];
    for (var i = 1; i < vertices.length; i++) {
        var pt0 = vertices[i - 1];
        var pt1 = vertices[i];
        var dx = pt1.x - pt0.x;
        var dy = pt1.y - pt0.y;
        for (var j = 0; j < 100; j++) {
            var x = pt0.x + dx * j / 100;
            var y = pt0.y + dy * j / 100;
            waypoints.push({
                x: x,
                y: y
            });
        }
    }
    return (waypoints);
};


GameView.prototype.removeListeners = function() {


    if (utils.is_touch_device()) {
        this.canvas.removeEventListener("touchstart", this.touchStartListener, false);
        this.canvas.removeEventListener("touchend", this.touchEndListener, false);
        //this.canvas.removeEventListener("touchend", this.mouseMoveListener, false);
    }

    this.canvas.removeEventListener("mousedown", this.mouseDownListener, false);
    this.canvas.removeEventListener("mouseup", this.mouseUpListener, false);
    this.canvas.removeEventListener("mousemove", this.mouseMoveListener, false);
    this.canvas.removeEventListener("mouseout", this.mouseOutListener, false);

};

// ��������� ������� ����
GameView.prototype.centerViewOnPage = function (scale) {
    //console.log("scale", scale);
    var append = [1.1, 1.3, 1.5].indexOf(scale) != -1 ? -0.5 : 0;
    this.xOffset = this.canvas.width / 2 - this.game.width * this.cellWidth / 2 + (this.cellWidth / 2) + append;
    this.yOffset = this.canvas.height / 2 - this.game.height * this.cellWidth / 2 + (this.cellWidth / 2) + append;
}

GameView.prototype.onClickCell = function (x, y) {
    //alert('Clicked: x = ' + x + ' y = ' + y);
}

GameView.prototype.onMouseDown = function (event) {
    if (!this.enabled) {
        return;
    }
    if (event.button != 2 && event.button != 1) {
        event.preventDefault();
        var pageX = event.touches ? event.touches[0].pageX : event.pageX;
        var pageY = event.touches ? event.touches[0].pageY : event.pageY;
        this.mx = pageX;
        this.my = pageY;
        this.startMousePosX = pageX;
        this.startMousePosY = pageY;
        this.drag = true;
    }
}

GameView.prototype.LocalCoordinates = function(x, y) {

    var totalOffsetX = 0;

    var totalOffsetY = 0;

    var canvasX = 0;

    var canvasY = 0;

    var currentElement = this.canvas;

    do {
        totalOffsetX += currentElement.offsetLeft;

        totalOffsetY += currentElement.offsetTop;
    }
    while (currentElement = currentElement.offsetParent)

    canvasX = x - totalOffsetX;

    canvasY = y - totalOffsetY;

    return { x: canvasX, y: canvasY }
};

GameView.prototype.onMouseUp = function (event) {
    if (!this.enabled) {
        return;
    }

    event.preventDefault();

    var pageX = event.touches ? this.mx : event.pageX;
    var pageY = event.touches ? this.my : event.pageY;

    var coords = this.LocalCoordinates(pageX,pageY);

    var x = Math.max(0, Math.min(parseInt(coords.x / this.cellWidth), game.width - 1));
    var y = Math.max(0, Math.min(parseInt(coords.y / this.cellWidth), game.height - 1));

    this.canvas.style.cursor = "auto";
    this.drag = false;

    if (x >= 0 && y >= 0 && x < this.game.width && y < this.game.height) {

        if(game.controller.isYourMove) {
            if(!game.isGameOver() || game.controller.analysis) {
                this.onClickCell(x, y);
            }

        }

    }
    this.draw();
}

GameView.prototype.onMouseOut = function (event) {
    event.preventDefault();
    this.draw();
};

GameView.prototype.onMouseMove = function (event) {
    if (!this.enabled) {
        return;
    }

    var pageX = event.touches ? event.touches[0].pageX : event.pageX;
    var pageY = event.touches ? event.touches[0].pageY : event.pageY;

    event.preventDefault();

    var coords = this.LocalCoordinates(pageX,pageY);

    var x = Math.max(0, Math.min(parseInt(coords.x / this.cellWidth), game.width - 1));
    var y = Math.max(0, Math.min(parseInt(coords.y / this.cellWidth), game.height - 1));

    this.canvas.style.cursor = "auto";
    this.drag = false;

    if (x >= 0 && y >= 0 && x < this.game.width && y < this.game.height) {

        if(game.controller.isYourMove) {
            if(game.controller.analysis || (!game.isGameOver() && game.controller.type!='loaded'&&game.controller.type!='spectator')) {
                this.draw({
                    onMoveX: x,
                    onMoveY: y
                });
            }

        }
    }
}

GameView.prototype.__updateDataOnScale = function(scale) {
    this.cellWidth = Math.min(this.canvas.width / this.game.width);
    this.centerViewOnPage(scale);
};

GameView.prototype.getLimitSquareBounds = function() {
    return {
        x: this.cellWidth*(Math.floor(game.width/2)-4),
        y: this.cellWidth*(Math.floor(game.height/2)-4),
        endX: this.cellWidth*(Math.floor(game.width/2)-4) + this.cellWidth*7,
        endY: this.cellWidth*(Math.floor(game.height/2)-4) + this.cellWidth*7
    }
};

GameView.prototype.checkLimitSquareBounds = function(x, y) {
    var bounds = this.getLimitSquareBounds();
    var x = x * this.cellWidth;
    var y = y * this.cellWidth;
    if( x < bounds.x+this.cellWidth ||
        y < bounds.y+this.cellWidth ||
        x > bounds.endX-this.cellWidth ||
        y > bounds.endY-this.cellWidth) {
        return false;
    }
    return true;
};
 
//Drawing a field with all values
GameView.prototype.draw = function (data) {

    var context = this.canvas.getContext("2d");
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    context.translate(this.xOffset, this.yOffset);

    var clipLeft = -this.xOffset;
    var clipTop = -this.yOffset;
    var clipRight = clipLeft + this.canvas.width;
    var clipBottom = clipTop + this.canvas.height;

    var drawSquare = game.controller.type == "multiplayer" && game.history.length < 2;

    context.strokeStyle = "#aaaaaa";
    context.lineWidth = 1;

    var x = Math.floor(clipLeft / this.cellWidth) * this.cellWidth + 0.5;

    while (x <= clipRight) {

        context.beginPath();
        context.moveTo(x, clipTop + this.cellWidth/2);
        context.moveTo(x, clipTop + this.cellWidth/2);
        context.lineTo(x, clipBottom - this.cellWidth/2);
        context.stroke();
        x += this.cellWidth;
    }

    var y = Math.floor(clipTop / this.cellWidth) * this.cellWidth + 0.5;


    while (y <= clipBottom) {
        context.beginPath();
        context.moveTo(clipLeft + this.cellWidth/2, y);
        context.lineTo(clipRight - this.cellWidth/2, y);
        context.stroke();
        y += this.cellWidth;
    }

    var minCellX = Math.max(0, Math.floor(clipLeft / this.cellWidth));
    var maxCellX = Math.min(this.game.width - 1, Math.floor(clipRight / this.cellWidth) + 1);
    var minCellY = Math.max(0, Math.floor(clipTop / this.cellWidth));
    var maxCellY = Math.min(this.game.height - 1, Math.floor(clipBottom / this.cellWidth) + 1);
    context.lineWidth = 2;

    for (var i = this.game.history.length - 1; i >= 0; i--) {
        var historyEntry = this.game.history[i];
        if (historyEntry.event == "links") {
            var walls = historyEntry.data;
            context.strokeStyle = walls[0].color;
            context.fillStyle = walls[0].color;
            context.beginPath();
            context.moveTo(walls[0].x * this.cellWidth, walls[0].y * this.cellWidth);
            for (var j = walls.length - 1; j >= 0; j--) {
                context.lineTo(walls[j].x * this.cellWidth, walls[j].y * this.cellWidth);
            }
            context.stroke();
            context.globalAlpha = 0.5;
            context.fill();
            context.globalAlpha = 1.0;
        }
    }

    //Drawing points
    var maxCellCost = 0;
    for (x = minCellX; x <= maxCellX; x++) {
        for (y = minCellY; y <= maxCellY; y++) {
            var cell = this.game.map[x][y];
            if (cell.cost > maxCellCost) {
                maxCellCost = cell.cost;
            }
        }
    }

    var cellRadius = this.cellWidth / 4;
    var capturedCellRadius = this.cellWidth / 6;
    for (x = minCellX; x <= maxCellX; x++) {
        for (y = minCellY; y <= maxCellY; y++) {
            var cell = this.game.map[x][y];
            if (cell.color) {
                context.fillStyle = cell.color;
                context.beginPath();
                context.arc(x * this.cellWidth, y * this.cellWidth, cell.captured ? capturedCellRadius : cellRadius, 0, 2*Math.PI);
                context.fill();
                if (this.game.lastDot == cell) {
                    context.strokeStyle = cell.color;
                    context.lineWidth = 1;
                    context.beginPath();
                    context.arc(x * this.cellWidth, y * this.cellWidth, this.cellWidth / 3, 0, 2*Math.PI);
                    context.stroke();
                }
            }
        }
    }

    //Drawing a frame
    context.strokeStyle = "#b5b5b5";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-1 * this.cellWidth, -1 * this.cellWidth);
    context.lineTo(this.game.width * this.cellWidth, -1 * this.cellWidth);
    context.lineTo(this.game.width * this.cellWidth, this.game.height * this.cellWidth);
    context.lineTo(-1 * this.cellWidth, this.game.height * this.cellWidth);
    context.closePath();
    context.stroke();
    if (context.setLineDash) {
        context.setLineDash([]);
    }

    if(drawSquare) {
        context.strokeStyle = "#ee6d66";
        var limitSquareBounds = this.getLimitSquareBounds();
        context.rect(limitSquareBounds.x, limitSquareBounds.y, this.cellWidth*7, this.cellWidth*7);
        context.stroke();
    }

    if(typeof data != "undefined") {
        if(typeof data.onMoveX != "undefined" && typeof data.onMoveY != "undefined") {

            var moveInSquare = drawSquare ? this.checkLimitSquareBounds(data.onMoveX, data.onMoveY) : true;

            if(moveInSquare && game.map[data.onMoveX][data.onMoveY] && game.map[data.onMoveX][data.onMoveY].color == undefined) {
                context.globalAlpha = 0.4;
                context.fillStyle = game.controller.analysis ? game.currentPlayer.color : game.controller.player1Color;
                context.beginPath();
                context.arc(data.onMoveX * this.cellWidth, data.onMoveY * this.cellWidth, cellRadius, 0, 2*Math.PI);
                context.fill();
                context.globalAlpha = 1;
            }
        }
    }


}
