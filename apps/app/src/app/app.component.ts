import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { UiStateHandlerService } from '@mishqua-dev/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [UiStateHandlerService],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor(uiStateHandlerService: UiStateHandlerService) {
    uiStateHandlerService.initialize();
  }
}
