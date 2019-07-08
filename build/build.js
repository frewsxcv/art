var Particle = (function () {
    function Particle(p) {
        this.velLimit = 5;
        this.pos = p.createVector(p.random(p.width), p.random(p.height));
        this.vel = p.createVector(0, 0);
        this.acc = p.createVector(0, 0);
        this.p = p;
    }
    Particle.prototype.pixelPos = function () {
        return new PixelPos(this.pos.x, this.pos.y);
    };
    Particle.prototype.update = function () {
        this.pos.add(this.vel);
        this.pos.add([this.p.width, this.p.height]);
        this.pos.set(this.pos.x % this.p.width, this.pos.y % this.p.height);
        this.vel.add(this.acc);
        this.vel.limit(this.velLimit);
        this.acc.mult(0);
    };
    Particle.prototype.applyForce = function (force) {
        this.acc.add(force);
    };
    Particle.prototype.show = function () {
        this.p.stroke(0, 5);
        this.p.strokeWeight(1);
        this.p.point(this.pos.x, this.pos.y);
    };
    return Particle;
}());
var PixelPos = (function () {
    function PixelPos(x, y) {
        this.x = x;
        this.y = y;
    }
    PixelPos.prototype.toGridPos = function (grid) {
        return new GridPos(Math.floor(this.x / grid.cellWidth), Math.floor(this.y / grid.cellWidth));
    };
    return PixelPos;
}());
var GridPos = (function () {
    function GridPos(x, y) {
        this.x = x;
        this.y = y;
    }
    return GridPos;
}());
var Grid = (function () {
    function Grid(p, gridWidth, cellWidth) {
        p.createCanvas(gridWidth, gridWidth);
        this.gridWidth = gridWidth;
        this.cellWidth = cellWidth;
        this.numCellsInRow = gridWidth / cellWidth;
        this.numCells = Math.pow(this.numCellsInRow, 2);
    }
    Grid.prototype.forEachCell = function (f) {
        for (var x = 0; x < this.numCellsInRow; x += 1) {
            for (var y = 0; y < this.numCellsInRow; y += 1) {
                f({
                    gridPos: new GridPos(x, y),
                    pixelPos: new PixelPos(x * this.cellWidth, y * this.cellWidth)
                });
            }
        }
    };
    return Grid;
}());
var NoiseGrid = (function () {
    function NoiseGrid(p, grid, xyOffsetInc, zOffsetInc) {
        this.grid = grid;
        this.xyOffsetInc = xyOffsetInc;
        this.zOffset = 0;
        this.zOffsetInc = zOffsetInc;
        this.p = p;
    }
    NoiseGrid.prototype.stepZ = function () {
        this.zOffset += this.zOffsetInc;
    };
    NoiseGrid.prototype.noiseAt = function (gridPos) {
        return this.p.noise(gridPos.x * this.xyOffsetInc, gridPos.y * this.xyOffsetInc, this.zOffset);
    };
    NoiseGrid.prototype.visualize = function () {
        var _this = this;
        this.grid.forEachCell(function (cell) {
            var noiseVal = _this.noiseAt(cell.gridPos);
            _this.p.fill(noiseVal * 255);
            _this.p.rect(cell.pixelPos.x, cell.pixelPos.y, _this.grid.cellWidth, _this.grid.cellWidth);
        });
    };
    return NoiseGrid;
}());
var VectorField = (function () {
    function VectorField(p, noiseGrid) {
        this.vecs = new Array(noiseGrid.grid.numCells);
        this.noiseGrid = noiseGrid;
        this.p = p;
    }
    VectorField.prototype.update = function () {
        var _this = this;
        this.noiseGrid.grid.forEachCell(function (cell) {
            var noiseVal = _this.noiseGrid.noiseAt(cell.gridPos);
            _this.vecs[cell.gridPos.x * _this.noiseGrid.grid.numCellsInRow + cell.gridPos.y] = p5.Vector.fromAngle(noiseVal * 2 * _this.p.PI);
        });
    };
    VectorField.prototype.forceFromPixelPos = function (pixelPos) {
        var gridPos = pixelPos.toGridPos(this.noiseGrid.grid);
        var index = gridPos.x + gridPos.y * this.noiseGrid.grid.numCellsInRow;
        return this.vecs[index];
    };
    VectorField.prototype.visualize = function () {
        var _this = this;
        this.noiseGrid.grid.forEachCell(function (cell) {
            var noiseVal = _this.noiseGrid.noiseAt(cell.gridPos);
            _this.p.push();
            _this.p.translate(cell.pixelPos.x + _this.noiseGrid.grid.cellWidth / 2, cell.pixelPos.y + _this.noiseGrid.grid.cellWidth / 2);
            _this.p.rotate(noiseVal * 2 * _this.p.TWO_PI);
            arrow(_this.p, { length: _this.noiseGrid.grid.cellWidth - 1 });
            _this.p.pop();
        });
    };
    return VectorField;
}());
var numParticles = 100;
var FlowField = (function () {
    function FlowField(p, grid, noiseGrid, vectorField) {
        this.grid = grid;
        this.noiseGrid = noiseGrid;
        this.vectorField = vectorField;
        this.particles = new Array(numParticles);
        this.p = p;
        for (var i = 0; i < numParticles; i++) {
            this.particles.push(new Particle(p));
        }
    }
    FlowField.prototype.update = function () {
        this.particles.forEach(function (particle) {
            particle.update();
            particle.show();
        });
    };
    FlowField.prototype.visualize = function () {
        var _this = this;
        this.particles.forEach(function (particle) {
            particle.applyForce(_this.vectorField.forceFromPixelPos(particle.pixelPos()));
        });
    };
    return FlowField;
}());
var arrow = function (p, _a) {
    var length = _a.length;
    var headWidth = Math.ceil(length / 10);
    p.line(0, 0, length, 0);
    p.triangle(length, 0, length - headWidth, -headWidth, length - headWidth, headWidth);
};
var Fps = (function () {
    function Fps(p) {
        this.elem = p.createDiv();
        this.p = p;
    }
    Fps.prototype.update = function () {
        this.elem.html("<code>FPS: " + Math.floor(this.p.frameRate()) + "</code>");
    };
    return Fps;
}());
var sketch1 = function (p) {
    var grid;
    var noiseGrid;
    var flowField;
    var fps;
    var vectorField;
    p.setup = function () {
        grid = new Grid(p, 300, 10);
        noiseGrid = new NoiseGrid(p, grid, 0.05, 0.01);
        vectorField = new VectorField(p, noiseGrid);
        flowField = new FlowField(p, grid, noiseGrid, vectorField);
        fps = new Fps(p);
        p.background(240);
    };
    p.draw = function () {
        fps.update();
        vectorField.update();
        noiseGrid.stepZ();
        flowField.update();
    };
};
new p5(sketch1);
//# sourceMappingURL=build.js.map