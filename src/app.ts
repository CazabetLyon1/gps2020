import 'core-js/es/reflect'
import 'core-js/stable/reflect'
import 'core-js/features/reflect'
import 'zone.js/dist/zone'

import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { AppModule } from './ts/app.module'

enableProdMode()
platformBrowserDynamic().bootstrapModule(AppModule)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
    .register('/service-worker.js')
    .then(registration => {
      console.log('SW registered: ', registration);
    })
    .catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    })
  })
}
