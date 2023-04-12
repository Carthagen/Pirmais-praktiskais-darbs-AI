var parentId = "start";
var parent = "";
var heightChart = 100;
var widthChart = 100;

var chartData = [{
    id: 'start',
    parent: '',
    name: 'Start game',
  }
];

var config = {
    type: 'tree',
    title: {
        text: 'Game TREE',
        fontSize: 20,
    },
    options: {
        // aspect: 'graph',
        // maxIterations: 20,
        // maxLinkWidth: 15,
        link: {
            aspect: 'arc',
        },
        maxSize: 15,
        minSize: 5,
        node: {
            type: 'circle',
            tooltip: {
            padding: '8px 10px',
            borderRadius: '3px',
            }
        }
    },
    series: chartData
};

function initChart() {
    zingchart.render({
        id: 'chart',
        data: config,
        height: `${heightChart}%`,
        width: `${widthChart}%`,
        output: 'canvas'
    });
}

function updateChartData(arrayOfData) {

    // You can comment out the next line so that the tree is not cut off,
    // but in this case it will break because the output is too large
    if (chartData.length >= 10) newHead();

    arrayOfData.forEach(data => {
        var name = `${data.x};${data.y}`;
        chartData.push({
            id: name,
            parent: parentId,
            name: name,
            value: data.cost
        });
    });

    initChart();
}

function setParent(data) {
    parent = data;
    parentId = `${data.x};${data.y}`;
}

function newHead() {
    chartData = [{
        id: `${parent.x};${parent.y}`,
        parent: '',
        name: `... ${parent.x};${parent.y}`,
        value: parent.cost
    }];

    config.series = chartData;
}