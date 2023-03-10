import { AfterViewInit, Directive, ElementRef, HostBinding, Input, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { isEmpty, isNil } from '@bimeister/utilities';

@Directive({
  selector: '[spanText]',
})
export class SpanTextDirective implements AfterViewInit {
  @Input() public spanText: any;

  @HostBinding('innerHtml')
  public content: string | null | undefined;

  constructor(private readonly hostElement: ElementRef<HTMLElement>, private readonly sanitizer: DomSanitizer) {
    this.setOpacity(0);
    requestAnimationFrame(this.wrapText.bind(this));
  }

  public ngAfterViewInit(): void {
    this.wrapText();
  }

  private setOpacity(opacity: number = 0): void {
    this.hostElement.nativeElement.style.opacity = `${opacity}`;
  }

  private wrapText(): void {
    const textContent: string = this.hostElement.nativeElement.textContent?.trim() ?? '';
    if (isEmpty(textContent)) {
      return;
    }

    const spaceSpan: string = `<span class="space">&nbsp;</span>`;

    const words: string[] = textContent.split(' ');
    const readyHtmlSpansString: string = words
      .map((word: string) => `<span class="word">${word}</span>${spaceSpan}`)
      .join('');

    const readyHtmlSpans: string | null = this.sanitizer.sanitize(SecurityContext.HTML, readyHtmlSpansString);

    if (isNil(readyHtmlSpans)) {
      return;
    }

    this.hostElement.nativeElement.innerHTML = readyHtmlSpans;

    this.setOpacity(1);
  }
}
