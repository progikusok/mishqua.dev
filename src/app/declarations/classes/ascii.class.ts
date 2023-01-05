interface Char {
  width: number;
  height: number;
  aspect: number;
}

const ASCII_STRING = ' .,·-•─~+:;=*π’“”!?#$@aàbcdefghijklmnoòpqrstuüvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ│0123456789%() '
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
  private state: any[] = [];
  private S = {
    list: Array.from(ASCII_STRING),
    map: new Map(Array.from(ASCII_STRING).map((item, index) => [item, index])),
    length: ASCII_STRING.length,
  };
  private zero = this.S.map.get('0');

  /** canvas */
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D | null;

  constructor(private readonly output: HTMLElement) {
    this.calculateSizes();
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

    console.log(this);
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
        if (dist < this.radius) {
          if ((i + j) % 2) {
            this.state[i][j] = this.zero;
          }
        }
      }
    }

    this.px = this.x;
    this.py = this.y;
  }

  private initCanvas() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.cols;
    this.canvas.height = this.rows;

    document.body.appendChild(this.canvas);
  }

  private drawCanvas() {
    if (this.ctx === null) {
      return;
    }

    const shiftCordsX = Math.floor(this.cols / 4) + 10 * Math.sin(this.time / 50);
    const shiftCordsY = Math.floor(this.rows / 4) + 10 * Math.cos(this.time / 50);

    this.ctx.clearRect(0, 0, this.cols, this.rows);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.cols, this.rows);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0 + shiftCordsX, 0 + shiftCordsY, 16 + shiftCordsX, 8 + shiftCordsY);

    const data = this.ctx.getImageData(0, 0, this.cols, this.rows).data;
    console.log(data);

    for (let i = 0; i < this.rows; ++i) {
      for (let j = 0; j < this.cols; ++j) {
        const k = 4 * (i * this.cols + j);
        const symbol = Math.floor(mapRange(data[k], 0, 255, 0, this.S.length - 2));

        if ((i + j + 1) % 2) {
          this.state[i][j] = symbol;
        }
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
