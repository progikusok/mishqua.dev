import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SpanTextDirective } from './directives/span-text.directive';
import { MainPageRoutingModule } from './main-page-routing.module';
import { MainPageComponent } from './main-page.component';

@NgModule({
  declarations: [MainPageComponent, SpanTextDirective],
  imports: [CommonModule, MainPageRoutingModule],
})
export class MainPageModule {}
