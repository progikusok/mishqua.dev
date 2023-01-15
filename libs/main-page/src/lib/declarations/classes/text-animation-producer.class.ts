/**
 * Text distortion animation class.
 * Sorry for ant in this file, but Blotter is just js-file without typings.
 */

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const Blotter: any;

export class TextAnimationProducer {
  public canvas: HTMLCanvasElement | undefined = undefined;

  constructor(private readonly output: HTMLElement) {
    this.init();
  }

  private init(): void {
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

    const scope: any = blotter.forText(text);
    scope.needsUpdate = true;

    this.canvas = scope.domElement;
    scope.appendTo(this.output);

    setTimeout(() => {
      text.value = 'Hello';
      scope.needsUpdate = true;
      text.needsUpdate = true;
    }, 5000);
  }
}
