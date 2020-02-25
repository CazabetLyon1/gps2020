import { NgModule } from '@angular/core'
import { LeafletModule } from '@asymmetrik/ngx-leaflet'
import { MapComponent } from './map.component'
import { ChartElevationComponent } from './chart.component'
import { BrowserModule } from '@angular/platform-browser'
import { NgApexchartsModule } from 'ng-apexcharts'

@NgModule({
  bootstrap: [ MapComponent, ChartElevationComponent ],
  imports: [ BrowserModule, LeafletModule.forRoot(), NgApexchartsModule ],
  declarations: [ MapComponent, ChartElevationComponent ],
})

export class AppModule {}
