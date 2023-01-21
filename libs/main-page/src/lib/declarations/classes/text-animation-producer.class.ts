/**
 * Text distortion animation class.
 * Sorry for any in this file, but Blotter is just js-file without typings.
 */

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const Blotter: any;

export class TextAnimationProducer {
  public canvas: HTMLCanvasElement | undefined = undefined;

  private text: any = undefined;
  private scope: any = undefined;

  constructor(private readonly output: HTMLElement) {
    this.init();
  }

  public init(): void {
    this.text = new Blotter.Text('Hello', {
      size: 120,
      fill: 'white',
      weight: 900,
      paddingLeft: 40,
      paddingRight: 40,
    });

    const material: any = new Blotter.LiquidDistortMaterial();
    material.uniforms.uSpeed.value = 0.25;
    material.uniforms.uVolatility.value = 0.3;

    const blotter: any = new Blotter(material, {
      texts: this.text,
    });

    this.scope = blotter.forText(this.text);

    this.canvas = this.scope.domElement;
    this.scope.appendTo(this.output);
  }

  public update(): void {
    this.text.value = window.innerWidth < window.innerHeight ? 'Hi' : 'Hello';
    this.text.needsUpdate = true;
    this.scope.needsUpdate = true;
  }
}
