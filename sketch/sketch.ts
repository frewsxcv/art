class Particle {
  pos: p5.Vector;
  prevPos: p5.Vector;
  vel: p5.Vector;
  acc: p5.Vector;
  velLimit = 1;
  p: p5;
  jumped: boolean;

  constructor(p: p5) {
    this.pos = p.createVector(p.random(p.width), p.random(p.height));
    this.prevPos = this.pos;
    this.vel = p.createVector(0, 0);
    this.acc = p.createVector(0, 0);
    this.p = p;
    this.jumped = false;
  }

  pixelPos() {
    return new PixelPos(this.pos.x, this.pos.y);
  }

  update() {
    this.prevPos = this.pos.copy();
    this.pos.add(this.vel);
    this.jumped = this.pos.x < 0 || this.pos.y < 0 || this.pos.x > this.p.width || this.pos.y > this.p.height;
    const x = this.pos.copy();
    // Add width and height to account to push the negative values into positive.
    this.pos.add([this.p.width, this.p.height]);
    this.pos.set(this.pos.x % this.p.width, this.pos.y % this.p.height);

    this.vel.add(this.acc);
    this.vel.limit(this.velLimit);

    this.acc.mult(0);
  }

  applyForce(force: p5.Vector) {
    this.acc.add(force);
  }

  show() {
    if (this.jumped) {
      return;
    }
    this.p.stroke(0, 2);
    this.p.strokeWeight(1);
    this.p.line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
    // this.p.point(this.pos.x, this.pos.y);
  }
}

class PixelPos {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toGridPos(grid: Grid) {
    return new GridPos(
      Math.floor(this.x / grid.cellWidth),
      Math.floor(this.y / grid.cellWidth)
    );
  }
}

class GridPos {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

interface Cell {
  gridPos: GridPos;
  pixelPos: PixelPos;
}

class Grid {
  gridWidth: number;
  cellWidth: number;
  numCellsInRow: number;
  numCells: number;

  constructor(p: p5, gridWidth: number, cellWidth: number) {
    p.createCanvas(gridWidth, gridWidth);
    this.gridWidth = gridWidth;
    this.cellWidth = cellWidth;
    this.numCellsInRow = gridWidth / cellWidth;
    this.numCells = Math.pow(this.numCellsInRow, 2);
  }

  forEachCell(f: (cell: Cell) => any) {
    for (let x = 0; x < this.numCellsInRow; x += 1) {
      for (let y = 0; y < this.numCellsInRow; y += 1) {
        f({
          gridPos: new GridPos(x, y),
          pixelPos: new PixelPos(x * this.cellWidth, y * this.cellWidth)
        });
      }
    }
  }
}

class NoiseGrid {
  grid: Grid;
  xyOffsetInc: number;
  zOffset: number;
  zOffsetInc: number;
  p: p5;

  constructor(p: p5, grid: Grid, xyOffsetInc: number, zOffsetInc: number) {
    this.grid = grid;
    this.xyOffsetInc = xyOffsetInc;
    this.zOffset = 0;
    this.zOffsetInc = zOffsetInc;
    this.p = p;
  }

  stepZ() {
    this.zOffset += this.zOffsetInc;
  }

  noiseAt(gridPos: GridPos) {
    return this.p.noise(
      gridPos.x * this.xyOffsetInc,
      gridPos.y * this.xyOffsetInc,
      this.zOffset
    );
  }

  visualize() {
    this.grid.forEachCell(cell => {
      const noiseVal = this.noiseAt(cell.gridPos);
      this.p.fill(noiseVal * 255);
      this.p.rect(
        cell.pixelPos.x,
        cell.pixelPos.y,
        this.grid.cellWidth,
        this.grid.cellWidth
      );
    });
  }
}

class VectorField {
  p: p5;
  vecs: p5.Vector[];
  noiseGrid: NoiseGrid;

  constructor(p: p5, noiseGrid: NoiseGrid) {
    this.vecs = new Array(noiseGrid.grid.numCells);
    this.noiseGrid = noiseGrid;
    this.p = p;
  }

  update() {
    this.noiseGrid.grid.forEachCell(cell => {
      const noiseVal = this.noiseGrid.noiseAt(cell.gridPos);
      this.vecs[
        cell.gridPos.x * this.noiseGrid.grid.numCellsInRow + cell.gridPos.y
      ] = p5.Vector.fromAngle(noiseVal * 2 * this.p.PI);
    });
  }

  forceFromPixelPos(pixelPos: PixelPos) {
    const gridPos = pixelPos.toGridPos(this.noiseGrid.grid);
    const index = gridPos.x + gridPos.y * this.noiseGrid.grid.numCellsInRow;
    return this.vecs[index];
  }

  visualize() {
    this.noiseGrid.grid.forEachCell(cell => {
      const noiseVal = this.noiseGrid.noiseAt(cell.gridPos);
      this.p.push();
      this.p.translate(
        cell.pixelPos.x + this.noiseGrid.grid.cellWidth / 2,
        cell.pixelPos.y + this.noiseGrid.grid.cellWidth / 2
      );
      this.p.rotate(noiseVal * 2 * this.p.TWO_PI);
      arrow(this.p, { length: this.noiseGrid.grid.cellWidth - 1 });
      this.p.pop();
    });
  }
}

class FlowField {
  grid: Grid;
  noiseGrid: NoiseGrid;
  vectorField: VectorField;
  particles: Particle[];
  p: p5;
  numParticles = 1000;

  constructor(
    p: p5,
    grid: Grid,
    noiseGrid: NoiseGrid,
    vectorField: VectorField
  ) {
    this.grid = grid;
    this.noiseGrid = noiseGrid;
    this.vectorField = vectorField;
    this.particles = new Array(this.numParticles);
    this.p = p;
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push(new Particle(p));
    }
  }

  update() {
    this.particles.forEach(particle => {
      particle.update();
      particle.show();
    });
  }

  visualize() {
    this.particles.forEach(particle => {
      particle.applyForce(
        this.vectorField.forceFromPixelPos(particle.pixelPos())
      );
    });
  }
}

const arrow = (p: p5, { length }: { length: number }) => {
  const headWidth = Math.ceil(length / 10);
  p.line(0, 0, length, 0);
  p.triangle(
    length,
    0,
    length - headWidth,
    -headWidth,
    length - headWidth,
    headWidth
  );
};

class Fps {
  refreshRate = 500; // 0.5 seconds

  constructor(p: p5) {
    const elem = p.createDiv();
    window.setInterval(() => {
      elem.html("<code>FPS: " + Math.floor(p.frameRate()) + "</code>");
    }, this.refreshRate);
  }
}

const sketch1 = (p: p5) => {
  let grid: Grid;
  let noiseGrid: NoiseGrid;
  let flowField: FlowField;
  let fps: Fps;
  let vectorField: VectorField;

  p.setup = () => {
    grid = new Grid(p, 300, 10);
    noiseGrid = new NoiseGrid(p, grid, 0.05, 0.01);
    vectorField = new VectorField(p, noiseGrid);
    flowField = new FlowField(p, grid, noiseGrid, vectorField);
    fps = new Fps(p);
    p.background(240);
  };

  p.draw = () => {
    vectorField.update();
    noiseGrid.stepZ();
    flowField.update();

    // vectorField.visualize();
    flowField.visualize();
    // noiseGrid.visualize();
  };
};

new p5(sketch1);
