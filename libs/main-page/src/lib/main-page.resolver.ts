import { Injectable } from '@angular/core';
import type { Resolve } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import * as WebFont from 'webfontloader';

@Injectable({ providedIn: 'root' })
export class MainPageResolver implements Resolve<void> {
  private readonly resolver$: Subject<void> = new Subject<void>();

  public resolve(): Observable<void> | Promise<void> {
    WebFont.load({
      google: {
        families: ['Ubuntu Mono'],
      },
      active: () => this.resolver$.next(),
    });
    return this.resolver$;
  }
}
