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

  forEachCell(f: (x: number, y: number) => any) {
    for (let x = 0; x < this.numCellsInRow; x += 1) {
      for (let y = 0; y < this.numCellsInRow; y += 1) {
        f(x, y);
      }
    }
  }
}

class NoiseGrid {
  grid: Grid;
  offsetInc: number;
  z: number;

  constructor(grid: Grid, offsetInc: number) {
    this.grid = grid;
    this.offsetInc = offsetInc;
    this.z = 0;
  }

  stepZ() {
    this.z += this.offsetInc;
  }

  noiseAt(x: number, y: number) {
    return noise(x * this.offsetInc, y * this.offsetInc, this.z);
  }

  visualize() {
    this.grid.forEachCell((x, y) => {
      const noiseVal = this.noiseAt(x, y);
      fill(noiseVal * 255);
      rect(
        x * this.grid.cellWidth,
        y * this.grid.cellWidth,
        this.grid.cellWidth,
        this.grid.cellWidth
      );
    });
  }
}

class FlowField {
  grid: Grid;
  noiseGrid: NoiseGrid;
  vecs: number[];

  constructor(grid: Grid, noiseGrid: NoiseGrid) {
    this.grid = grid;
    this.noiseGrid = noiseGrid;
    this.vecs = new Array(grid.numCells);
  }

  update() {
    this.grid.forEachCell((x, y) => {
      const noiseVal = this.noiseGrid.noiseAt(x, y);
      this.vecs[y * this.grid.numCellsInRow + x] = noiseVal * 2 * PI;
    });
  }

  visualize() {
    this.grid.forEachCell((x, y) => {
      const noiseVal = this.noiseGrid.noiseAt(x, y);
      push();
      translate(
        x * this.grid.cellWidth + this.grid.cellWidth / 2,
        y * this.grid.cellWidth + this.grid.cellWidth / 2
      );
      rotate(noiseVal * 4 * PI);
      beginShape();
      vertex(0, 0);
      vertex(this.grid.cellWidth - 2, 0);
      vertex(this.grid.cellWidth - 3, -1);
      vertex(this.grid.cellWidth - 3, 1);
      vertex(this.grid.cellWidth - 2, 0);
      endShape();
      // line(0, 0, grid.cellWidth - 1, 0);
      pop();
    });
  }
}

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
  grid = new Grid(400, 10);
  noiseGrid = new NoiseGrid(grid, 0.1);
  flowField = new FlowField(grid, noiseGrid);
  fps = new Fps();
}

function draw() {
  background(200);

  fps.update();

  // noiseGrid.visualize();

  flowField.visualize();

  noiseGrid.stepZ();
}
