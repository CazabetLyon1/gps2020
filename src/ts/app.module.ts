import { NgModule } from '@angular/core'
import { LeafletModule } from '@asymmetrik/ngx-leaflet'
import { MapComponent } from './map.component'
import { BrowserModule } from '@angular/platform-browser'

@NgModule({
  bootstrap: [ MapComponent ],
  imports: [ BrowserModule, LeafletModule.forRoot() ],
  declarations: [ MapComponent ],
})

export class AppModule {}
