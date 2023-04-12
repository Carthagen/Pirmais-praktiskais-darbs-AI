// Game creation and launch file

document.addEventListener('DOMContentLoaded', function() {
    StartApplication();
    initChart();
});

function StartApplication() {
    game = new Game(20, 20);
    gameView = new GameView(game, document.getElementById("gameSurface"));
    d_ui.pushController(new MainMenuScreen());
};
