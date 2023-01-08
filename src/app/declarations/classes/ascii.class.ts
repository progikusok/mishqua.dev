interface Char {
  width: number;
  height: number;
  aspect: number;
}

const ASCII_STRING = ' .,·-•─~+:;=*π’“”!?#$@aàbcdefghijklmnoòpqrstuüvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ│0123456789%. '
  .split('')
  .reverse()
  .join('');

function mapRange(value: number, low1: number, high1: number, low2: number, high2: number) {
  return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}

export class ASCIIClass {
  private time = 0;

  /* mouse coordinates */
  private x = 10;
  private y = 10;
  private px = this.x;
  private py = this.y;

  private char: Char = { width: 0, height: 0, aspect: 1 };
  private rows = 0;
  private cols = 0;
  private radius = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private state: number[][] = [];
  private S = {
    list: Array.from(ASCII_STRING),
    map: new Map(Array.from(ASCII_STRING).map((item, index) => [item, index])),
    length: ASCII_STRING.length,
  };
  private zero = this.S.map.get(')');
  private space = this.S.map.get(' ');

  /** canvas */
  private scaledCanvas!: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(private readonly output: HTMLElement, private readonly canvas: HTMLCanvasElement | undefined) {
    this.calculateSizes();
    this.initializeEmptyState();
    this.bindMouse();
    this.initCanvas();

    this.update();
  }

  private calculateSizes(): void {
    const measureDiv = document.createElement('div');
    measureDiv.style.cssText = 'position:absolute;top:0;display:block;white-space:pre;opacity:0';
    measureDiv.innerHTML = 'X'.repeat(100);
    measureDiv.innerHTML += 'X\n'.repeat(99);

    document.body.appendChild(measureDiv);

    const w = measureDiv.offsetWidth / 101;
    const h = measureDiv.offsetHeight / 100;

    this.char = { width: w, height: h, aspect: w / h };

    this.rows = Math.ceil(this.output.offsetHeight / h);
    this.cols = Math.ceil(this.output.offsetWidth / w);

    document.body.removeChild(measureDiv);

    for (let i = 0; i < this.rows; i++) {
      const span: HTMLElement = document.createElement('span');
      span.style.cssText = 'display:block;';

      this.output.appendChild(span);

      this.state.push(new Array(this.cols).fill(' '));
    }
  }

  private draw(): void {
    // draw state
    for (let i = 0; i < this.rows; ++i) {
      const row = this.output.children[i];
      let res = '';

      for (let j = 0; j < this.cols; ++j) {
        const k = this.state[i][j];
        res += this.S.list[k] ?? '';
      }

      if (row.innerHTML !== res) {
        row.innerHTML = res;
      }
    }

    // calm down
    for (let i = 0; i < this.rows; ++i) {
      for (let j = 0; j < this.cols; ++j) {
        if (this.state[i][j] === this.space) {
          continue;
        }

        if (this.state[i][j] < this.S.length - 1) {
          this.state[i][j] = ++this.state[i][j] % this.S.length;
        }
      }
    }
  }

  private bindMouse(): void {
    document.addEventListener('pointermove', (e) => {
      this.x = e.clientX;
      this.y = e.clientY;
    });
  }

  private calculate() {
    const x = Math.floor(this.x / this.char.width);
    const y = Math.floor(this.y / this.char.height);

    const distance = Math.sqrt(Math.pow(this.px - this.x, 2) + Math.pow(this.py - this.y, 2));
    this.radius += 0.05 * (distance - this.radius);
    this.radius = Math.max(this.radius, 0);

    for (let i = 0; i < this.rows; ++i) {
      for (let j = 0; j < this.cols; ++j) {
        const dist = Math.sqrt((x - j) * (x - j) + ((y - i) * (y - i)) / this.char.aspect / this.char.aspect);
        if (dist < this.radius && dist !== 0) {
          if ((i + j) % 2) {
            this.state[i][j] = 1;
          }
        }
      }
    }

    this.px = this.x;
    this.py = this.y;
  }

  private initCanvas() {
    if (this.canvas === undefined) {
      return;
    }

    this.scaledCanvas = document.createElement('canvas');
    this.scaledCanvas.width = this.cols;
    this.scaledCanvas.height = this.rows;

    this.ctx = this.scaledCanvas.getContext('2d');

    // const c = this.canvas;
    // setTimeout(() => {
    //   // c.width = this.cols;
    //   // c.height = this.rows;
    //   c.style.cssText = `width:${this.cols}px;height:${this.rows}px;`;
    //   this.ctx = c.getContext('2d');
    // }, 1000);

    // console.log('>>>', this.cols, this.rows, this.canvas);

    // document.body.appendChild(this.scaledCanvas);
  }

  private drawCanvas() {
    if (this.canvas === undefined) {
      return;
    }

    // const shiftCordsX = Math.floor(this.cols / 8) + 45 * Math.sin(this.time / 50);
    // const shiftCordsY = Math.floor(this.rows / 6) + 35 * Math.cos(this.time / 60);

    // this.ctx.fillStyle = '#000000';
    // this.ctx.fillRect(0, 0, this.cols, this.rows);
    // this.ctx.fillStyle = '#ffffff';
    // this.ctx.fillRect(0 + shiftCordsX, 0 + shiftCordsY, 20 + shiftCordsX, 10 + shiftCordsY);

    this.ctx = this.scaledCanvas.getContext('2d');

    if (this.ctx === null) {
      return;
    }

    if (this.canvas.width === 0 || this.canvas.height === 0) {
      return;
    }

    this.ctx.clearRect(0, 0, this.cols, this.rows);

    this.ctx.drawImage(
      this.canvas,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      0,
      0,
      this.scaledCanvas.width,
      this.scaledCanvas.height
    );
    const data = this.ctx.getImageData(0, 0, this.cols, this.rows).data;

    for (let i = 0; i < this.rows; ++i) {
      for (let j = 0; j < this.cols; ++j) {
        const k = 4 * (i * this.cols + j);
        // const symbol = Math.floor(mapRange(data[k], 0, 255, 0, this.S.length - 2));

        if ((i + j + 1) % 2) {
          if (data[k] === 255) {
            this.state[i][j] = 1;
          }
        }
      }
    }
  }

  private initializeEmptyState(): void {
    for (let i = 0; i < this.rows; ++i) {
      for (let j = 0; j < this.cols; ++j) {
        this.state[i][j] = this.space ?? 1;
      }
    }
  }

  private update(): void {
    this.time++;
    this.draw();
    this.drawCanvas();

    this.calculate();

    requestAnimationFrame(this.update.bind(this));
  }
}
