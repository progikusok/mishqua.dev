import { Directive, ElementRef, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { isEmpty, isNil } from '@bimeister/utilities';

@Directive({
  selector: '[commandText]',
  standalone: true,
})
export class CommandTextDirective {
  constructor(private readonly hostElement: ElementRef<HTMLElement>, private readonly sanitizer: DomSanitizer) {
    requestAnimationFrame(this.wrapText.bind(this));
  }

  private wrapText(): void {
    const textContent: string = this.hostElement.nativeElement.textContent?.trim() ?? '';
    if (isEmpty(textContent)) {
      return;
    }

    const userName: string = Telegram?.WebApp?.initDataUnsafe?.user?.first_name ?? '';

    const readyHtml: string | null = this.sanitizer.sanitize(SecurityContext.HTML, `${textContent}&nbsp;${userName}`);

    if (isNil(readyHtml)) {
      return;
    }

    this.hostElement.nativeElement.innerHTML = readyHtml;
    this.hostElement.nativeElement.style.setProperty('--text-len', `${textContent.length + userName.length + 1}`);
  }
}
