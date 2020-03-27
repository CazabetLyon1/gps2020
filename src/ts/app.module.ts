import { NgModule } from '@angular/core'
import { LeafletModule } from '@asymmetrik/ngx-leaflet'
import { MapComponent } from './map.component'
import { ChartElevationComponent } from './chart.component'
import { ImportComponent } from './import.component'
import { NotificationComponent } from './notification.component'
import { BrowserModule } from '@angular/platform-browser'
import { NgApexchartsModule } from 'ng-apexcharts'

@NgModule({
  bootstrap: [ MapComponent, ChartElevationComponent, ImportComponent, NotificationComponent ],
  imports: [ BrowserModule, LeafletModule.forRoot(), NgApexchartsModule ],
  declarations: [ MapComponent, ChartElevationComponent, ImportComponent, NotificationComponent ],
})

export class AppModule {}
