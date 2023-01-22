import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TextLayerComponent } from './components/text-layer/text-layer.component';
import { SpanTextDirective } from './directives/span-text.directive';
import { MainPageRoutingModule } from './main-page-routing.module';
import { MainPageComponent } from './main-page.component';

@NgModule({
  declarations: [MainPageComponent, SpanTextDirective, TextLayerComponent],
  imports: [CommonModule, MainPageRoutingModule],
})
export class MainPageModule {}
