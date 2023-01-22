import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
/* eslint-disable no-console */

const helloConsoleString: string = `
$$$$$$$$|                                   
$$  _____|                                  
$$ |      $$$$$$$|  $$|  $$$$$$|  $$|   $$| 
$$$$$|    $$  __$$| |__|$$  __$$| $$ |  $$ |
$$  __|   $$ |  $$ |$$| $$ /  $$ |$$ |  $$ |
$$ |      $$ |  $$ |$$ |$$ |  $$ |$$ |  $$ |
$$$$$$$$| $$ |  $$ |$$ ||$$$$$$  ||$$$$$$$ |
|________||__|  |__|$$ | |______/  |____$$ |
              $$|   $$ |          $$|   $$ |
              |$$$$$$  |          |$$$$$$  |
               |______/            |______/ `;

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(() => console.log(helloConsoleString))
  .catch((err: unknown) => console.error(err));
