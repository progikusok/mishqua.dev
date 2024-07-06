import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Nullable, isEmpty, isNil } from '@bimeister/utilities';
import { UiStateHandlerService } from '@mishqua-dev/common';
import { BehaviorSubject, Subscription, animationFrames, fromEvent, merge, timer } from 'rxjs';
import { debounceTime, filter, map, startWith, switchMap, take, tap } from 'rxjs/operators';
import { TextAnimationProducer } from './declarations/classes/text-animation-producer.class';
import { ASCII_PLENTY } from './declarations/constants/ascii-plenty.const';
import type { AsciiPlentyData } from './declarations/interfaces/ascii-plenty-data.interface';
import type { GridMetadata } from './declarations/interfaces/grid-metadata.interface';
import type { PointerState } from './declarations/interfaces/pointer-state.interface';
import { TextLayerComponent } from './components/text-layer/text-layer.component';

const INIT_ANIMATION_DELAY_MS: number = 2000;
const INIT_TEXT_DISTORTION_DELAY_MS: number = 1000;

const WINDOW_RESIZE_DEBOUNCE_TIME_MS: number = 500;

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TextLayerComponent],
})
export class MainPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('outputRef', { static: true }) private readonly outputRef!: ElementRef<HTMLElement>;
  @ViewChild('canvasWrapperRef', { static: true }) private readonly canvasWrapperRef!: ElementRef<HTMLElement>;

  public readonly technologies: string[] = ['angular', 'vue', 'nuxt', 'sass', 'three.js', 'glsl'];

  private readonly pointer: PointerState = {
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    radius: 0,
  };
  private readonly gridMetadata$: BehaviorSubject<Nullable<GridMetadata>> = new BehaviorSubject<Nullable<GridMetadata>>(
    null
  );

  private state: number[][] = [];
  private readonly asciiPlentyData: AsciiPlentyData = {
    list: Array.from(ASCII_PLENTY),
    charToIndexMap: new Map(Array.from(ASCII_PLENTY).map((item: string, index: number) => [item, index])),
    length: ASCII_PLENTY.length,
  };

  private rendererCanvas: HTMLCanvasElement | undefined = undefined;
  private rendererCanvasContext: CanvasRenderingContext2D | null = null;
  private textDistortionCanvas: HTMLCanvasElement | undefined = undefined;

  private textAnimationProducer: TextAnimationProducer | undefined = undefined;

  private readonly isReady$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly subscription: Subscription = new Subscription();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly hostElement: ElementRef<HTMLElement>,
    private readonly uiStateHandlerService: UiStateHandlerService
  ) {
    /** To perform animations we need detach Angular  checks */
    this.changeDetectorRef.detach();

    this.uiStateHandlerService.frozeBodyScrolling();
    this.uiStateHandlerService.darkenBody();
  }

  public ngAfterViewInit(): void {
    this.subscription.add(this.subscribeOnWindowSizeChanges());

    this.isReady$
      .pipe(
        filter((value: boolean) => value),
        take(1),
        switchMap(() => timer(INIT_ANIMATION_DELAY_MS))
      )
      .subscribe(() => {
        this.initTextDistortionCanvas();

        this.subscription.add(this.produceRequestAnimationFrame());
        this.subscription.add(this.subscribeOnPointerMoveChanges());
      });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();

    this.uiStateHandlerService.frozeBodyScrolling(false);
    this.uiStateHandlerService.darkenBody(false);
  }

  private clearGridState(): void {
    const output: HTMLElement = this.outputRef.nativeElement;
    output.replaceChildren();
    this.gridMetadata$.next(null);
    this.state = [];
  }

  private initGridState(): void {
    /**
     * We need to render 'X' symbol horizontally and vertically to calculate rows and cols.
     * After calculations we remove this metadata from DOM.
     * After that we need to set empty spans to output element.
     * Every row is empty span with cols number of spaces.
     */

    const countOfSymbols: number = 100;

    const measureDiv: HTMLDivElement = this.document.createElement('div');
    measureDiv.style.cssText = 'position:absolute;top:0;display:block;white-space:pre;opacity:0;';
    measureDiv.innerHTML = 'X'.repeat(countOfSymbols);
    measureDiv.innerHTML += 'X\n'.repeat(countOfSymbols);

    const output: HTMLElement = this.outputRef.nativeElement;

    output.appendChild(measureDiv);

    const cellWidth: number = measureDiv.offsetWidth / (countOfSymbols + 1);
    const cellHeight: number = measureDiv.offsetHeight / (countOfSymbols + 1);

    this.hostElement.nativeElement.style.setProperty('--cell-width', `${cellWidth}px`);
    this.hostElement.nativeElement.style.setProperty('--cell-height', `${cellHeight}px`);

    this.hostElement.nativeElement.classList.add('ready');
    this.isReady$.next(true);

    output.removeChild(measureDiv);

    const gridMetadata: GridMetadata = {
      rows: Math.ceil(output.offsetHeight / cellHeight),
      cols: Math.ceil(output.offsetWidth / cellWidth),
      cell: {
        width: cellWidth,
        height: cellHeight,
        aspect: cellWidth / cellHeight,
      },
    };

    this.gridMetadata$.next(gridMetadata);

    new Array(gridMetadata.rows).fill(undefined).forEach(() => {
      const span: HTMLElement = document.createElement('span');
      span.style.cssText = 'display:block;';

      output.appendChild(span);

      const space: number | undefined = this.asciiPlentyData.charToIndexMap.get(' ');
      this.state.push(new Array(gridMetadata.cols).fill(space));
    });
  }

  private initTextDistortionCanvas(): void {
    timer(INIT_TEXT_DISTORTION_DELAY_MS)
      .pipe(
        switchMap(() => this.gridMetadata$),
        filter((data: Nullable<GridMetadata>): data is GridMetadata => !isNil(data)),
        take(1)
      )
      .subscribe(({ rows, cols }: GridMetadata) => {
        this.textAnimationProducer = new TextAnimationProducer(this.canvasWrapperRef.nativeElement);
        this.textDistortionCanvas = this.textAnimationProducer.canvas;

        this.rendererCanvas = document.createElement('canvas');
        this.rendererCanvas.width = cols;
        this.rendererCanvas.height = rows;

        this.rendererCanvasContext = this.rendererCanvas.getContext('2d', { willReadFrequently: true });
      });
  }

  private updateTextDistortionAnimation(): void {
    this.gridMetadata$
      .pipe(
        filter((data: Nullable<GridMetadata>): data is GridMetadata => !isNil(data)),
        take(1)
      )
      .subscribe(({ rows, cols }: GridMetadata) => {
        if (isNil(this.textAnimationProducer) || isNil(this.rendererCanvas)) {
          return;
        }
        this.rendererCanvas.width = cols;
        this.rendererCanvas.height = rows;

        this.rendererCanvasContext = this.rendererCanvas.getContext('2d', { willReadFrequently: true });

        this.textAnimationProducer?.update();
      });
  }

  private updateDefaultPointerState(): void {
    this.pointer.radius = 1000;
    this.pointer.x = this.pointer.previousX = window.innerWidth / 2;
    this.pointer.y = this.pointer.previousY = window.innerHeight / 2;
  }

  private render({ rows, cols }: GridMetadata): void {
    if (isEmpty(this.state)) {
      return;
    }

    /* draw state */
    for (let i: number = 0; i < rows; ++i) {
      const row: Element = this.outputRef.nativeElement.children[i];
      let result: string = '';

      for (let j: number = 0; j < cols; ++j) {
        const k: number = this.state[i][j];
        result += this.asciiPlentyData.list[k] ?? '';
      }

      if (row.innerHTML !== result) {
        row.innerHTML = result;
      }
    }

    /* calm down state */
    for (let i: number = 0; i < rows; ++i) {
      for (let j: number = 0; j < cols; ++j) {
        if (this.state[i][j] === this.asciiPlentyData.charToIndexMap.get(' ')) {
          continue;
        }

        if (this.state[i][j] < this.asciiPlentyData.length - 1) {
          this.state[i][j] = ++this.state[i][j] % this.asciiPlentyData.length;
        }
      }
    }
  }

  private renderTextDistortion({ rows, cols }: GridMetadata): void {
    if (isEmpty(this.state)) {
      return;
    }

    if (isNil(this.rendererCanvasContext) || isNil(this.rendererCanvas) || isNil(this.textDistortionCanvas)) {
      return;
    }

    if (
      this.rendererCanvas.width === 0 ||
      this.rendererCanvas.height === 0 ||
      this.textDistortionCanvas.width === 0 ||
      this.textDistortionCanvas.height === 0
    ) {
      return;
    }

    this.rendererCanvasContext.clearRect(0, 0, cols, rows);

    this.rendererCanvasContext.drawImage(
      this.textDistortionCanvas,
      0,
      0,
      this.textDistortionCanvas.width,
      this.textDistortionCanvas.height,
      0,
      0,
      this.rendererCanvas.width,
      this.rendererCanvas.height
    );
    const data: Uint8ClampedArray = this.rendererCanvasContext.getImageData(0, 0, cols, rows).data;

    for (let i: number = 0; i < rows; ++i) {
      for (let j: number = 0; j < cols; ++j) {
        const k: number = 4 * (i * cols + j);

        if ((i + j) % 2 === 1 && data[k] === 255) {
          this.state[i][j] = this.asciiPlentyData.charToIndexMap.get('.') ?? 1;
        }
      }
    }
  }

  private calculatePointerAnimation({ cell, rows, cols }: GridMetadata): void {
    if (isEmpty(this.state)) {
      return;
    }

    const { x, y, previousX, previousY }: PointerState = this.pointer;

    const gridX: number = Math.floor(this.pointer.x / cell.width);
    const gridY: number = Math.floor(this.pointer.y / cell.height);

    const distance: number = Math.sqrt(Math.pow(previousX - x, 2) + Math.pow(previousY - y, 2));
    this.pointer.radius += 0.05 * (distance - this.pointer.radius);
    this.pointer.radius = Math.max(this.pointer.radius, 0);

    for (let i: number = 0; i < rows; ++i) {
      for (let j: number = 0; j < cols; ++j) {
        const dist: number = Math.sqrt(
          (gridX - j) * (gridX - j) + ((gridY - i) * (gridY - i)) / cell.aspect / cell.aspect
        );
        if (dist < this.pointer.radius && dist !== 0) {
          if ((i + j + 1) % 2 === 1) {
            this.state[i][j] = this.asciiPlentyData.charToIndexMap.get('.') ?? 1;
          }
        }
      }
    }
    this.pointer.previousX = x;
    this.pointer.previousY = y;
  }

  private subscribeOnPointerMoveChanges(): Subscription {
    return merge(
      fromEvent<PointerEvent>(this.document, 'pointermove'),
      fromEvent<TouchEvent>(this.document, 'touchmove').pipe(map((event: TouchEvent) => event.touches[0]))
    ).subscribe((event: PointerEvent | Touch) => {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
    });
  }

  private produceRequestAnimationFrame(): Subscription {
    return this.gridMetadata$
      .pipe(
        filter((data: Nullable<GridMetadata>): data is GridMetadata => !isNil(data)),
        switchMap((gridMetadata: GridMetadata) => animationFrames().pipe(map(() => gridMetadata)))
      )
      .subscribe((gridMetadata: GridMetadata) => {
        this.render(gridMetadata);
        this.renderTextDistortion(gridMetadata);
        this.calculatePointerAnimation(gridMetadata);
      });
  }

  private subscribeOnWindowSizeChanges(): Subscription {
    return fromEvent(window, 'resize')
      .pipe(
        startWith(undefined),
        tap(() => this.clearGridState()),
        debounceTime(WINDOW_RESIZE_DEBOUNCE_TIME_MS)
      )
      .subscribe(() => {
        this.initGridState();
        this.updateTextDistortionAnimation();
        this.updateDefaultPointerState();
      });
  }
}
