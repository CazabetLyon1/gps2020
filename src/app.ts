import 'core-js/es/reflect'
import 'core-js/stable/reflect'
import 'core-js/features/reflect'
import 'zone.js/dist/zone'

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { AppModule } from './ts/app.module'

platformBrowserDynamic().bootstrapModule(AppModule)
