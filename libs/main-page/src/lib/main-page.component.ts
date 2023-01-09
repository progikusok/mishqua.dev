import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ASCIIClass } from './declarations/classes/ascii.class';

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const Blotter: any;

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent implements AfterViewInit {
  @ViewChild('outputRef', { static: true }) private readonly outputRef!: ElementRef<HTMLElement>;
  @ViewChild('canvasWrapperRef', { static: true }) private readonly canvasWrapperRef!: ElementRef<HTMLElement>;

  private canvas: HTMLCanvasElement | undefined = undefined;

  public ngAfterViewInit(): void {
    this.initializeCanvasTextAnimation();
    this.init();
  }

  private initializeCanvasTextAnimation(): void {
    // BLOTTER - Example 2
    const text: any = new Blotter.Text('Привет', {
      size: 120,
      fill: 'white',
      weight: 900,
      paddingLeft: 40,
      paddingRight: 40,
    });

    const material: any = new Blotter.LiquidDistortMaterial();
    material.needsUpdate = true;

    // Play with the value for uSpeed. Lower values slow
    // down animation, while higher values speed it up. At
    // a speed of 0.0, animation is stopped entirely.
    material.uniforms.uSpeed.value = 0.25;

    // Try uncommenting the following line to play with
    // the "volatility" of the effect. Higher values here will
    // produce more dramatic changes in the appearance of your
    // text as it animates, but you will likely want to keep
    // the value below 1.0.
    material.uniforms.uVolatility.value = 0.3;

    const blotter: any = new Blotter(material, {
      texts: text,
      needsUpdate: true,
    });

    blotter.needsUpdate = true;

    const elem: HTMLElement = this.canvasWrapperRef.nativeElement;

    const scope: any = blotter.forText(text);
    scope.needsUpdate = true;

    this.canvas = scope.domElement;

    scope.appendTo(elem);

    setTimeout(() => {
      text.value = 'Hello';
      scope.needsUpdate = true;
      text.needsUpdate = true;
    }, 5000);
  }

  private init(): void {
    const outputElement: HTMLElement = this.outputRef.nativeElement;
    new ASCIIClass(outputElement, this.canvas);
  }
}
