class Particle {
  pos: p5.Vector;
  vel: p5.Vector;
  acc: p5.Vector;

  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(random(2) - 1, random(2) - 1);
    this.acc = createVector(0, 0);
  }

  update() {
    this.pos.add(this.vel);
    // Add width and height to account to push the negative values into positive.
    this.pos.add([width, height]);
    this.pos.set(this.pos.x % width, this.pos.y % height);

    this.vel.add(this.acc);
    this.vel.limit(1.5);

    this.acc.mult(0);
  }

  applyForce(force: p5.Vector) {
    this.acc.add(force);
  }

  show() {
    stroke(0, 100);
    strokeWeight(1)
    point(this.pos.x, this.pos.y);
  }

  follow(flowField: FlowField) {
    // TODO: 10 and other nums shouldnt be hardcoded
    const x = floor(this.pos.x / 10);
    const y = floor(this.pos.y / 10);
    const index = x + y * 30;
    const force = flowField.vecs[index];
    this.applyForce(force);
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

  constructor(gridWidth: number, cellWidth: number) {
    createCanvas(gridWidth, gridWidth);
    this.gridWidth = gridWidth;
    this.cellWidth = cellWidth;
    this.numCellsInRow = gridWidth / cellWidth;
    this.numCells = Math.pow(this.numCellsInRow, 2);
  }

  // cellIdxFromPx(xPx: number, yPx: number) {
  // }

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

  constructor(grid: Grid, offsetInc: number, zOffsetInc: number) {
    this.grid = grid;
    this.offsetInc = offsetInc;
    this.z = 0;
    this.zOffsetInc = zOffsetInc;
  }

  stepZ() {
    this.z += this.zOffsetInc;
  }

  noiseAt(x: number, y: number) {
    return noise(x * this.offsetInc, y * this.offsetInc, this.z);
  }

  visualize() {
    this.grid.forEachCell(cell => {
      const noiseVal = this.noiseAt(cell.x, cell.y);
      fill(noiseVal * 255);
      rect(cell.xPx, cell.yPx, this.grid.cellWidth, this.grid.cellWidth);
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

  constructor(grid: Grid, noiseGrid: NoiseGrid) {
    this.grid = grid;
    this.noiseGrid = noiseGrid;
    this.vecs = new Array(grid.numCells);
    this.particles = new Array(numParticles);
    for (let i = 0; i < numParticles; i++) {
      this.particles.push(new Particle());
    }

    this.updateOnEach = cell => {
      const noiseVal = this.noiseGrid.noiseAt(cell.x, cell.y);
      this.vecs[cell.y * this.grid.numCellsInRow + cell.x] = p5.Vector.fromAngle(noiseVal * 2 * PI);
    };
    this.visualizeVectorsOnEach = cell => {
      const noiseVal = this.noiseGrid.noiseAt(cell.x, cell.y);
      push();
      translate(
        cell.xPx + this.grid.cellWidth / 2,
        cell.yPx + this.grid.cellWidth / 2
      );
      rotate(noiseVal * 2 * TWO_PI);
      arrow({ length: this.grid.cellWidth - 1 });
      pop();
    };
  }

  update() {
    this.grid.forEachCell(this.updateOnEach);
    this.particles.forEach((particle) => {
      particle.update();
      particle.show();
    });
  }

  visualizeVectors() {
    this.grid.forEachCell(this.visualizeVectorsOnEach);
  }

  visualize() {
    this.particles.forEach(particle => {
      particle.follow(flowField);
    });
  }
}

const arrow = ({ length }: { length: number }) => {
  const headWidth = Math.ceil(length / 10);
  line(0, 0, length, 0);
  triangle(
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

  constructor() {
    this.elem = createDiv();
  }

  update() {
    this.elem.html("<code>FPS: " + Math.floor(frameRate()) + "</code>");
  }
}

let grid: Grid;
let noiseGrid: NoiseGrid;
let flowField: FlowField;
let fps: Fps;

function setup() {
  grid = new Grid(300, 10);
  noiseGrid = new NoiseGrid(grid, 0.1, 0.01);
  flowField = new FlowField(grid, noiseGrid);
  fps = new Fps();
  background(200);
}

function draw() {
  fps.update();

  // noiseGrid.visualize();

  flowField.update();

  flowField.visualize();

  noiseGrid.stepZ();
}
