import { NgModule, Type } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPageModule, MainPageResolver } from '@mishqua-dev/main-page';

const routes: Routes = [
  {
    path: '',
    loadChildren: (): Promise<Type<MainPageModule>> =>
      import('@mishqua-dev/main-page').then((module: any) => module.MainPageModule),
    resolve: {
      resolver: MainPageResolver,
    },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      enableTracing: false,
      onSameUrlNavigation: 'reload',
      urlUpdateStrategy: 'deferred',
      initialNavigation: 'enabledNonBlocking',
      scrollPositionRestoration: 'enabled',
      useHash: false,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
