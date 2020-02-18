import { Component, OnInit } from '@angular/core'
import * as L from 'leaflet'
//import * as M from 'mapbox-gl'

@Component({
  selector: "leaflet-map",
  template: '<div class="map-container"><div class="map-frame"><div id="map"></div></div></div>',
  styles: [
    require("to-string-loader!../scss/map.component.scss").toString(),
  ]
})

export class MapComponent implements OnInit {
  private map

  constructor() {}

  ngOnInit(): void {
    this.initMap()
  }

  private initMap(): void {

    let arr: any = [
      [45.773298, 4.851459],
      [45.774439, 4.852594],
      [45.773973, 4.854197],
    ]

    this.map = L.map('map', {
      center: [ 45.778480529785156, 4.8537468910217285 ],
      zoom: 16,
      zoomControl: false
    })
    //let theme = "mapbox/streets-v10"
    let theme = "amauryg/ck6ru04ol65091ipfzqurfraf"
    let osm = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    let mapbox = `https://api.mapbox.com/styles/v1/${theme}/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW1hdXJ5ZyIsImEiOiJjazZxd3l5cHYwMTdnM21sOXM3Z3MxeWx3In0.VfaiCkcJq4e-UWo5ysP34Q`
    const tiles = L.tileLayer(mapbox, {
      maxZoom: 19,
      detectRetina: true,
      //attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })
    tiles.addTo(this.map)

    /*L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map)*/

    var polyline = L.polyline(arr, {color: 'red'}).addTo(this.map)

    this.map.on('click', (e) => {
      console.log(e)
      arr.push([e.latlng.lat, e.latlng.lng])
      L.polyline(arr, {color: 'red'}).addTo(this.map)
    })

  }

}
