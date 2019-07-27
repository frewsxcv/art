var randomPosAroundEdge = function (p) {
    var r = Math.floor(Math.random() * 4);
    if (r === 0) {
        return p.createVector(0, p.random(p.height));
    }
    if (r === 1) {
        return p.createVector(p.random(p.width), 0);
    }
    if (r === 2) {
        return p.createVector(p.width, p.random(p.height));
    }
    else {
        return p.createVector(p.random(p.width), p.height);
    }
};
var Particle = (function () {
    function Particle(p) {
        this.velLimit = 1;
        this.pos = randomPosAroundEdge(p);
        this.prevPos = this.pos;
        this.vel = p.createVector(0, 0);
        this.acc = p.createVector(0, 0);
        this.p = p;
        this.jumped = false;
    }
    Particle.prototype.pixelPos = function () {
        return new PixelPos(this.pos.x, this.pos.y);
    };
    Particle.prototype.update = function () {
        this.vel.add(this.acc);
        this.vel.limit(this.velLimit);
        this.prevPos = this.pos.copy();
        this.pos.add(this.vel);
        this.jumped = this.pos.x <= 0 || this.pos.y <= 0 || this.pos.x >= this.p.width || this.pos.y >= this.p.height;
        if (this.jumped) {
            this.pos = randomPosAroundEdge(this.p);
            return;
        }
        this.pos.add([this.p.width, this.p.height]);
        this.pos.set(this.pos.x % this.p.width, this.pos.y % this.p.height);
        this.acc.mult(0);
    };
    Particle.prototype.applyForce = function (force) {
        this.acc.add(force);
    };
    Particle.prototype.show = function () {
        if (this.jumped) {
            return;
        }
        this.p.stroke(10, 10, 10, 5);
        this.p.line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
    };
    return Particle;
}());
var distance = function (p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};
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
            var vec = p5.Vector.fromAngle(noiseVal * 4 * _this.p.TWO_PI);
            vec.setMag(0.05);
            _this.vecs[cell.gridPos.x * _this.noiseGrid.grid.numCellsInRow + cell.gridPos.y] = vec;
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
            _this.p.rotate(noiseVal * 4 * _this.p.TWO_PI);
            _this.p.stroke(0, 0, 0);
            arrow(_this.p, { length: _this.noiseGrid.grid.cellWidth - 1 });
            _this.p.pop();
        });
    };
    return VectorField;
}());
var FlowField = (function () {
    function FlowField(p, grid, noiseGrid, vectorField) {
        this.numParticles = 3000;
        this.grid = grid;
        this.noiseGrid = noiseGrid;
        this.vectorField = vectorField;
        this.particles = new Array(this.numParticles);
        this.p = p;
        for (var i = 0; i < this.numParticles; i++) {
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
        this.refreshRate = 500;
        var elem = p.createDiv();
        window.setInterval(function () {
            elem.html("<code>FPS: " + Math.floor(p.frameRate()) + "</code>");
        }, this.refreshRate);
    }
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
        noiseGrid = new NoiseGrid(p, grid, 0.022, 0.003);
        vectorField = new VectorField(p, noiseGrid);
        flowField = new FlowField(p, grid, noiseGrid, vectorField);
        p.background(240);
    };
    p.draw = function () {
        vectorField.update();
        noiseGrid.stepZ();
        flowField.update();
        flowField.visualize();
    };
};
window.addEventListener('DOMContentLoaded', function () {
    new p5(sketch1, window.document.getElementById('sketch'));
});
//# sourceMappingURL=build.js.map