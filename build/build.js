var Grid = (function () {
    function Grid(gridWidth, cellWidth) {
        createCanvas(gridWidth, gridWidth);
        this.gridWidth = gridWidth;
        this.cellWidth = cellWidth;
        this.numCellsInRow = gridWidth / cellWidth;
        this.numCells = Math.pow(this.numCellsInRow, 2);
    }
    Grid.prototype.forEachCell = function (f) {
        for (var x = 0; x < this.numCellsInRow; x += 1) {
            for (var y = 0; y < this.numCellsInRow; y += 1) {
                f({
                    x: x, y: y, xPx: x * this.cellWidth, yPx: y * this.cellWidth
                });
            }
        }
    };
    return Grid;
}());
var NoiseGrid = (function () {
    function NoiseGrid(grid, offsetInc) {
        this.grid = grid;
        this.offsetInc = offsetInc;
        this.z = 0;
    }
    NoiseGrid.prototype.stepZ = function () {
        this.z += this.offsetInc;
    };
    NoiseGrid.prototype.noiseAt = function (x, y) {
        return noise(x * this.offsetInc, y * this.offsetInc, this.z);
    };
    NoiseGrid.prototype.visualize = function () {
        var _this = this;
        this.grid.forEachCell(function (cell) {
            var noiseVal = _this.noiseAt(cell.x, cell.y);
            fill(noiseVal * 255);
            rect(cell.xPx, cell.yPx, _this.grid.cellWidth, _this.grid.cellWidth);
        });
    };
    return NoiseGrid;
}());
var FlowField = (function () {
    function FlowField(grid, noiseGrid) {
        this.grid = grid;
        this.noiseGrid = noiseGrid;
        this.vecs = new Array(grid.numCells);
    }
    FlowField.prototype.update = function () {
        var _this = this;
        this.grid.forEachCell(function (cell) {
            var noiseVal = _this.noiseGrid.noiseAt(cell.x, cell.y);
            _this.vecs[cell.y * _this.grid.numCellsInRow + cell.x] = noiseVal * 2 * PI;
        });
    };
    FlowField.prototype.visualize = function () {
        var _this = this;
        this.grid.forEachCell(function (cell) {
            var noiseVal = _this.noiseGrid.noiseAt(cell.x, cell.y);
            push();
            translate(cell.xPx + _this.grid.cellWidth / 2, cell.yPx + _this.grid.cellWidth / 2);
            rotate(noiseVal * 4 * PI);
            arrow({ length: _this.grid.cellWidth - 1 });
            pop();
        });
    };
    return FlowField;
}());
var arrow = function (_a) {
    var length = _a.length;
    var headWidth = Math.ceil(length / 10);
    line(0, 0, length, 0);
    triangle(length, 0, length - headWidth, -headWidth, length - headWidth, headWidth);
};
var Fps = (function () {
    function Fps() {
        this.elem = createDiv();
    }
    Fps.prototype.update = function () {
        this.elem.html("<code>FPS: " + Math.floor(frameRate()) + "</code>");
    };
    return Fps;
}());
var grid;
var noiseGrid;
var flowField;
var fps;
function setup() {
    grid = new Grid(400, 10);
    noiseGrid = new NoiseGrid(grid, 0.1);
    flowField = new FlowField(grid, noiseGrid);
    fps = new Fps();
}
function draw() {
    background(200);
    fps.update();
    flowField.visualize();
    noiseGrid.stepZ();
}
//# sourceMappingURL=build.js.map