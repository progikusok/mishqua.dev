import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateHandlerService } from './services/ui-state-handler.service';

@NgModule({
  imports: [CommonModule],
  providers: [UiStateHandlerService],
})
export class DevCommonModule {}
