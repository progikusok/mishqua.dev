import { Directive, ElementRef, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { isEmpty, isNil } from '@bimeister/utilities';

@Directive({
  selector: '[spanText]',
  standalone: true,
})
export class SpanTextDirective {
  constructor(private readonly hostElement: ElementRef<HTMLElement>, private readonly sanitizer: DomSanitizer) {
    this.setOpacity(0);
    requestAnimationFrame(this.wrapText.bind(this));
  }

  private setOpacity(opacity: number = 0): void {
    this.hostElement.nativeElement.style.opacity = `${opacity}`;
  }

  private wrapText(): void {
    const textContent: string = this.hostElement.nativeElement.textContent?.trim() ?? '';
    if (isEmpty(textContent)) {
      return;
    }

    const spaceSpan: string = `<span class="space"></span>`;

    const words: string[] = textContent.split(' ');
    const readyHtmlSpansString: string = words
      .map(
        (word: string, index: number) =>
          `<span class="word">${word}</span>${index === words.length - 1 ? '' : spaceSpan}`
      )
      .join('');

    const readyHtmlSpans: string | null = this.sanitizer.sanitize(SecurityContext.HTML, readyHtmlSpansString);

    if (isNil(readyHtmlSpans)) {
      return;
    }

    this.hostElement.nativeElement.innerHTML = readyHtmlSpans;

    this.setOpacity(1);
  }
}
