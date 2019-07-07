var Particle = (function () {
    function Particle() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(random(2) - 1, random(2) - 1);
        this.acc = createVector(0, 0);
    }
    Particle.prototype.update = function () {
        this.pos.add(this.vel);
        this.pos.add([width, height]);
        this.pos.set(this.pos.x % width, this.pos.y % height);
        this.vel.add(this.acc);
        this.vel.limit(0.2);
        this.acc.mult(0);
    };
    Particle.prototype.applyForce = function (force) {
        this.acc.add(force);
    };
    Particle.prototype.show = function () {
        stroke(0, 5);
        strokeWeight(1);
        point(this.pos.x, this.pos.y);
    };
    Particle.prototype.follow = function (flowField) {
        var x = floor(this.pos.x / 10);
        var y = floor(this.pos.y / 10);
        var index = x + y * 30;
        var force = flowField.vecs[index];
        this.applyForce(force);
    };
    return Particle;
}());
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
                    x: x,
                    y: y,
                    xPx: x * this.cellWidth,
                    yPx: y * this.cellWidth
                });
            }
        }
    };
    return Grid;
}());
var NoiseGrid = (function () {
    function NoiseGrid(grid, offsetInc, zOffsetInc) {
        this.grid = grid;
        this.offsetInc = offsetInc;
        this.z = 0;
        this.zOffsetInc = zOffsetInc;
    }
    NoiseGrid.prototype.stepZ = function () {
        this.z += this.zOffsetInc;
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
var numParticles = 100;
var FlowField = (function () {
    function FlowField(grid, noiseGrid) {
        var _this = this;
        this.grid = grid;
        this.noiseGrid = noiseGrid;
        this.vecs = new Array(grid.numCells);
        this.particles = new Array(numParticles);
        for (var i = 0; i < numParticles; i++) {
            this.particles.push(new Particle());
        }
        this.updateOnEach = function (cell) {
            var noiseVal = _this.noiseGrid.noiseAt(cell.x, cell.y);
            _this.vecs[cell.y * _this.grid.numCellsInRow + cell.x] = p5.Vector.fromAngle(noiseVal * 2 * PI);
        };
        this.visualizeVectorsOnEach = function (cell) {
            var noiseVal = _this.noiseGrid.noiseAt(cell.x, cell.y);
            push();
            translate(cell.xPx + _this.grid.cellWidth / 2, cell.yPx + _this.grid.cellWidth / 2);
            rotate(noiseVal * 2 * TWO_PI);
            arrow({ length: _this.grid.cellWidth - 1 });
            pop();
        };
    }
    FlowField.prototype.update = function () {
        this.grid.forEachCell(this.updateOnEach);
        this.particles.forEach(function (particle) {
            particle.update();
            particle.show();
        });
    };
    FlowField.prototype.visualizeVectors = function () {
        this.grid.forEachCell(this.visualizeVectorsOnEach);
    };
    FlowField.prototype.visualize = function () {
        this.particles.forEach(function (particle) {
            particle.follow(flowField);
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
    grid = new Grid(300, 10);
    noiseGrid = new NoiseGrid(grid, 0.05, 0.01);
    flowField = new FlowField(grid, noiseGrid);
    fps = new Fps();
    background(200);
}
function draw() {
    fps.update();
    flowField.update();
    flowField.visualize();
    noiseGrid.stepZ();
}
//# sourceMappingURL=build.js.map