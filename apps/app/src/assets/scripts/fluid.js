/*
I tweaked the original code quite a bit.

You can find the original here: https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/18-flip.html
And a copy of its license below.

---

Copyright 2022 Matthias Müller - Ten Minute Physics,
www.youtube.com/c/TenMinutePhysics
www.matthiasMueller.info/tenMinutePhysics

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const TARGET_LONG_SIDE = 128 * 74;
const MIN_GRID_SIZE = 12;
const CELL_CROP_X = 1;
const CELL_CROP_Y = 2;

const BASE = [
  ['@', 42996],
  ['&', 35409],
  ['X', 32454],
  ['$', 32427],
  ['=', 19752],
  ['+', 16884],
  ['~', 12198],
  [':', 6921],
  ['-', 5589],
  ['·', 3267],
  [' ', 0],
  [' ', 0],
];

const RENDER_CHARS = [
  [['H', 26574], ['H', 26574], ['h', 17490], ...BASE],
  [['E', 21327], ['E', 21327], ['e', 14019], ...BASE],
  [['L', 32973], ['L', 32973], ['l', 24093], ...BASE],
  [['L', 14883], ['L', 14883], ['l', 13638], ...BASE],
  [['O', 36198], ['O', 36198], ['o', 30762], ...BASE],
];

// // amount of bright pixels a character shows at 12px font size
// const RENDER_CHAR_B = [
//   [" ", 0],
//   [" ", 0],
//   ["·", 18700 / 4],
//   ["·", 18700 / 4],
//   [":", 35984 / 4],

//   ["-", 30980 / 4],
//   ["-", 30980 / 4],

//   ["~", 41648 / 4],
//   // ["~", 41648 / 4],

//   ["=", 75592 / 4],
//   ["+", 75592 / 4],
//   // ["#", 151600 / 4],
//   ["X", 142104 / 4],

//   // ["@", 175768 / 4],
//   // ["@", 175768 / 4],

//   ["&", 176176 / 4],
//   ["$", 177400 / 4],
// ];

// const RENDER_CHAR_DICTIONARY = RENDER_CHAR_B.sort((a, b) => a[1] - b[1])
//   .map(([char]) => char)
//   .join("");

const canvasEl = document.getElementById('canvas');
const renderEl = document.querySelector('.render');

const GRID_SIZE = Math.max(
  Math.round(Math.sqrt((window.innerWidth * window.innerHeight) / TARGET_LONG_SIDE)),
  MIN_GRID_SIZE
);

const SPEED_1 = 1.0 / 60.0 / 16;
const SPEED_BASE = 1.0 / 60.0 / 3;
const SPEED_2 = 1.0 / 60.0 / 1.25;

const realWidth = Math.ceil(window.innerWidth / GRID_SIZE + CELL_CROP_X * 2) * GRID_SIZE;
const realHeight = Math.ceil(window.innerHeight / GRID_SIZE + CELL_CROP_Y * 2) * GRID_SIZE;

const Y_RESOLUTION = realHeight / GRID_SIZE;
const X_RESOLUTION = realWidth / GRID_SIZE;
const RESOLUTION = Y_RESOLUTION;

const GRAVITY = -9.81;

const extraSized = 0;

canvasEl.width = realWidth;
canvasEl.height = realHeight;
canvasEl.style.width = `${realWidth}px`;
canvasEl.style.height = `${realHeight}px`;
renderEl.style.width = `${realWidth}px`;
renderEl.style.height = `${realHeight}px`;
document.documentElement.style.setProperty('--cell-size', `${GRID_SIZE}px`);

canvasEl.focus();

const simHeight = 2.0;

const cScale = canvasEl.height / simHeight;
const simWidth = canvasEl.width / cScale;

const U_FIELD = 0;
const V_FIELD = 1;

const FLUID_CELL = 0;
const AIR_CELL = 1;
const SOLID_CELL = 2;

const cnt = 0;

function clamp(x, min, max) {
  if (x < min) return min;
  else if (x > max) return max;
  else return x;
}

// ----------------- start of simulator ------------------------------

class FlipFluid {
  constructor(density, width, height, spacing, particleRadius, maxParticles) {
    // fluid

    this.density = density;
    this.fNumX = Math.floor(width / spacing);
    this.fNumY = Math.floor(height / spacing);
    this.h = Math.max(width / this.fNumX, height / this.fNumY);
    this.fInvSpacing = 1.0 / this.h;
    this.fNumCells = this.fNumX * this.fNumY;

    this.u = new Float32Array(this.fNumCells);
    this.v = new Float32Array(this.fNumCells);
    this.du = new Float32Array(this.fNumCells);
    this.dv = new Float32Array(this.fNumCells);
    this.prevU = new Float32Array(this.fNumCells);
    this.prevV = new Float32Array(this.fNumCells);
    this.p = new Float32Array(this.fNumCells);
    this.s = new Float32Array(this.fNumCells);
    this.cellType = new Int32Array(this.fNumCells);
    this.cellColor = new Float32Array(3 * this.fNumCells);

    // particles

    this.maxParticles = maxParticles;

    this.particlePos = new Float32Array(2 * this.maxParticles);
    this.particleColor = new Float32Array(3 * this.maxParticles);
    for (let i = 0; i < this.maxParticles; i++) this.particleColor[3 * i + 2] = 1.0;

    this.particleVel = new Float32Array(2 * this.maxParticles);
    this.particleDensity = new Float32Array(this.fNumCells);
    this.particleRestDensity = 0.0;

    this.particleRadius = particleRadius;
    this.pInvSpacing = 1.0 / (2.2 * particleRadius);
    this.pNumX = Math.floor(width * this.pInvSpacing) + 1;
    this.pNumY = Math.floor(height * this.pInvSpacing) + 1;
    this.pNumCells = this.pNumX * this.pNumY;

    this.numCellParticles = new Int32Array(this.pNumCells);
    this.firstCellParticle = new Int32Array(this.pNumCells + 1);
    this.cellParticleIds = new Int32Array(maxParticles);

    this.numParticles = 0;
  }

  integrateParticles(dt) {
    for (let i = 0; i < this.numParticles; i++) {
      let gravityX = 0;
      let gravityY = GRAVITY;

      if (window.gravityVector) {
        gravityX = window.gravityVector.x;
        gravityY = window.gravityVector.y;
      }

      this.particleVel[2 * i] += dt * gravityX;
      this.particleVel[2 * i + 1] += dt * gravityY;
      this.particlePos[2 * i] += this.particleVel[2 * i] * dt;
      this.particlePos[2 * i + 1] += this.particleVel[2 * i + 1] * dt;
    }
  }

  pushParticlesApart(numIters) {
    const colorDiffusionCoeff = 0.001;

    // count particles per cell

    this.numCellParticles.fill(0);

    for (var i = 0; i < this.numParticles; i++) {
      var x = this.particlePos[2 * i];
      var y = this.particlePos[2 * i + 1];

      var xi = clamp(Math.floor(x * this.pInvSpacing), 0, this.pNumX - 1);
      var yi = clamp(Math.floor(y * this.pInvSpacing), 0, this.pNumY - 1);
      var cellNr = xi * this.pNumY + yi;
      this.numCellParticles[cellNr]++;
    }

    // partial sums

    var first = 0;

    for (var i = 0; i < this.pNumCells; i++) {
      first += this.numCellParticles[i];
      this.firstCellParticle[i] = first;
    }
    this.firstCellParticle[this.pNumCells] = first; // guard

    // fill particles into cells

    for (var i = 0; i < this.numParticles; i++) {
      var x = this.particlePos[2 * i];
      var y = this.particlePos[2 * i + 1];

      var xi = clamp(Math.floor(x * this.pInvSpacing), 0, this.pNumX - 1);
      var yi = clamp(Math.floor(y * this.pInvSpacing), 0, this.pNumY - 1);
      var cellNr = xi * this.pNumY + yi;
      this.firstCellParticle[cellNr]--;
      this.cellParticleIds[this.firstCellParticle[cellNr]] = i;
    }

    // push particles apart

    const minDist = 2.0 * this.particleRadius;
    const minDist2 = minDist * minDist;

    for (let iter = 0; iter < numIters; iter++) {
      for (var i = 0; i < this.numParticles; i++) {
        const px = this.particlePos[2 * i];
        const py = this.particlePos[2 * i + 1];

        const pxi = Math.floor(px * this.pInvSpacing);
        const pyi = Math.floor(py * this.pInvSpacing);
        const x0 = Math.max(pxi - 1, 0);
        const y0 = Math.max(pyi - 1, 0);
        const x1 = Math.min(pxi + 1, this.pNumX - 1);
        const y1 = Math.min(pyi + 1, this.pNumY - 1);

        for (var xi = x0; xi <= x1; xi++) {
          for (var yi = y0; yi <= y1; yi++) {
            var cellNr = xi * this.pNumY + yi;
            var first = this.firstCellParticle[cellNr];
            const last = this.firstCellParticle[cellNr + 1];
            for (let j = first; j < last; j++) {
              const id = this.cellParticleIds[j];
              if (id == i) continue;
              const qx = this.particlePos[2 * id];
              const qy = this.particlePos[2 * id + 1];

              let dx = qx - px;
              let dy = qy - py;
              const d2 = dx * dx + dy * dy;
              if (d2 > minDist2 || d2 == 0.0) continue;
              const d = Math.sqrt(d2);
              const s = (0.5 * (minDist - d)) / d;
              dx *= s;
              dy *= s;
              this.particlePos[2 * i] -= dx;
              this.particlePos[2 * i + 1] -= dy;
              this.particlePos[2 * id] += dx;
              this.particlePos[2 * id + 1] += dy;

              // diffuse colors

              // for (var k = 0; k < 3; k++) {
              //   var color0 = this.particleColor[3 * i + k];
              //   var color1 = this.particleColor[3 * id + k];
              //   var color = (color0 + color1) * 0.5;
              //   this.particleColor[3 * i + k] =
              //     color0 + (color - color0) * colorDiffusionCoeff;
              //   this.particleColor[3 * id + k] =
              //     color1 + (color - color1) * colorDiffusionCoeff;
              // }
            }
          }
        }
      }
    }
  }

  handleParticleCollisions(obstacleX, obstacleY, obstacleRadius) {
    const h = 1.0 / this.fInvSpacing;
    const r = this.particleRadius;

    const minX = h + r;
    const maxX = (this.fNumX - 1) * h - r;
    const minY = h + r;
    const maxY = (this.fNumY - 1) * h - r;

    for (let i = 0; i < this.numParticles; i++) {
      let x = this.particlePos[2 * i];
      let y = this.particlePos[2 * i + 1];

      // Define triangle vertices based on obstacleX, obstacleY and obstacleRadius
      const trianglePoints = [
        {
          x: obstacleX,
          y: obstacleY + obstacleRadius,
        }, // top
        {
          x: obstacleX - obstacleRadius * Math.cos(Math.PI / 6),
          y: obstacleY - obstacleRadius * Math.sin(Math.PI / 6),
        }, // bottom left
        {
          x: obstacleX + obstacleRadius * Math.cos(Math.PI / 6),
          y: obstacleY - obstacleRadius * Math.sin(Math.PI / 6),
        }, // bottom right
      ];

      // Function to check if point is inside triangle
      function pointInTriangle(px, py, v1, v2, v3) {
        const d1 = sign(px, py, v1.x, v1.y, v2.x, v2.y);
        const d2 = sign(px, py, v2.x, v2.y, v3.x, v3.y);
        const d3 = sign(px, py, v3.x, v3.y, v1.x, v1.y);
        const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
        const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
        return !(hasNeg && hasPos);
      }

      function sign(px, py, x1, y1, x2, y2) {
        return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
      }

      // Check collision with triangle
      if (pointInTriangle(x, y, trianglePoints[0], trianglePoints[1], trianglePoints[2])) {
        // Find closest point on triangle and push particle out
        let closestPoint = {
          x,
          y,
        };
        let minDist = Number.MAX_VALUE;

        // Check against each edge
        for (let i = 0; i < 3; i++) {
          const p1 = trianglePoints[i];
          const p2 = trianglePoints[(i + 1) % 3];

          const edge = {
            x: p2.x - p1.x,
            y: p2.y - p1.y,
          };
          const point = {
            x: x - p1.x,
            y: y - p1.y,
          };

          const len = edge.x * edge.x + edge.y * edge.y;
          const t = Math.max(0, Math.min(1, (point.x * edge.x + point.y * edge.y) / len));

          const proj = {
            x: p1.x + t * edge.x,
            y: p1.y + t * edge.y,
          };

          const dist = Math.sqrt((x - proj.x) * (x - proj.x) + (y - proj.y) * (y - proj.y));
          if (dist < minDist) {
            minDist = dist;
            closestPoint = proj;
          }
        }

        // Push particle out
        const dx = x - closestPoint.x;
        const dy = y - closestPoint.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0) {
          x = closestPoint.x;
          y = closestPoint.y;
        }

        this.particleVel[2 * i] = 0;
        this.particleVel[2 * i + 1] = 0;
      }

      // wall collisions

      if (x < minX) {
        x = minX;
        this.particleVel[2 * i] = 0.0;
      }
      if (x > maxX) {
        x = maxX;
        this.particleVel[2 * i] = 0.0;
      }

      if (y < minY) {
        y = minY;
        this.particleVel[2 * i + 1] = 0.0;
      }
      if (y > maxY) {
        y = maxY;
        this.particleVel[2 * i + 1] = 0.0;
      }
      this.particlePos[2 * i] = x;
      this.particlePos[2 * i + 1] = y;
    }
  }

  updateParticleDensity() {
    const n = this.fNumY;
    const h = this.h;
    const h1 = this.fInvSpacing;
    const h2 = 0.5 * h;

    const d = f.particleDensity;

    d.fill(0.0);

    for (var i = 0; i < this.numParticles; i++) {
      let x = this.particlePos[2 * i];
      let y = this.particlePos[2 * i + 1];

      x = clamp(x, h, (this.fNumX - 1) * h);
      y = clamp(y, h, (this.fNumY - 1) * h);

      const x0 = Math.floor((x - h2) * h1);
      const tx = (x - h2 - x0 * h) * h1;
      const x1 = Math.min(x0 + 1, this.fNumX - 2);

      const y0 = Math.floor((y - h2) * h1);
      const ty = (y - h2 - y0 * h) * h1;
      const y1 = Math.min(y0 + 1, this.fNumY - 2);

      const sx = 1.0 - tx;
      const sy = 1.0 - ty;

      if (x0 < this.fNumX && y0 < this.fNumY) d[x0 * n + y0] += sx * sy;
      if (x1 < this.fNumX && y0 < this.fNumY) d[x1 * n + y0] += tx * sy;
      if (x1 < this.fNumX && y1 < this.fNumY) d[x1 * n + y1] += tx * ty;
      if (x0 < this.fNumX && y1 < this.fNumY) d[x0 * n + y1] += sx * ty;
    }

    if (this.particleRestDensity == 0.0) {
      let sum = 0.0;
      let numFluidCells = 0;

      for (var i = 0; i < this.fNumCells; i++) {
        if (this.cellType[i] == FLUID_CELL) {
          sum += d[i];
          numFluidCells++;
        }
      }

      if (numFluidCells > 0) this.particleRestDensity = sum / numFluidCells;
    }
  }

  transferVelocities(toGrid, flipRatio) {
    const n = this.fNumY;
    const h = this.h;
    const h1 = this.fInvSpacing;
    const h2 = 0.5 * h;

    if (toGrid) {
      this.prevU.set(this.u);
      this.prevV.set(this.v);

      this.du.fill(0.0);
      this.dv.fill(0.0);
      this.u.fill(0.0);
      this.v.fill(0.0);

      for (var i = 0; i < this.fNumCells; i++) this.cellType[i] = this.s[i] == 0.0 ? SOLID_CELL : AIR_CELL;

      for (var i = 0; i < this.numParticles; i++) {
        var x = this.particlePos[2 * i];
        var y = this.particlePos[2 * i + 1];
        const xi = clamp(Math.floor(x * h1), 0, this.fNumX - 1);
        const yi = clamp(Math.floor(y * h1), 0, this.fNumY - 1);
        const cellNr = xi * n + yi;
        if (this.cellType[cellNr] == AIR_CELL) this.cellType[cellNr] = FLUID_CELL;
      }
    }

    for (let component = 0; component < 2; component++) {
      const dx = component == 0 ? 0.0 : h2;
      const dy = component == 0 ? h2 : 0.0;

      const f = component == 0 ? this.u : this.v;
      const prevF = component == 0 ? this.prevU : this.prevV;
      var d = component == 0 ? this.du : this.dv;

      for (var i = 0; i < this.numParticles; i++) {
        var x = this.particlePos[2 * i];
        var y = this.particlePos[2 * i + 1];

        x = clamp(x, h, (this.fNumX - 1) * h);
        y = clamp(y, h, (this.fNumY - 1) * h);

        const x0 = Math.min(Math.floor((x - dx) * h1), this.fNumX - 2);
        const tx = (x - dx - x0 * h) * h1;
        const x1 = Math.min(x0 + 1, this.fNumX - 2);

        const y0 = Math.min(Math.floor((y - dy) * h1), this.fNumY - 2);
        const ty = (y - dy - y0 * h) * h1;
        const y1 = Math.min(y0 + 1, this.fNumY - 2);

        const sx = 1.0 - tx;
        const sy = 1.0 - ty;

        const d0 = sx * sy;
        const d1 = tx * sy;
        const d2 = tx * ty;
        const d3 = sx * ty;

        const nr0 = x0 * n + y0;
        const nr1 = x1 * n + y0;
        const nr2 = x1 * n + y1;
        const nr3 = x0 * n + y1;

        if (toGrid) {
          const pv = this.particleVel[2 * i + component];
          f[nr0] += pv * d0;
          d[nr0] += d0;
          f[nr1] += pv * d1;
          d[nr1] += d1;
          f[nr2] += pv * d2;
          d[nr2] += d2;
          f[nr3] += pv * d3;
          d[nr3] += d3;
        } else {
          const offset = component == 0 ? n : 1;
          const valid0 = this.cellType[nr0] != AIR_CELL || this.cellType[nr0 - offset] != AIR_CELL ? 1.0 : 0.0;
          const valid1 = this.cellType[nr1] != AIR_CELL || this.cellType[nr1 - offset] != AIR_CELL ? 1.0 : 0.0;
          const valid2 = this.cellType[nr2] != AIR_CELL || this.cellType[nr2 - offset] != AIR_CELL ? 1.0 : 0.0;
          const valid3 = this.cellType[nr3] != AIR_CELL || this.cellType[nr3 - offset] != AIR_CELL ? 1.0 : 0.0;

          const v = this.particleVel[2 * i + component];
          var d = valid0 * d0 + valid1 * d1 + valid2 * d2 + valid3 * d3;

          if (d > 0.0) {
            const picV =
              (valid0 * d0 * f[nr0] + valid1 * d1 * f[nr1] + valid2 * d2 * f[nr2] + valid3 * d3 * f[nr3]) / d;
            const corr =
              (valid0 * d0 * (f[nr0] - prevF[nr0]) +
                valid1 * d1 * (f[nr1] - prevF[nr1]) +
                valid2 * d2 * (f[nr2] - prevF[nr2]) +
                valid3 * d3 * (f[nr3] - prevF[nr3])) /
              d;
            const flipV = v + corr;

            this.particleVel[2 * i + component] = (1.0 - flipRatio) * picV + flipRatio * flipV;
          }
        }
      }

      if (toGrid) {
        for (var i = 0; i < f.length; i++) {
          if (d[i] > 0.0) f[i] /= d[i];
        }

        // restore solid cells

        for (var i = 0; i < this.fNumX; i++) {
          for (let j = 0; j < this.fNumY; j++) {
            const solid = this.cellType[i * n + j] == SOLID_CELL;
            if (solid || (i > 0 && this.cellType[(i - 1) * n + j] == SOLID_CELL))
              this.u[i * n + j] = this.prevU[i * n + j];
            if (solid || (j > 0 && this.cellType[i * n + j - 1] == SOLID_CELL))
              this.v[i * n + j] = this.prevV[i * n + j];
          }
        }
      }
    }
  }

  solveIncompressibility(numIters, dt, overRelaxation, compensateDrift = true) {
    this.p.fill(0.0);
    this.prevU.set(this.u);
    this.prevV.set(this.v);

    const n = this.fNumY;
    const cp = (this.density * this.h) / dt;

    for (var i = 0; i < this.fNumCells; i++) {
      const u = this.u[i];
      const v = this.v[i];
    }

    for (let iter = 0; iter < numIters; iter++) {
      for (var i = 1; i < this.fNumX - 1; i++) {
        for (let j = 1; j < this.fNumY - 1; j++) {
          if (this.cellType[i * n + j] != FLUID_CELL) continue;

          const center = i * n + j;
          const left = (i - 1) * n + j;
          const right = (i + 1) * n + j;
          const bottom = i * n + j - 1;
          const top = i * n + j + 1;

          var s = this.s[center];
          const sx0 = this.s[left];
          const sx1 = this.s[right];
          const sy0 = this.s[bottom];
          const sy1 = this.s[top];
          var s = sx0 + sx1 + sy0 + sy1;
          if (s == 0.0) continue;

          let div = this.u[right] - this.u[center] + this.v[top] - this.v[center];

          if (this.particleRestDensity > 0.0 && compensateDrift) {
            const k = 1.0;
            const compression = this.particleDensity[i * n + j] - this.particleRestDensity;
            if (compression > 0.0) div = div - k * compression;
          }

          let p = -div / s;
          p *= overRelaxation;
          this.p[center] += cp * p;

          this.u[center] -= sx0 * p;
          this.u[right] += sx1 * p;
          this.v[center] -= sy0 * p;
          this.v[top] += sy1 * p;
        }
      }
    }
  }

  updateParticleColors() {
    const h1 = this.fInvSpacing;

    for (let i = 0; i < this.numParticles; i++) {
      var s = 0.01;

      this.particleColor[3 * i] = clamp(this.particleColor[3 * i] - s, 0.0, 1.0);
      this.particleColor[3 * i + 1] = clamp(this.particleColor[3 * i + 1] - s, 0.0, 1.0);
      this.particleColor[3 * i + 2] = clamp(this.particleColor[3 * i + 2] + s, 0.0, 1.0);

      const x = this.particlePos[2 * i];
      const y = this.particlePos[2 * i + 1];
      const xi = clamp(Math.floor(x * h1), 1, this.fNumX - 1);
      const yi = clamp(Math.floor(y * h1), 1, this.fNumY - 1);
      const cellNr = xi * this.fNumY + yi;

      const d0 = this.particleRestDensity;

      if (d0 > 0.0) {
        const relDensity = this.particleDensity[cellNr] / d0;
        if (relDensity < 0.7) {
          var s = 0.8;
          this.particleColor[3 * i] = s;
          this.particleColor[3 * i + 1] = s;
          this.particleColor[3 * i + 2] = s;
        }
      }
    }
  }

  setSciColor(cellNr, val, minVal, maxVal) {
    val = Math.min(Math.max(val, minVal), maxVal - 0.0001);
    const d = maxVal - minVal;
    val = d == 0.0 ? 0.5 : (val - minVal) / d;
    const m = 0.25;
    const num = Math.floor(val / m);
    const s = (val - num * m) / m;
    let r, g, b;

    switch (num) {
      case 0:
        r = s;
        g = s;
        b = s;
        break;
      case 1:
        r = 1.0 - s;
        g = 1.0 - s;
        b = 1.0 - s;
        break;
      case 2:
        r = s;
        g = s;
        b = s;
        break;
      case 3:
        r = 1.0 - s;
        g = 1.0 - s;
        b = 1.0 - s;
        break;
    }

    this.cellColor[3 * cellNr] = r;
    this.cellColor[3 * cellNr + 1] = g;
    this.cellColor[3 * cellNr + 2] = b;
  }

  updateCellColors() {
    this.cellColor.fill(0.0);

    for (let i = 0; i < this.fNumCells; i++) {
      if (this.cellType[i] == SOLID_CELL) {
        this.cellColor[3 * i] = 0.5;
        this.cellColor[3 * i + 1] = 0.5;
        this.cellColor[3 * i + 2] = 0.5;
      } else if (this.cellType[i] == FLUID_CELL) {
        let d = this.particleDensity[i];
        if (this.particleRestDensity > 0.0) d /= this.particleRestDensity;
        this.setSciColor(i, d, 0.0, 2.0);
      }
    }
  }

  simulate(
    dt,
    gravity,
    flipRatio,
    numPressureIters,
    numParticleIters,
    overRelaxation,
    compensateDrift,
    separateParticles,
    obstacleX,
    abstacleY,
    obstacleRadius
  ) {
    const numSubSteps = 1;
    const sdt = dt / numSubSteps;

    for (let step = 0; step < numSubSteps; step++) {
      this.integrateParticles(sdt, gravity);
      if (separateParticles) {
        this.pushParticlesApart(numParticleIters);
      }
      this.handleParticleCollisions(obstacleX, abstacleY, obstacleRadius);
      this.transferVelocities(true);
      this.updateParticleDensity();
      this.solveIncompressibility(numPressureIters, sdt, overRelaxation, compensateDrift);
      this.transferVelocities(false, flipRatio);
    }

    // We are not rendering particles at the moment
    // this.updateParticleColors();
    this.updateCellColors();
  }
}
// ----------------- end of simulator ------------------------------

const scene = {
  gravity: GRAVITY,
  dt: SPEED_BASE,
  flipRatio: 0.9,
  numPressureIters: 30,
  numParticleIters: 2,
  frameNr: 0,
  overRelaxation: 1.9,
  compensateDrift: true,
  separateParticles: true,
  obstacleX: 0.0,
  obstacleY: 0.0,
  obstacleRadius: 0,
  paused: true,
  showObstacle: true,
  obstacleVelX: 0.0,
  obstacleVelY: 0.0,
  fluid: null,
};

function setupScene() {
  const res = RESOLUTION;

  const tankHeight = 1.0 * simHeight;
  const tankWidth = 1.0 * simWidth;
  const h = tankHeight / res;

  const density = 1000.0;

  const relWaterHeight = 0.618;
  const relWaterWidth = 1;

  // dam break

  // compute number of particles

  const r = 0.3 * h; // particle radius w.r.t. cell size
  const dx = 2.0 * r;
  const dy = (Math.sqrt(3.0) / 2.0) * dx;

  const numX = Math.floor((relWaterWidth * tankWidth - 2.0 * h - 2.0 * r) / dx);
  const numY = Math.floor((relWaterHeight * tankHeight - 2.0 * h - 2.0 * r) / dy);
  const maxParticles = numX * numY;

  // create fluid

  f = scene.fluid = new FlipFluid(density, tankWidth, tankHeight, h, r, maxParticles);

  // create particles

  f.numParticles = numX * numY;
  let p = 0;
  for (var i = 0; i < numX; i++) {
    for (var j = 0; j < numY; j++) {
      // Center horizontally by adding offset to x position
      const xOffset = (tankWidth - numX * dx) / 2;
      // Center vertically by adding offset to y position
      const yOffset = (tankHeight - numY * dy) * -0.5;

      f.particlePos[p++] = h + r + dx * i + (j % 2 == 0 ? 0.0 : r) + xOffset;
      f.particlePos[p++] = h + r + dy * j + yOffset;
    }
  }

  // setup grid cells for tank

  const n = f.fNumY;

  for (var i = 0; i < f.fNumX; i++) {
    for (var j = 0; j < f.fNumY; j++) {
      let s = 1.0; // fluid
      if (i == 0 || i == f.fNumX - 1 || j == 0) s = 0.0; // solid
      f.s[i * n + j] = s;
    }
  }
}

function setObstacle(x, y, reset) {
  let vx = 0.0;
  let vy = 0.0;

  if (!reset) {
    vx = (x - scene.obstacleX) / scene.dt;
    vy = (y - scene.obstacleY) / scene.dt;
  }

  scene.obstacleX = x;
  scene.obstacleY = y;
  const r = scene.obstacleRadius;
  const f = scene.fluid;
  const n = f.numY;
  const cd = Math.sqrt(2) * f.h;

  for (let i = 1; i < f.numX - 2; i++) {
    for (let j = 1; j < f.numY - 2; j++) {
      f.s[i * n + j] = 1.0;

      dx = (i + 0.5) * f.h - x;
      dy = (j + 0.5) * f.h - y;

      if (dx * dx + dy * dy < r * r) {
        f.s[i * n + j] = 0.0;
        f.u[i * n + j] = vx;
        f.u[(i + 1) * n + j] = vx;
        f.v[i * n + j] = vy;
        f.v[i * n + j + 1] = vy;
      }
    }
  }

  scene.showObstacle = true;
  scene.obstacleVelX = vx;
  scene.obstacleVelY = vy;
}

// interaction -------------------------------------------------------

let mouseDown = false;

function startDrag(x, y) {
  const bounds = canvasEl.getBoundingClientRect();

  const mx = x - bounds.left - canvasEl.clientLeft;
  const my = y - bounds.top - canvasEl.clientTop;
  mouseDown = true;

  x = mx / cScale;
  y = (canvasEl.height - my) / cScale;

  setObstacle(x, y, true);
  scene.paused = false;
}

function drag(x, y) {
  if (mouseDown) {
    const bounds = canvasEl.getBoundingClientRect();
    const mx = x - bounds.left - canvasEl.clientLeft;
    const my = y - bounds.top - canvasEl.clientTop;
    x = mx / cScale;
    y = (canvasEl.height - my) / cScale;
    setObstacle(x, y, false);
  }
}

function endDrag() {
  mouseDown = false;
  scene.obstacleVelX = 0.0;
  scene.obstacleVelY = 0.0;
}

canvasEl.addEventListener('mousedown', (event) => {
  scene.obstacleRadius = 0.0;
  scene.dt = SPEED_1;
  startDrag(event.x, event.y);
});

canvasEl.addEventListener('mouseup', (event) => {
  scene.dt = SPEED_2;
  endDrag();
});

canvasEl.addEventListener('mousemove', (event) => {
  drag(event.x, event.y);
});

canvasEl.addEventListener('touchstart', (event) => {
  event.preventDefault();
  scene.obstacleRadius = 0.0;
  scene.dt = SPEED_1;
  startDrag(event.touches[0].clientX, event.touches[0].clientY);
});

canvasEl.addEventListener('touchend', (event) => {
  scene.dt = SPEED_2;
  endDrag();
});

canvasEl.addEventListener(
  'touchmove',
  (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    drag(event.touches[0].clientX, event.touches[0].clientY);
  },
  {
    passive: false,
  }
);

document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'p':
      scene.paused = !scene.paused;
      break;
    case 'm':
      scene.paused = false;
      simulate();
      scene.paused = true;
      break;
  }
});

// on window resize, refresh
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    window.location.reload();
  }, 250);
});

// Request device motion permission if available
async function requestDeviceMotion() {
  if (typeof DeviceMotionEvent?.requestPermission === 'function') {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission === 'granted') {
        setupDeviceMotion();
      }
    } catch (err) {
      console.error('Error requesting device motion permission:', err);
    }
  } else {
    setupDeviceMotion();
  }
}

canvasEl.addEventListener('click', requestDeviceMotion, { once: true });
document.addEventListener('touchend', requestDeviceMotion, {
  once: true,
});
function setupDeviceMotion() {
  window.addEventListener('devicemotion', (event) => {
    console.log('Device motion event:', event);
    let x = event.accelerationIncludingGravity.x;
    let y = event.accelerationIncludingGravity.y;

    if (!x && !y) {
      console.warn('No acceleration data available');
      return;
    }

    // Adjust for screen orientation
    if (window.orientation === 90 || window.orientation === -90) {
      // In landscape mode, swap and invert x and y
      const temp = x;
      x = -y;
      y = temp;
    }

    window.gravityVector = {
      x,
      y,
    };

    scene.gravity = 0;
  });
}

function toggleStart() {
  const button = document.getElementById('startButton');
  if (scene.paused) button.innerHTML = 'Stop';
  else button.innerHTML = 'Start';
  scene.paused = !scene.paused;
}

// main -------------------------------------------------------

function simulate() {
  if (!scene.paused)
    scene.fluid.simulate(
      scene.dt,
      scene.gravity,
      scene.flipRatio,
      scene.numPressureIters,
      scene.numParticleIters,
      scene.overRelaxation,
      scene.compensateDrift,
      scene.separateParticles,
      scene.obstacleX,
      scene.obstacleY,
      scene.obstacleRadius,
      scene.colorFieldNr
    );
  scene.frameNr++;
}

const ctx = canvasEl.getContext('2d');

function update() {
  const MAX_RADIUS = window.innerWidth > window.innerHeight ? 0.47 : 0.37;

  scene.obstacleRadius = (scene.obstacleRadius * 3 + MAX_RADIUS) / 4;
  simulate();

  const renderAscii = !scene.paused;
  const renderCanvas = scene.paused ? false : false;

  if (renderAscii) {
    let toRender = '';
    for (let i = f.fNumY - CELL_CROP_Y; i > CELL_CROP_Y; i--) {
      let row = '';
      for (let j = CELL_CROP_X; j < f.fNumX - CELL_CROP_X; j++) {
        const CURRENT_RENDER_CHAR = RENDER_CHARS[Math.floor((i + j + 1) % RENDER_CHARS.length)];

        const RENDER_CHAR_DICTIONARY = CURRENT_RENDER_CHAR.sort((a, b) => a[1] - b[1])
          .map(([char]) => char)
          .join('');

        const cellColor = f.cellColor[3 * (j * f.fNumY + i)];
        row += RENDER_CHAR_DICTIONARY[Math.floor(cellColor * RENDER_CHAR_DICTIONARY.length)];
      }
      toRender += `${row}\n`;
    }
    renderEl.innerHTML = toRender;
  }

  if (renderCanvas) {
    // Use a single ImageData for better performance
    const imageData = ctx.createImageData(realWidth, realHeight);
    const data = imageData.data;

    // Fill black background directly in ImageData
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0; // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 255; // A
    }

    const cellSize = GRID_SIZE;
    const finalSize = cellSize - 2;
    const squarePadding = Math.floor((cellSize - finalSize) / 2);

    for (let i = f.fNumY - CELL_CROP_Y; i > CELL_CROP_Y; i--) {
      for (let j = CELL_CROP_X; j < f.fNumX - CELL_CROP_X; j++) {
        const cellColor = f.cellColor[3 * (j * f.fNumY + i)];
        const intensity = Math.round(cellColor * 255);

        // Calculate pixel positions once
        const startX = j * cellSize - cellSize * CELL_CROP_X;
        const startY = (f.fNumY - i) * cellSize - cellSize * CELL_CROP_Y;
        const width = finalSize - squarePadding;
        const height = finalSize - squarePadding;

        // Fill pixels directly in ImageData
        for (let y = startY; y < startY + height; y++) {
          for (let x = startX; x < startX + width; x++) {
            const index = (y * realWidth + x) * 4;
            data[index] = intensity; // R
            data[index + 1] = intensity; // G
            data[index + 2] = intensity; // B
            data[index + 3] = 255; // A
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  requestAnimationFrame(update);
}

setupScene();
// draw obstacle in the middle
startDrag(window.innerWidth / 2, window.innerHeight * 0.54);
endDrag();
update();
