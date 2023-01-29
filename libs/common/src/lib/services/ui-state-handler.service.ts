import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, type OnDestroy } from '@angular/core';
import { isNil } from '@bimeister/utilities';
import { fromEvent, Subscription, startWith, debounceTime } from 'rxjs';

@Injectable()
export class UiStateHandlerService implements OnDestroy {
  private readonly subscription: Subscription = new Subscription();

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  public initialize(): void {
    this.subscription.add(this.handleWindowResizes());
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public frozeBodyScrolling(isSetting: boolean = true): void {
    isSetting ? this.document.body.classList.add('frozen') : this.document.body.classList.remove('frozen');
  }

  public darkenBody(isSetting: boolean = true): void {
    isSetting ? this.document.body.classList.add('darken') : this.document.body.classList.add('darken');
  }

  private handleWindowResizes(): Subscription {
    return fromEvent(window, 'resize')
      .pipe(startWith(undefined), debounceTime(500))
      .subscribe(() => this.setCalculatedVhSize(window.innerHeight));
  }

  private setCalculatedVhSize(windowHeight: number): void {
    if (isNil(windowHeight)) {
      return;
    }

    const vh: number = windowHeight * 0.01;
    this.document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
}
