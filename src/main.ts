import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { PlaidModule } from './plaid/plaid.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(PlaidModule, { applicationProviders: [provideZoneChangeDetection()], })
  .catch(err => console.error(err));
