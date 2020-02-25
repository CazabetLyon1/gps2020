import { Component, OnInit } from '@angular/core'
import PouchDB from 'pouchdb'
import * as L from 'leaflet'
import 'leaflet.tilelayer.pouchdbcached'
import 'leaflet-geometryutil'
import * as turf from '@turf/turf'
//import * as turff from '@turf/helpers'
//import * as M from 'mapbox-gl'

declare global {
  interface Window {
    PouchDB: any
  }
}
window.PouchDB = PouchDB

@Component({
  selector: "leaflet-map",
  template: '<div class="map-container"><div class="map-frame"><div id="map"></div></div></div>',
  styles: [
    require("to-string-loader!../scss/map.component.scss").toString(),
  ]
})

export class MapComponent implements OnInit {

  private map
  private token: string = "pk.eyJ1IjoiYW1hdXJ5ZyIsImEiOiJjazZxd3l5cHYwMTdnM21sOXM3Z3MxeWx3In0.VfaiCkcJq4e-UWo5ysP34Q"
  private coordinates: any = []
  private polyline
  private circles: any = []
  private bool: boolean = true
  private drag: boolean = false
  private num: number = null
  private cursor
  private lasso
  private preview = null
  private toAdd

  constructor() {}

  ngOnInit(): void {
    this.initMap()
  }

  private toolID = (): number => {
    return Array.from(document.querySelectorAll("input[name='tools']"))
      .findIndex(x => (x as HTMLInputElement).checked)
  }

  private distance = (lat1, lng1, lat2, lng2): any => {
  	if (lat1 == lat2 && lng1 == lng2) return 0
  	let radlat1 = Math.PI * lat1/180
  	let radlat2 = Math.PI * lat2/180
  	let theta = lng1-lng2
  	let radtheta = Math.PI * theta/180
  	let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
  	if (dist > 1) dist = 1
  	dist = Math.acos(dist)
  	dist = dist * 180/Math.PI
  	dist = dist * 60 * 1.1515
  	dist = dist * 1.609344
  	return dist
  }

  private zoom = (e): void => {
    if (this.toolID() === 0) {
      this.map.setView(e.latlng)
      //this.map.zoomIn()
    }
  }

  private draw = (): void => {
    this.circles.forEach(layer => {
      this.map.removeLayer(layer)
    })
    this.circles = []
    if(this.polyline) this.map.removeLayer(this.polyline)
    this.polyline = L.polyline(this.coordinates, {weight: 3, color: '#3379FF'}).addTo(this.map)
    this.polyline.on('mousedown', (e) => {
      this.bool = false
      let i = e.target.getLatLngs().findIndex((x,i,t) => L.GeometryUtil.belongsSegment(e.latlng, t[i], t[i+1]))
      this.addToIndex(e, i+1)
      this.drag = true
      this.num = i+1
    })
    this.coordinates.forEach(coord => {
      this.addMarker({
        latlng: {
          lat: coord[0],
          lng: coord[1]
        }
      })
      /*this.circles.push(L.circle(coord, {radius: 10, fillColor: '#34616C', fillOpacity:1, stroke: false})
        .addTo(this.map)
        .on('mousedown', (e) => {
          this.bool = false
          this.drag = true
          this.num = this.coordinates.findIndex(x => x[0] === (e as L.LeafletMouseEvent).latlng.lat && x[1] === (e as L.LeafletMouseEvent).latlng.lng)
        })
        .on('mouseover', (e) => {
          console.log(e.target)
          e.target.setStyle({
            radius: 200,
          })
        }))*/
    })
  }

  private select = (e): void => {
    if(this.toolID() === 4 && this.drag) {
      if(!this.lasso) this.lasso = L.polygon([], {
        smoothFactor: 3,
        weight: 2,
        color: '#3E3E3E',
        fillColor: '#0076FF',
        dashArray : '15 15',
        dashOffset: '0'
      }).addTo(this.map)
      this.lasso.addLatLng([e.latlng.lat, e.latlng.lng])

      let line1 = turf.lineString(this.coordinates as turf.Position[])
      let c = this.lasso._latlngs[0].map(x => [x.lat, x.lng]) as turf.Position[]
      c.push(c[0])
      let line2 = turf.lineString(c as turf.Position[])
      /*if(c.length > 10) {
        var b = turf.polygon([c])
        //console.log(b)
      }*/
      let r = turf.lineIntersect(line1, line2)
      //if(this.preview) this.map.removeLayer(this.preview)
      //this.preview = L.polyline(r.features.map(x => x.geometry.coordinates as L.LatLngExpression), {weight: 3, color: '#3379FF'}).addTo(this.map)
      //this.toAdd = r.features.map(x => x.geometry.coordinates as L.LatLngExpression)
      this.toAdd = r.features.map(x => new L.LatLng(x.geometry.coordinates[0], x.geometry.coordinates[1]))
      //console.log(r)
    }
  }

  private move = (e): void => {
    if (this.toolID() === 0) {
      document.getElementById("lat").textContent = e.latlng.lat
      document.getElementById("lng").textContent = e.latlng.lng
    }
    if(this.drag) {
      let c = this.coordinates.slice(0)
      c.splice(this.num, 1)
      let near = c.find(coord => {
        return this.distance(e.latlng.lat, e.latlng.lng, coord[0], coord[1]) < 0.05
      }) || null
      /*c.forEach(coord => {
        console.log(this.distance(e.latlng.lat, e.latlng.lng, coord[0], coord[1]))
      })*/
      this.map.dragging.disable()
      this.coordinates[this.num] = near || [e.latlng.lat, e.latlng.lng]
      this.draw()
    }
  }

  private getElevation = (e): any => {
    let xhr = new XMLHttpRequest()
    let url = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${e.latlng.lat},${e.latlng.lng}.json?layers=contour&limit=50&access_token=${this.token}`
    xhr.open("GET", url, true)
    xhr.responseType = "json"
    xhr.onload = (data) => {
      console.log('data:')
      console.log(data)
    }
    xhr.send()
  }

  private addMarker = (e): void => {
    //this.getElevation(e)
    //this.circles.push(L.circle(Array.isArray(e) ? (e as L.LatLngExpression) : [e.latlng.lat, e.latlng.lng],
    this.circles.push(L.circle([e.latlng.lat, e.latlng.lng],
      {
        radius: 10,
        fillColor: '#34616C',
        fillOpacity:1,
        //stroke: false
        stroke: true,
        color: 'white',
        weight: 3
      })
      .addTo(this.map)
      .on('mouseover', (e) => {
        //console.log('jhkjh')
        //document.body.style.cursor = "wait"
        //L.DomUtil.addClass(this.map._container,'move-cursor-enabled');
      })
      .on('mousedown', (e) => {
        this.bool = false
        this.drag = true
        this.num = this.coordinates.findIndex(x => x[0] === (e as L.LeafletMouseEvent).latlng.lat && x[1] === (e as L.LeafletMouseEvent).latlng.lng)
      })
      .on('mouseup', (e) => {
        //console.log('khk')
      })
      .on('mouseover', (e) => {
        //console.log(e.target)
        e.target.setStyle({
          radius: 200,
        })
      }))
      //this.circles[this.circles.length-1].setZIndex(this.circles.length)
      //this.circles[this.circles.length-1].bringToFront()
  }

  private addShortcut = (): void => {
    this.toAdd.forEach((point, i) => {
      let idx = this.coordinates.findIndex((x,i,t) => L.GeometryUtil.belongsSegment(point, new L.LatLng(t[i][0], t[i][1]), new L.LatLng(t[i+1][0], t[i+1][1])))
      if(i === 0) {
        this.coordinates.splice(idx+1, 0, [point.lat, point.lng])
      } else {
        this.coordinates[i+1] = [point.lat, point.lng]
      }

    })
    this.toAdd = null
    this.draw()
  }

  private addToIndex = (e, idx): void => {
    this.coordinates.splice(idx, 0, [e.latlng.lat, e.latlng.lng])
    this.draw()
  }

  private add = (e): void => {
    if (this.toolID() === 1 && this.bool) {
      this.coordinates.push([e.latlng.lat, e.latlng.lng])
      this.polyline.addLatLng([e.latlng.lat, e.latlng.lng])
      /*this.polyline.on('mousemove', (e) => {
        if(this.cursor) this.map.removeLayer(this.cursor)
        this.cursor = L.circle([e.latlng.lat, e.latlng.lng], {radius: 7, fillColor: '#34616C', fillOpacity:1, stroke: false})
          .addTo(this.map)
      })*/
      /*this.polyline.on('mouseout', (e) => {
        if(this.cursor) this.map.removeLayer(this.cursor)
        this.cursor = null
      })*/
      this.addMarker(e)
      this.drag = true
      this.num = this.coordinates.length-1
    }
    this.bool = true
  }

  private initMap(): void {

    this.map = L.map('map', {
      center: [ 45.778480529785156, 4.8537468910217285 ],
      zoom: 16,
      zoomControl: false
    })
    this.draw()
    //let theme = "mapbox/streets-v10"
    let theme = "amauryg/ck6ru04ol65091ipfzqurfraf"
    let token = "pk.eyJ1IjoiYW1hdXJ5ZyIsImEiOiJjazZxd3l5cHYwMTdnM21sOXM3Z3MxeWx3In0.VfaiCkcJq4e-UWo5ysP34Q"
    let osm = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    let mapbox = `https://api.mapbox.com/styles/v1/${theme}/tiles/256/{z}/{x}/{y}?access_token=${token}`
    const tiles = L.tileLayer(mapbox, {
      useCache: true,
      crossOrigin: true,
      maxZoom: 19,
      detectRetina: true,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })
    tiles.addTo(this.map)

    tiles.on('tilecachehit', (e) => {
      //console.log(e.url)
    })

    tiles.on('tilecachemiss', (e) => {
      //console.log(e.url)
    })

    tiles.on('tilecacheerror', (e) => {
      console.log(e)
    })

    L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map)

    this.map.on('click', this.zoom)
    this.map.on('mousedown', this.add)
    this.map.on('mousemove', this.move)
    this.map.on('mousemove', this.select)
    this.map.on('mouseup', () => {
      if(this.toAdd) {
        this.addShortcut()
        this.map.removeLayer(this.lasso)
        this.lasso = null
      }
    })
    this.map.on('mousedown', () => {
      this.drag = true
    })
    this.map.on('mouseup', () => {
      this.drag = false
      this.num = null
    })

    /*let arr = []
    this.map.on('click', (e) => {
      console.log(e)
      arr.push([e.latlng.lat, e.latlng.lng])
      L.polyline(arr, {color: '#3379FF'}).addTo(this.map)
      arr.forEach(coord => {
        L.circle(coord, {radius: 7, fillColor: '#34616C', fillOpacity:1, stroke: false}).addTo(this.map).on('click', (e) => {
          console.log(e)
        })
      })
    })*/

  }

}
