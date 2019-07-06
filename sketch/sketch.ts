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
    this.grid.forEachCell(cell => {
      const noiseVal = this.noiseAt(cell.x, cell.y);
      fill(noiseVal * 255);
      rect(cell.xPx, cell.yPx, this.grid.cellWidth, this.grid.cellWidth);
    });
  }
}

class FlowField {
  grid: Grid;
  noiseGrid: NoiseGrid;
  vecs: number[];
  updateOnEach: (_: Cell) => any;
  visualizeOnEach: (_: Cell) => any;

  constructor(grid: Grid, noiseGrid: NoiseGrid) {
    this.grid = grid;
    this.noiseGrid = noiseGrid;
    this.vecs = new Array(grid.numCells);
    this.updateOnEach = cell => {
      const noiseVal = this.noiseGrid.noiseAt(cell.x, cell.y);
      this.vecs[cell.y * this.grid.numCellsInRow + cell.x] = noiseVal * 2 * PI;
    };
    this.visualizeOnEach = cell => {
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
  }

  visualize() {
    this.grid.forEachCell(this.visualizeOnEach);
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
  grid = new Grid(600, 10);
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
