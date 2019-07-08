class Particle {
  pos: p5.Vector;
  vel: p5.Vector;
  acc: p5.Vector;
  velLimit = 5;
  p: p5;

  constructor(p: p5) {
    this.pos = p.createVector(p.random(p.width), p.random(p.height));
    this.vel = p.createVector(0, 0);
    this.acc = p.createVector(0, 0);
    this.p = p;
  }

  update() {
    this.pos.add(this.vel);
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
    this.p.stroke(0, 5);
    this.p.strokeWeight(1)
    this.p.point(this.pos.x, this.pos.y);
  }
}

interface Cell {
  x: number;
  y: number;
  xPx: number;
  yPx: number;
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
          x,
          y,
          xPx: x * this.cellWidth,
          yPx: y * this.cellWidth
        });
      }
    }
  }
}

class NoiseGrid {
  grid: Grid;
  offsetInc: number;
  z: number;
  zOffsetInc: number;
  p: p5;

  constructor(p: p5, grid: Grid, offsetInc: number, zOffsetInc: number) {
    this.grid = grid;
    this.offsetInc = offsetInc;
    this.z = 0;
    this.zOffsetInc = zOffsetInc;
    this.p = p;
  }

  stepZ() {
    this.z += this.zOffsetInc;
  }

  noiseAt(x: number, y: number) {
    return this.p.noise(x * this.offsetInc, y * this.offsetInc, this.z);
  }

  visualize() {
    this.grid.forEachCell(cell => {
      const noiseVal = this.noiseAt(cell.x, cell.y);
      this.p.fill(noiseVal * 255);
      this.p.rect(cell.xPx, cell.yPx, this.grid.cellWidth, this.grid.cellWidth);
    });
  }
}

const numParticles = 100;

class FlowField {
  grid: Grid;
  noiseGrid: NoiseGrid;
  vecs: p5.Vector[];
  updateOnEach: (_: Cell) => any;
  visualizeVectorsOnEach: (_: Cell) => any;
  particles: Particle[];
  p: p5;

  constructor(p: p5, grid: Grid, noiseGrid: NoiseGrid) {
    this.grid = grid;
    this.noiseGrid = noiseGrid;
    this.vecs = new Array(grid.numCells);
    this.particles = new Array(numParticles);
    this.p = p;
    for (let i = 0; i < numParticles; i++) {
      this.particles.push(new Particle(p));
    }

    this.updateOnEach = cell => {
      const noiseVal = this.noiseGrid.noiseAt(cell.x, cell.y);
      this.vecs[cell.y * this.grid.numCellsInRow + cell.x] = p5.Vector.fromAngle(noiseVal * 2 * this.p.PI);
    };
    this.visualizeVectorsOnEach = cell => {
      const noiseVal = this.noiseGrid.noiseAt(cell.x, cell.y);
      this.p.push();
      this.p.translate(
        cell.xPx + this.grid.cellWidth / 2,
        cell.yPx + this.grid.cellWidth / 2
      );
      this.p.rotate(noiseVal * 2 * this.p.TWO_PI);
      arrow(p, { length: this.grid.cellWidth - 1 });
      this.p.pop();
    };
  }

  update() {
    this.grid.forEachCell(this.updateOnEach);
    this.particles.forEach((particle) => {
      particle.update();
      particle.show();
    });
  }

  forceFromPos(xPx: number, yPx: number) {
    const x = this.p.floor(xPx / this.grid.cellWidth);
    const y = this.p.floor(yPx / this.grid.cellWidth);
    const index = x + y * this.grid.numCellsInRow;
    return this.vecs[index];
  }

  visualizeVectors() {
    this.grid.forEachCell(this.visualizeVectorsOnEach);
  }

  visualize() {
    this.particles.forEach(particle => {
      particle.applyForce(
        this.forceFromPos(particle.pos.x, particle.pos.y)
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
  elem: p5.Element;
  p: p5;

  constructor(p: p5) {
    this.elem = p.createDiv();
    this.p = p;
  }

  update() {
    this.elem.html("<code>FPS: " + Math.floor(this.p.frameRate()) + "</code>");
  }
}

const sketch1 = (p: p5) => {
  let grid: Grid;
  let noiseGrid: NoiseGrid;
  let flowField: FlowField;
  let fps: Fps;

  p.setup = () => {
    grid = new Grid(p, 300, 10);
    noiseGrid = new NoiseGrid(p, grid, 0.05, 0.01);
    flowField = new FlowField(p, grid, noiseGrid);
    fps = new Fps(p);
    p.background(240);
  };

  p.draw = () => {
    // p.noLoop();
    fps.update();

    // noiseGrid.visualize();

    flowField.update();

    // flowField.visualizeVectors();
    // flowField.visualize();

    noiseGrid.stepZ();
  };
};

new p5(sketch1);