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
  private history: any = []
  private historyIndex: number = -1
  private coordinates: any = []
  private elevations: any = []
  private polyline
  private circles: any = []
  private bool: boolean = true
  private drag: boolean = false
  private num: number = null
  private cursor
  private lasso
  private preview = null
  private toAdd
  private coordinateToRequest
  private fusion = null

  constructor() {}

  ngOnInit(): void {
    this.initMap()
  }

  private toolID = (): number => {
    return Array.from(document.querySelectorAll("input[name='tools']"))
      .findIndex(x => (x as HTMLInputElement).checked)
  }

  private activateTool = (idx): void => {
    var i = Array.from(document.querySelectorAll("input[name='tools']"))[idx] as HTMLInputElement
    i.checked = true
    i.dispatchEvent(new Event('change'))
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
  	return Math.abs(dist)
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
      if(this.toolID() === 1) {
        this.bool = false
        let i = e.target.getLatLngs().findIndex((x,i,t) => L.GeometryUtil.belongsSegment(e.latlng, t[i], t[i+1]))
        this.addToIndex(e, i+1)
        this.drag = true
        this.num = i+1
      }
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
      if(c.length > 10) {
        //let poly = turf.polygon(this.coordinates)
        let poly = turf.polygon([c as turf.Position[]])
        let points = this.coordinates.reduce((points, point, i) => {
          return turf.booleanPointInPolygon(
            turf.point(point as turf.Position),
            poly
          ) ? [...points, i] : points
        }, [])
        let z = points.reduce((distances, point1) => {
          return {
            ...distances,
            [point1] : points.reduce((distance, point2) => {
              return point1 != point2 ? {...distance, [point2] : this.distance(
                this.coordinates[point1][0],
                this.coordinates[point1][1],
                this.coordinates[point2][0],
                this.coordinates[point2][1]
              )} : distance
          }, {})}
        }, {})
        let idx = Object.entries(z).reduce((res, [d_i, x], i, array) => {
          //return distance < array[index][1] ? d_i : index
          let distance = Object.entries(x).reduce((a, [b, c]) => a + c, 0)
          return distance < res.distance || !res.distance
          ? {
            idx : d_i,
            distance : distance
          }
          : res
        }, {
          idx: 0,
          distance: false
        })
        this.toAdd = []
        points.forEach(point => {
          if(idx.idx != point && this.distance(
            this.coordinates[idx.idx][0],
            this.coordinates[idx.idx][1],
            this.coordinates[point][0],
            this.coordinates[point][1]
          ) < 0.1) {
            this.toAdd.push(point)
          }
        })
      }

      //let r = turf.lineIntersect(line1, line2)
      //if(this.preview) this.map.removeLayer(this.preview)
      //this.preview = L.polyline(r.features.map(x => x.geometry.coordinates as L.LatLngExpression), {weight: 3, color: '#3379FF'}).addTo(this.map)
      //this.toAdd = r.features.map(x => x.geometry.coordinates as L.LatLngExpression)
      //this.toAdd = r.features.map(x => new L.LatLng(x.geometry.coordinates[0], x.geometry.coordinates[1]))
      //console.log(r)
    }
  }

  private move = (e): void => {
    if (this.toolID() === 0) {
      document.getElementById("lat").textContent = e.latlng.lat
      document.getElementById("lng").textContent = e.latlng.lng
      this.map.dragging.enable()
    }
    if([1,2,3,4].includes(this.toolID())) {
      this.map.dragging.disable()
    }
    if(this.drag && (this.toolID() === 1 || this.toolID() === 3)) {
      //L.DomUtil.addClass(this.map._container,'grabbing-cursor')
      this.activateTool(3)
      let c = this.coordinates.slice(0)
      c.splice(this.num, 1)
      let near = c.find(coord => {
        return this.distance(e.latlng.lat, e.latlng.lng, coord[0], coord[1]) < 0.05
      }) || null
      /*c.forEach(coord => {
        console.log(this.distance(e.latlng.lat, e.latlng.lng, coord[0], coord[1]))
      })*/
      this.coordinates[this.num] = near || [e.latlng.lat, e.latlng.lng]
      this.coordinateToRequest = e

      if(near) {
        let coo = this.coordinates.reduce((tab, el, i) => {
          return el[0] === near[0] && el[1] === near[1] ? [...tab, i] : tab
        }, [])
        if(Math.abs(coo[0] - coo[1]) === 1) {
          this.fusion = this.num
        }
      }

      this.draw()
    }
  }

  private updateChart = (): void => {
    window.ApexCharts.exec("elevation-chart", "updateSeries", [
      {
        data: this.elevations
      }
    ])
  }

  private getElevation = (e): any => {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest()
      let url = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${e.latlng.lng},${e.latlng.lat}.json?layers=contour&limit=50&access_token=${this.token}`
      xhr.open("GET", url, true)
      xhr.responseType = "json"
      xhr.onload = (data) => {
        resolve(Math.max(...(data as any).target.response.features.map(x => x.properties.ele)))
        //this.elevations.push(ele)
        //this.updateChart()
      }
      xhr.send()
    })
  }

  private addMarker = (e): void => {
    //this.circles.push(L.circle(Array.isArray(e) ? (e as L.LatLngExpression) : [e.latlng.lat, e.latlng.lng],
    this.circles.push(L.circle([e.latlng.lat, e.latlng.lng],
      {
        className: "grab-cursor",
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
        //L.DomUtil.addClass(this.map._container,'move-cursor-enabled')
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
        if(this.toolID() != 0) {
          e.target.setRadius(15)
        }
        e.target._path.classList.add("kjkh")
      })
      .on('mouseout', (e) => {
        e.target.setRadius(10)
      })
      .on('click', (e) => {
        if (this.toolID() === 2) {
          this.delete(e)
        }
      }))
      //this.circles[this.circles.length-1].setZIndex(this.circles.length)
      //this.circles[this.circles.length-1].bringToFront()
  }

  private addShortcut = (): void => {
    this.toAdd.forEach((point, i) => {
      let idx = this.coordinates.findIndex((x,i,t) => L.GeometryUtil.belongsSegment(point, new L.LatLng(t[i][0], t[i][1]), new L.LatLng(t[i+1][0], t[i+1][1])))
      console.log(idx)
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
    this.getElevation(e).then(ele => {
      this.elevations.splice(idx, 0, ele)
      this.updateChart()
    })
    this.draw()
  }

  private delete = (e): void => {
    let idx = this.circles.findIndex(x => x === e.target)
    this.coordinates.splice(idx, 1)
    this.elevations.splice(idx, 1)
    this.saveState()
    this.updateChart()
    this.draw()
  }

  private add = (e): void => {
    if (this.toolID() === 1 && this.bool) {
      this.coordinates.push([e.latlng.lat, e.latlng.lng])
      this.polyline.addLatLng([e.latlng.lat, e.latlng.lng])
      this.getElevation(e).then(ele => {
        this.elevations.push(ele)
        this.saveState()
        this.updateChart()
      })
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

  private saveState = (): void => {
    let x = this.coordinates.slice(0, this.coordinates.length)
    let y = this.elevations.slice(0, this.coordinates.length)
    if(this.historyIndex+1 !== this.history.length) {
      this.historyIndex = this.history.length-1
      this.history.splice(this.historyIndex+1, 0, this.history[this.historyIndex-1])
      this.historyIndex++
      let redo = (document.getElementById("redo") as HTMLButtonElement)
      if(!redo.disabled) {
          redo.disabled = true
      }
    }
    this.history.splice(this.historyIndex+1, 0, {
      coordinates : x,
      elevations : y,
    })
    this.historyIndex++
    if(this.historyIndex !== 0) {
      (document.getElementById("undo") as HTMLButtonElement).disabled = false
    }
  }

  private initMap(): void {
    this.saveState()
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
        //this.addShortcut()
        this.toAdd.forEach(idx => {
          console.log('remove',idx)
          this.coordinates.splice(idx, 1)
          this.elevations.splice(idx, 1)
          this.saveState()
          this.updateChart()
          this.draw()
        })
        this.map.removeLayer(this.lasso)
        this.lasso = null
        this.toAdd = null
      }
    })
    this.map.on('mousedown', () => {
      this.drag = true
    })
    this.map.on('mouseup', () => {
      this.drag = false
      if(this.toolID() === 3) {
        if(this.fusion) {
          this.coordinates.splice(this.fusion, 1)
          this.elevations.splice(this.fusion, 1)
          this.fusion = null
          this.saveState()
          this.updateChart()
          this.draw()
          this.num = null
          this.coordinateToRequest = null
        } else {
          this.getElevation(this.coordinateToRequest).then(ele => {
            this.elevations[this.num] = ele
            this.saveState()
            this.updateChart()
            this.num = null
            this.coordinateToRequest = null
          })
        }
        this.activateTool(1)
      }
    })

    document.getElementById("undo").addEventListener('click', (e) => {
      this.historyIndex--
      this.coordinates = this.history[this.historyIndex].coordinates.slice(0)
      this.elevations = this.history[this.historyIndex].elevations.slice(0)
      this.draw()
      let redo = (document.getElementById("redo") as HTMLButtonElement)
      if(redo.disabled) {
          redo.disabled = false
      }
      let undo = (document.getElementById("undo") as HTMLButtonElement)
      if(this.historyIndex === 0) {
          undo.disabled = true
      }
    })

    document.getElementById("redo").addEventListener('click', () => {
      this.historyIndex++
      this.coordinates = this.history[this.historyIndex].coordinates.slice(0)
      this.elevations = this.history[this.historyIndex].elevations.slice(0)
      this.draw()
      let redo = (document.getElementById("redo") as HTMLButtonElement)
      if(this.historyIndex+1 === this.history.length) {
          redo.disabled = true
      }
      let undo = (document.getElementById("undo") as HTMLButtonElement)
      if(this.historyIndex !== 0) {
          undo.disabled = false
      }
    })

    Array.from(document.querySelectorAll("input[name='tools']"))
    .forEach((input, i, array) => {
      input.addEventListener('change', (e) => {
        let idx = array.indexOf(e.target as Element)
        let className
        switch(idx) {
          case 0:
            className = "grab-cursor"
            break
          case 2:
            className = "delete-cursor"
            break
          /*case 3:
            className = "grabbing-cursor"
            break*/
        }
        L.DomUtil.removeClass(this.map._container,'add-cursor')
        if([0, 2].includes(idx)) {
          this.circles.forEach(circle => {
            //circle._path.className = ''
            circle._path.classList.add(className)
          })
        } else if(idx === 1) {
          L.DomUtil.addClass(this.map._container,'add-cursor')
        }
      })
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
