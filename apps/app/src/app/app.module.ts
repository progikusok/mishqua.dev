import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DevCommonModule } from '@mishqua-dev/common';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, DevCommonModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
