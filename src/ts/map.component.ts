import { Component, OnInit } from '@angular/core'
import PouchDB from 'pouchdb'
import * as L from 'leaflet'
import * as Lh from 'leaflet-hotline'
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
  private point
  private bool: boolean = true
  private drag: boolean = false
  private num: number = null
  private cursor
  private lasso
  private preview = null
  private toAdd
  private coordinateToRequest
  private fusion = null
  private cut = []
  private metadata: {
    name?: string,
    desc?: string,
    author?: {
      name?: string,
      email?: string
    }
  } = {}

  private undo: HTMLElement = document.getElementById("undo")
  private redo: HTMLElement = document.getElementById("redo")

  private import: HTMLButtonElement = document.getElementById("import") as HTMLButtonElement
  private export: HTMLButtonElement = document.getElementById("export") as HTMLButtonElement

  constructor() {}

  ngOnInit(): void {
    //this.initMap()
    const el = document.getElementById("top-left")
    el.style.transform = "translate(calc(50vw - 50% - 40px), calc(50vh - 50% - 100px)) scale(5)"
    setTimeout(() => {
      el.style.transition = "filter 0.5s ease-in-out, transform 1.5s ease-in-out, opacity 1.5s ease-in-out"
      el.style.transform = "translate(calc(50vw - 50% - 40px), calc(50vh - 50% - 100px)) scale(2)"
      //el.classList.add("centered")
    }, 500)
    /*el.addEventListener("transitionstart", (e) => {
      el.style.opacity = "1"
    }, {once: true})*/
    el.addEventListener("transitionend", (e) => {
      if(e.propertyName === "transform") {
        el.style.transition = "filter 0.5s ease-in-out, transform 0.5s ease-in-out"
        console.log(window.getComputedStyle(el, "transform"))
        el.style.transform = "translate(calc(50vw - 50% - 40px), calc(50vh - 50% - 120px)) scale(2)"
        el.addEventListener("transitionend", (e) => {
          if(e.elapsedTime === 0.5) {
            document.getElementById("page-progress").addEventListener("transitionend", () => {
              this.initMap()
            }, {once: true})
            document.getElementById("page-progress").style.opacity = "1"
          }
        }, {once: true})
      }
      //console.log(e)
    }, {once: true})
    //}, {once: true})
  }

  /**
   * Récupérer l'index de l'outil selectionné
   *
   * @return {number}
   * Example : si l'outil lasso est selectionné, le resultat est 4
  **/
  private toolID = (): number => {
    return Array.from(document.querySelectorAll("input[name='tools']"))
      .findIndex(x => (x as HTMLInputElement).checked)
  }

  /**
   * Activer manuellement un outil
   *
   * @param {number} idx -> index de l'outil à activé
   * Example : pour activer le lasso, idx = 4
  **/
  private activateTool = (idx): void => {
    var i = Array.from(document.querySelectorAll("input[name='tools']"))[idx] as HTMLInputElement
    i.checked = true
    i.dispatchEvent(new Event('change'))
  }

  /**
   * Calculer la distance entre deux coordonnées GPS
   *
   * @param {number} lat1 -> latitude du point n°1
   * @param {number} lng1 -> longitude du point n°1
   * @param {number} lat2 -> latitude du point n°2
   * @param {number} lng2 -> longitude du point n°2
   *
   * @return {number} distance entre les deux points en km
  **/
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

  /**
   * Recentrer la map autour d'une coordonnée
   *
   * @param {LeafletEvent} e
  **/
  private zoom = (e): void => {
    /*dispatchEvent(new CustomEvent("notification", {
      detail: {
        title: 'click',
        message: ""
      }
    }))*/
    if (this.toolID() === 0) {
      this.map.setView(e.latlng)
      //this.map.zoomIn()
    }
  }

  /**
   * Redessiner la polyline et l'ajouter à la map
  **/
  private drawPolyline = (): void => {
    if(this.polyline) this.map.removeLayer(this.polyline)
    if(this.coordinates.length > 0) {
      //let max = this.elevations.length > 0 ? Math.max(...this.elevations) : 1
      //let min = this.elevations.length > 0 ? Math.min(...this.elevations) : 0
      let min = this.elevations.length > 0 ? this.elevations.reduce((min, ele) => min > ele ? ele : min) : 0
      let max = this.elevations.length > 0 ? this.elevations.reduce((max, ele) => max < ele ? ele : max) : 0
      if(min === max) max++
      let data = this.coordinates.map((x, i) => {
        return [...x, this.elevations.length >= i+1 ? this.elevations[i] : Math.min(...this.elevations)]
      })
      this.polyline = Lh.hotline(data,
        {
          className: "kkkkkk",
          weight: 3,
          //color: '#3379FF',
          outlineWidth: 0,
          //outlineColor: "black",
          palette: {
            /*0 : "hsl(219, 100%, 60%)",
            1 : "hsl(219, 100%, 30%)"*/
            0 : "#00c6fb",
            1 : "#005bea"
          },
          min: min,
          max: max
        }
      ).addTo(this.map)
      this.polyline.on('mousedown', (e) => {
        if([1, 6].includes(this.toolID())) {
          this.bool = false
          let i = e.target.getLatLngs().findIndex((x,i,t) => L.GeometryUtil.belongsSegment(e.latlng, t[i], t[i+1]))
          if(this.toolID() === 1) {
            this.drag = true
            this.num = i+1
          } else {
            if(this.cut.length === 1 && this.cut[0] > i+1) {
              this.cut[0] = this.cut[0]+1
            }
            this.cut.push(i+1)
          }
          this.addToIndex(e, i+1)
          if(this.cut.length > 1) {
            setTimeout(() => {
              this.cut.sort()
              this.coordinates.splice(this.cut[0]+1, this.cut[1]-this.cut[0]-1)
              this.elevations.splice(this.cut[0]+1, this.cut[1]-this.cut[0]-1)
              this.cut = []
              this.draw()
              this.saveState()
              this.updateChart()
              this.updateInformations()
            }, 300)
          }
        }
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
    }
  }

  /**
   * Redessiner toute la trace (polyline et circles)
  **/
  private draw = (): void => {
    this.circles.forEach(layer => {
      this.map.removeLayer(layer)
    })
    this.circles = []
    this.drawPolyline()
    this.coordinates.forEach(coord => {
      this.addMarker({
        latlng: {
          lat: coord[0],
          lng: coord[1]
        }
      })
    })
  }

  /**
   * L'outil lasso
   *
   * @param {LeafletEvent}
  **/
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

  /**
   * L'outil déplacement
   *
   * @param {LeafletEvent}
  **/
  private move = (e): void => {
    /*dispatchEvent(new CustomEvent("notification", {
      detail: {
        title: "k",
        message: "jj"
      }
    }))*/
    /*let po = document.getElementById("points")
        po.textContent = String(parseInt(po.textContent)+1)*/
    if(!this.point || (this.point && this.drag && this.point === this.num)) {
      const lat = document.getElementById("lat") as HTMLButtonElement
      const lng = document.getElementById("lng") as HTMLButtonElement
      lat.value = e.latlng.lat ;
      lng.value = e.latlng.lng ;
      lat.textContent = String(e.latlng.lat).substring(0, 7) + "..."
      lng.textContent = String(e.latlng.lng).substring(0, 7) + "..."
      if(!this.point) {
        lat.classList.remove("highlight")
        lng.classList.remove("highlight")
      }
      this.map.dragging.enable()
    }
    if([1,2,3,4].includes(this.toolID())) {
      this.map.dragging.disable()
    }
    if(this.drag && (this.toolID() === 1 || this.toolID() === 3)) {
      //L.DomUtil.addClass(this.map._container,'grabbing-cursor')
      this.activateTool(3)
      /*dispatchEvent(new CustomEvent("notification", {
        detail: {
          title: "yu",
          message: this.num
        }
      }))*/
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

  /**
   * Actualiser le graphe ApexCharts
  **/
  private updateChart = (): void => {
    window.ApexCharts.exec("elevation-chart", "updateSeries", [
      {
        data: this.elevations
      }
    ])
  }

  /**
   * Récupérer l'altitude d'un point GPS de manière asynchrone
   *
   * @param {LeafletEvent}
   *
   * @return {Promise}
  **/
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

  /**
   * Dessiner un point (circle) sur la map
   *
   * @param {LeafletEvent}
  **/
  private addMarker = (e): void => {
    //this.circles.push(L.circle(Array.isArray(e) ? (e as L.LatLngExpression) : [e.latlng.lat, e.latlng.lng],
    this.circles.push(L.circle([e.latlng.lat, e.latlng.lng],
      {
        className: "grab-cursor",
        radius: this.map.getZoom() < 16 ? 0 : (this.circles.length === this.point ? 15 : 10),
        fillColor: this.cut.includes(this.circles.length) ? 'red' : '#34616C',
        fillOpacity:1,
        //stroke: false
        stroke: true,
        color: 'white',
        weight: this.map.getZoom() < 16 ? 0 : 3
      })
      .addTo(this.map)
      //.setZIndex(this.circles.length)
      //.bringToFront()
      .on('mouseover', (e) => {
        //console.log('jhkjh')
        //document.body.style.cursor = "wait"
        //L.DomUtil.addClass(this.map._container,'move-cursor-enabled')
      })
      .on('mousedown', (e) => {
        this.bool = false
        this.drag = true
        this.num = this.coordinates.findIndex(x => x[0] === (e as L.LeafletMouseEvent).target._latlng.lat && x[1] === (e as L.LeafletMouseEvent).target._latlng.lng)
        dispatchEvent(new CustomEvent("notification", {
          detail: {
            title: "k",
            message: 'll'
          }
        }))
        //L.DomEvent.stopPropagation
      })
      .on('mousemove', (e) => {
        //this.move(e)
        //console.log("test")
        //L.DomEvent.stop(e)
      })
      .on('mouseup', (e) => {
        //console.log('khk')
      })
      .on('mouseover', (e) => {
        //console.log(e.target)
        if(this.toolID() != 0 && this.circles[this.point] !== e.target) {
          e.target.setRadius(15)
        }
        e.target._path.classList.add("kjkh")
      })
      .on('mouseout', (e) => {
        //console.log('mouseout')
        if(e.target !== this.circles[this.point]) {
          e.target.setRadius(10)
        }
      })
      .on('click', (e) => {
        if (this.toolID() === 2) {
          this.delete(e)
        } else if(this.toolID() === 1) {
          L.DomEvent.stop(e)
          this.circles[this.point] === e.target ? this.unselectMarker() : this.selectMarker(e.target)
        }
      }))
      //this.circles[this.circles.length-1].setZIndex(this.circles.length)
      //this.circles[this.circles.length-1].bringToFront()
  }

  private unselectMarker = (): void => {
    this.circles[this.point].setRadius(10)
    this.point = null
    const moy = document.getElementById("moy")
          moy.classList.remove("highlight")
          moy.textContent = String(this.elevations.reduce((moy, ele) => (moy+ele)/2, this.elevations[0]).toFixed(2))
          moy.nextElementSibling.textContent = "Moy"
    const lat = document.getElementById("lat") as HTMLButtonElement
          lat.classList.remove("highlight")
    const lng = document.getElementById("lng") as HTMLButtonElement
          lng.classList.remove("highlight")
  }

  private selectMarker = (marker): void => {
    if(this.point) this.unselectMarker()
    const index = this.circles.indexOf(marker)
    this.point = index
    marker.setRadius(15)
    const moy = document.getElementById("moy")
          moy.classList.add("highlight")
          moy.textContent = this.elevations[index]
          moy.nextElementSibling.textContent = "Val"

    const lat = document.getElementById("lat") as HTMLButtonElement
          lat.value = this.coordinates[index][0]
          lat.textContent = String(this.coordinates[index][0]).substring(0, 7) + "..."
          lat.classList.add("highlight")
    const lng = document.getElementById("lng") as HTMLButtonElement
          lng.value = this.coordinates[index][1]
          lng.textContent = String(this.coordinates[index][1]).substring(0, 7) + "..."
          lng.classList.add("highlight")


  }

  /*private addShortcut = (): void => {
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
  }*/

  /**
   * Ajouter un point à la trace GPS
   *
   * @param {LeafletEvent} e
   * @param {number} idx -> position du point à ajouter
  **/
  private addToIndex = (e, idx): void => {
    this.coordinates.splice(idx, 0, [e.latlng.lat, e.latlng.lng])
    this.getElevation(e).then(ele => {
      this.elevations.splice(idx, 0, ele)
      if(this.point && idx < this.point) this.point++
      this.drawPolyline()
      if(this.toolID() !== 6) {
        this.saveState()
        this.updateChart()
        this.updateInformations()
      }
    })
    this.draw()
  }

  /**
   * Supprimer un point de la trace GPS
   *
   * @param {LeafletEvent} e
  **/
  private delete = (e): void => {
    let idx = this.circles.findIndex(x => x === e.target)
    this.coordinates.splice(idx, 1)
    this.elevations.splice(idx, 1)
    if(this.point && idx < this.point) this.point--
    if(this.point && idx === this.point) this.point = null
    this.saveState()
    this.updateChart()
    this.updateInformations()
    this.draw()
  }

  /**
   * Ajouter un point en fin de trace GPS
   *
   * @param {LeafletEvent} e
  **/
  private add = (e): void => {
    if (this.toolID() === 1 && this.bool) {
      this.coordinates.push([e.latlng.lat, e.latlng.lng])
      //this.polyline.addLatLng([e.latlng.lat, e.latlng.lng])
      this.getElevation(e).then(ele => {
        this.elevations.push(ele)
        this.drawPolyline()
        this.saveState()
        this.updateChart()
        this.updateInformations()
      })
      this.addMarker(e)
      this.drag = true
      this.num = this.coordinates.length-1
      this.draw()
    }
    this.bool = true
  }

  /**
   * Sauver un état de la trace dans l'historique
  **/
  private saveState = (): void => {
    let x = this.coordinates.slice(0, this.coordinates.length)
    let y = this.elevations.slice(0, this.coordinates.length)
    if(this.historyIndex+1 !== this.history.length) {
      this.historyIndex = this.history.length-1
      this.history.splice(this.historyIndex+1, 0, this.history[this.historyIndex-1])
      this.historyIndex++
      let redo = (this.redo as HTMLButtonElement)
      if(!redo.disabled) {
          redo.disabled = true
      }
    }
    this.history.splice(this.historyIndex+1, 0, {
      coordinates : x,
      elevations : y,
      center : [this.map.getCenter().lat, this.map.getCenter().lng],
      zoom : this.map.getZoom(),
      metadata : this.metadata
    })
    this.historyIndex++
    if(this.historyIndex !== 0) {
      (this.undo as HTMLButtonElement).disabled = false
    }
  }

  /**
   * Revenir en arrière dans l'historique
   *
   * @param {LeafletEvent}
  **/
  private prev = (e): void => {
    this.historyIndex--
    this.coordinates = this.history[this.historyIndex].coordinates.slice(0)
    this.elevations = this.history[this.historyIndex].elevations.slice(0)
    this.metadata = this.history[this.historyIndex].metadata
    this.map.setView(
      this.history[this.historyIndex].center.slice(0),
      this.history[this.historyIndex].zoom
    )
    this.draw()
    this.updateChart()
    this.updateInformations()
    this.fillMeta()
    let redo = (this.redo as HTMLButtonElement)
    if(redo.disabled) {
        redo.disabled = false
    }
    let undo = (this.undo as HTMLButtonElement)
    if(this.historyIndex === 0) {
        undo.disabled = true
    }
  }

  /**
   * Revenir en avant dans l'historique
   *
   * @param {LeafletEvent}
  **/
  private next = (e): void => {
    this.historyIndex++
    this.coordinates = this.history[this.historyIndex].coordinates.slice(0)
    this.elevations = this.history[this.historyIndex].elevations.slice(0)
    this.metadata = this.history[this.historyIndex].metadata
    this.map.setView(
      this.history[this.historyIndex].center.slice(0),
      this.history[this.historyIndex].zoom
    )
    this.draw()
    this.updateChart()
    this.updateInformations()
    this.fillMeta()
    let redo = (this.redo as HTMLButtonElement)
    if(this.historyIndex+1 === this.history.length) {
        redo.disabled = true
    }
    let undo = (this.undo as HTMLButtonElement)
    if(this.historyIndex !== 0) {
        undo.disabled = false
    }
  }

  private updateInformations = (): void => {
    document.getElementById("points").textContent = this.coordinates.length
    document.getElementById("length").textContent = this.coordinates.reduce((o, point) => {
      return {
        last: point,
        sum: o.last ? o.sum + this.distance(o.last[0], o.last[1], point[0], point[1]) : 0
      }
    }, {
      last: null,
      sum: 0
    }).sum.toFixed(2)
    document.getElementById("max").textContent = this.elevations.length ? String(Math.max(...this.elevations).toFixed(2)) : "-"
    document.getElementById("min").textContent = this.elevations.length ? String(Math.min(...this.elevations).toFixed(2)) : "-"
    if(!this.point) {
      document.getElementById("moy").textContent = this.elevations.length ? String((this.elevations.reduce((total, ele) => total+ele)/this.elevations.length).toFixed(2)) : "-"
      document.getElementById("moy").classList.remove("highlight")
      document.getElementById("moy").nextElementSibling.textContent = "Moy"
    }
  }

  private erase = (e): void => {
    if((e.target as HTMLInputElement).checked){
      this.coordinates = []
      this.elevations = []
      this.metadata = {}
      this.draw()
      this.updateChart()
      this.updateInformations()
      this.fillMeta()
      this.saveState() ;
      (e.target as HTMLInputElement).checked = false
    }
  }

  private fillMeta = (): void => {
    (document.getElementById("author") as HTMLInputElement).value = this.metadata.hasOwnProperty("author") && this.metadata.author.hasOwnProperty("name") ? this.metadata.author.name : "" ;
    (document.getElementById("email") as HTMLInputElement).value = this.metadata.hasOwnProperty("author") && this.metadata.author.hasOwnProperty("email") ? this.metadata.author.email : "" ;
    (document.getElementById("name") as HTMLInputElement).value = this.metadata.hasOwnProperty("name") ? this.metadata.name : "" ;
    (document.getElementById("desc") as HTMLTextAreaElement).value = this.metadata.hasOwnProperty("desc") ? this.metadata.desc : "" ;
  }

  private loadCSS = (src): any => {
    return new Promise((resolve, reject) => {
      let link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = src
          link.addEventListener("load", (e) => resolve(e))
      document.head.appendChild(link)
    })
  }

  /**
   * Initialisation de la map et ajout des EventListener
  **/
  private initMap(): void {
    this.map = L.map('map', {
      center: [ 45.778480529785156, 4.8537468910217285 ],
      //center: [37.83962631225586, -119.51520538330078],
      zoom: 16,
      zoomControl: false
    }) ;
    (document.getElementById("zoom") as HTMLInputElement).value = "16"
    document.getElementById("zoom").className = "level-16"
    this.saveState()
    this.draw()
    //let theme = "mapbox/streets-v10"
    let theme = "amauryg/ck6ru04ol65091ipfzqurfraf"
    let token = "pk.eyJ1IjoiYW1hdXJ5ZyIsImEiOiJjazZxd3l5cHYwMTdnM21sOXM3Z3MxeWx3In0.VfaiCkcJq4e-UWo5ysP34Q"
    let osm = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    let mapbox = `https://api.mapbox.com/styles/v1/${theme}/tiles/256/{z}/{x}/{y}?access_token=${token}`
    const tiles = L.tileLayer(mapbox, {
      useCache: true,
      cacheMaxAge: 86400000,
      crossOrigin: true,
      maxZoom: 19,
      detectRetina: true,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })

    /*tiles.on('remainingLength', (e) => {
      console.log('A')
      console.log(e)
    })

    tiles.on('queueLength', (e) => {
      console.log('B')
      console.log(e)
    })

    tiles.on('seedstart', (e) => {
      console.log('C')
      console.log(e)
    })*/
    let length = 0
    let progress = 0
    const el = document.getElementById("page-progress").children[0] as HTMLElement
    const el2 = el.parentElement.parentElement as HTMLElement
    tiles.on('tileloadstart', (e) => length++ )
    tiles.on('tileload', (e) => {
      progress++
      el.style.width = (progress/length)*100 + "%"
    })
    tiles.on('load', (e) => {
      el.parentElement.addEventListener("transitionend", () => {
        el2.style.opacity = "0"
      }, {once: true})
      el2.addEventListener("transitionend", (e) => {
        if((e.target as HTMLElement).id === "loader") {
          el2.remove()
        }
      })
      setTimeout(() => {
        Promise.all([
          this.loadCSS("/cookieconsent/cookieconsent.min.css"),
          this.loadCSS("/leaflet.css")
        ]).then(x => {
          //console.log(x)
          el.parentElement.style.opacity = "0"
          el.parentElement.addEventListener("transitionend", () => {
            document.getElementById("top-left").addEventListener("transitionend", () => {
              (document.querySelector("#top-left span > span") as HTMLElement).style.marginRight = "15px" ;
              document.getElementById("info").style.display = "block"
              document.getElementById("info").style.opacity = ""
            }, {once: true})
            document.getElementById("top-left").style.transform = ""
          }, {once: true})
        })
      }, 500);
    })

    tiles.addTo(this.map)

    /*tiles.on('tilecachehit', (e) => {
      console.log(e.url)
    })*/

    /*tiles.on('tilecachemiss', (e) => {
      console.log(e.url)
    })*/

    /*tiles.on('tilecacheerror', (e) => {
      console.log(e)
    })*/

    /*L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map)*/

    this.map.on('click', this.zoom)
    this.map.on('mousedown', this.add)
    this.map.on('mousemove', this.move)
    this.map.on('mousemove', this.select)
    this.map.on('touchmove', (e) => e.preventDefault())
    this.map.on('mouseup', () => {
      if(this.toAdd) {
        //this.addShortcut()
        this.toAdd.sort().reverse()
        //console.log(this.toAdd)
        this.toAdd.forEach(idx => {
          //console.log('remove',idx)
          this.coordinates.splice(idx, 1)
          this.elevations.splice(idx, 1)
        })
        this.saveState()
        this.updateChart()
        this.updateInformations()
        this.draw()
        this.map.removeLayer(this.lasso)
        this.lasso = null
        this.toAdd = null
      }
    })
    this.map.on('mousedown', () => {
      this.drag = true
    })
    /*this.map.on('click', () => {
      if(this.point) {
        this.point.setRadius(10)
        this.point = null
      }
    })*/
    this.map.on('mouseup', () => {
      this.drag = false
      if(this.toolID() === 3) {
        if(this.fusion) {
          this.coordinates.splice(this.fusion, 1)
          this.elevations.splice(this.fusion, 1)
          this.fusion = null
          this.saveState()
          this.updateChart()
          this.updateInformations()
          this.draw()
          this.num = null
          this.coordinateToRequest = null
        } else {
          this.getElevation(this.coordinateToRequest).then(ele => {
            this.elevations[this.num] = ele
            if(this.point && this.point === this.num) document.getElementById("moy").textContent = ele
            this.drawPolyline()
            this.saveState()
            this.updateChart()
            this.updateInformations()
            this.num = null
            this.coordinateToRequest = null
          })
        }
        this.activateTool(1)
      }
    })

    this.map.on("zoomend", (e) => {
      if(e.target._zoom < 16) {
        this.circles.forEach(circle => {
          circle.setRadius(0)
          circle.setStyle({
            weight: 0
          })
        })
      } else {
        this.circles.forEach(circle => {
          circle.setRadius(10)
          circle.setStyle({
            weight: 3
          })
        })
      }
    })

    this.undo.addEventListener('click', this.prev)
    this.redo.addEventListener('click', this.next)

    document.getElementById("erase").addEventListener("change", this.erase)

    window.addEventListener("metadata", () => {
      document.getElementById("info").dispatchEvent(new Event("click"))
    })

    document.getElementById("info").addEventListener("click", () => {
      document.body.classList.add("blur")
      document.getElementById("metadata-container").style.zIndex = "10000"
      Array.from(document.getElementById("metadata").children).forEach((el, i) => {
        setTimeout(() => {
          (el as HTMLElement).style.opacity = "1" ;
          (el as HTMLElement).style.transform = "translateY(0px)"
        }, i*100)
      })
    })

    document.getElementById("metadata").addEventListener("click", (e) => e.stopPropagation())

    document.getElementById("valid_metadata").addEventListener("click", () => {
      document.getElementById("metadata-container").dispatchEvent(new Event("click"))
    })

    document.getElementById("metadata-container").addEventListener("click", () => {
      Array.from(document.getElementById("metadata").children).reverse().forEach((el, i, array) => {
        if(el instanceof HTMLLabelElement) {
          const x = el.children[1] as HTMLInputElement
          if(["author", "email"].includes(x.id)) {
            if(!this.metadata.hasOwnProperty("author")) this.metadata.author = {}
            this.metadata["author"][x.id === "author" ? "name" : x.id] = x.value
          } else {
            this.metadata[x.id] = x.value
          }
        }
        if(i+1 === array.length) {
          el.addEventListener("transitionend", () => {
            if((document.querySelector("export-module") as HTMLElement).style.display !== "flex") {
              document.body.classList.remove("blur")
            } else {
              dispatchEvent(new CustomEvent("init_file"))
            }
            document.getElementById("metadata-container").style.zIndex = "-1"
          }, {once: true})
        }
        setTimeout(() => {
          (el as HTMLElement).style.opacity = "0" ;
          (el as HTMLElement).style.transform = "translateY(40px)"
        }, i*100)
      })
      //console.log(this.metadata)
    })

    Array.from(document.querySelectorAll("#lasso, #wand, #cut")).forEach(input => {
      input.addEventListener("change", (e) => {
        if((e.target as HTMLInputElement).checked && this.coordinates.length < 3) {
          (e.target as HTMLInputElement).checked = false
          dispatchEvent(new CustomEvent("notification", {
            detail: {
              title: "Erreur",
              message: "Placer au moins trois points sur la carte."
            }
          }))
        }
      })
    })

    Array.from(document.querySelectorAll("input[name='tools']")).forEach(input => {
      input.addEventListener("change", () => {
        if(this.toolID() !== 6 && this.cut.length > 0) {
          this.coordinates.splice(this.cut[0], 1)
          this.elevations.splice(this.cut[0], 1)
          this.cut = []
          this.draw()
        }
      })
    })

    document.getElementById("help-flex").addEventListener("click", (e) => {
      e.stopPropagation()
    })

    document.getElementById("help").addEventListener("click", () => {
      document.body.classList.add("blur") ;
      document.getElementById("help_container").style.zIndex = "10000"
      document.body.addEventListener("transitionend", () => {
        document.getElementById("gif").style.opacity = "1"
        Array.from(document.querySelectorAll("input[name='help'] + label")).forEach((label, i) => {
          setTimeout(() => {
            (label as HTMLElement).style.opacity = "1" ;
            (label as HTMLElement).style.transform = "translateY(0px)" ;
          }, i * 100) ;
        })
      }, {once: true})
    }) ;

    document.getElementById("help_container").addEventListener("click", () => {
      const gif = document.getElementById("gif") as HTMLImageElement
      gif.style.opacity = "0"
      if(gif.src = "") {
        gif.src = "/img/move_map.gif"
      }
      Array.from(document.querySelectorAll("input[name='help'] + label")).reverse().forEach((label, i, array) => {
        if(i+1 === array.length) {
          label.addEventListener("transitionend", () => {
            document.body.addEventListener("transitionend", () => {
              document.getElementById("help_container").style.zIndex = "-1"
            }, {once: true})
            document.body.classList.remove("blur")
          }, {once: true})
        }
        setTimeout(() => {
          (label as HTMLElement).style.opacity = "0" ;
          (label as HTMLElement).style.transform = "translateY(70px)" ;
        }, i * 100) ;
      })
    })

    document.getElementById("gif").addEventListener("click", (e) => {
      const gif = e.target as HTMLElement
            gif.classList.toggle("centered")
      document.getElementById("help_container").classList.toggle("blur")
    })

    Array.from(document.querySelectorAll("input[name='help']")).forEach(input => {
      input.addEventListener("change", (e) => {
        if((e.target as HTMLInputElement).checked) {
          (document.getElementById("gif") as HTMLImageElement).src = "/img/" + (input as HTMLInputElement).id.substring(5) + ".gif"
        }
      })
    })

    Array.from(document.querySelectorAll("input[name='help'] + label")).forEach(label => {
      (label as HTMLElement).style.setProperty("--height", ((label.children[1] as HTMLElement).offsetHeight+40+10) + "px")
    })

    Array.from(document.querySelectorAll(".tooltip")).forEach(tooltip => {
      tooltip.addEventListener("mouseenter", (e) => {
        tooltip.parentElement.dispatchEvent(new Event("mouseleave"))
      }, true)
      /*tooltip.addEventListener("mouseleave", (e) => {

      }, true)*/
    })

    Array.from(document.querySelectorAll(".tool")).forEach(tool => {
      tool.addEventListener("mouseenter", (e) => {
        if(!(tool.previousElementSibling as HTMLInputElement).disabled) (tool.children[0] as HTMLElement).classList.add("hover")
        setTimeout(() => {
          tool.dispatchEvent(new Event("mouseleave"))
        }, 1000)
      })
      tool.addEventListener("mouseleave", (e) => {
        (tool.children[0] as HTMLElement).classList.remove("hover")
      })
    })

    Array.from(document.querySelectorAll("#lat, #lng")).forEach(button => {
      button.addEventListener("click", (e) => {
        //console.log((e.target as HTMLButtonElement).value)
        const el = document.createElement("textarea")
              el.value = String((e.target as HTMLButtonElement).value)
              el.setAttribute("readonly", "")
              //el.style.display = "none"
              el.style.position = "absolute"
              el.style.left = "-9999px"
        document.body.appendChild(el)
        const sel = document.getSelection().rangeCount > 0
                  ? document.getSelection().getRangeAt(0)
                  : false
        el.select()
        document.execCommand("copy")
        document.body.removeChild(el)
        if(sel) {
          document.getSelection().removeAllRanges()
          document.getSelection().addRange(sel)
        }
        dispatchEvent(new CustomEvent("notification", {
          detail: {
            title: "Succès",
            message: "Enregistrée dans le presse-papier."
          }
        }))
      })
    })

    document.getElementById("zoom").addEventListener("input", (e) => {
      let zoom = (e as any).target.value ;
      (e.target as HTMLElement).className = "level-" + zoom
      this.map.setZoom(zoom)
    })

    Array.from(document.querySelectorAll("#zoomin, #zoomout")).forEach(button => {
      button.addEventListener("click", () => {
        let zoom = this.map.getZoom() + (button.id === "zoomin" ? 1 : -1)
        const input = document.getElementById("zoom") as HTMLInputElement
        input.value = zoom
        input.dispatchEvent(new Event("input"))
      })
    })

    this.map.on("zoomend", () => {
      const zoom = document.getElementById("zoom") as HTMLInputElement
      const z = this.map.getZoom()
      zoom.className = "level-" + z
      zoom.value = z
    })

    window.addEventListener("need_data", () => {
      dispatchEvent(new CustomEvent("data", {
        detail: {
          coordinates: this.coordinates,
          elevations: this.elevations,
          metadata: this.metadata
        }
      }))
    })

    this.import.addEventListener('click', () => {
      dispatchEvent(new CustomEvent("show_import"))
    })

    this.export.addEventListener('click', () => {
      dispatchEvent(new CustomEvent("show_export"))
    })

    document.getElementById("localization").addEventListener("click", () => {
      if("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
          this.map.setView([position.coords.latitude, position.coords.longitude])
          this.saveState()
        }, error => {
          dispatchEvent(new CustomEvent("notification", {
            detail: {
              title: "Erreur",
              message: "La connexion n'est pas sécurisée."
            }
          }))
        })
      } else {

      }
    })

    /*document.getElementById("hide_details").addEventListener("change", (e) => {
      console.log(e)
    })*/

    document.getElementById("wand").addEventListener("click", () => {
      if(this.coordinates.length < 3) return
      document.body.classList.toggle("wand_mode")
      Array.from(document.querySelectorAll("input[name='tools']:not(:nth-of-type(6))")).forEach(input => {
        (input as HTMLInputElement).disabled = !(input as HTMLInputElement).disabled
      })
      if(document.body.classList.contains("wand_mode")) {
        let save = this.coordinates
        let saveE = this.elevations
        let steps = save.reduce((x, point) => {
          let distance = x.last ? this.distance(x.last[0], x.last[1], point[0], point[1]) : null
          return {
            last: point,
            sum: x.last ? x.sum + distance : 0,
            distances: x.last
                       ? [
                         ...x.distances,
                         distance,
                         x.sum + distance
                       ]
                       : []
          }
        }, {
          last: null,
          sum: 0,
          distances: []
        }).distances
        //distances.shift()
        let distances = steps.filter((x, i) => i%2 === 0)
        steps[0] = 0
        steps.sort()
        //let total = distances.reduce((total, x) => total+x, 0)
        //let min = Math.min(...distances)
        //let max = Math.max(...distances)
        let div = document.createElement("div")
            div.id = "tolerance-container"
        let div1 = document.createElement("div")
        let span1 = document.createElement("span")
            span1.textContent = this.coordinates.length
        div1.appendChild(span1)
        let range = document.createElement("input")
            range.type = "range"
            range.name = "tolerance"
            range.id = "tolerance"
            range.min = "0"
            range.max = String(steps.length-1)
            range.step = "1"
            range.value = "0"
            range.addEventListener("input", (e) => {
              let value = steps[(e as any).target.value]
              let new_coordinates = distances.reduce((o, distance, i) => {
                return {
                  sum: o.sum >= value ? 0 : o.sum + distance,
                  coordinates : o.sum >= value || i+1 === distances.length ? [...o.coordinates, save[i+1]] : o.coordinates,
                  elevations : o.sum >= value || i+1 === distances.length ? [...o.elevations, saveE[i+1]] : o.elevations
                }
              }, {
                sum : 0,
                coordinates : [save[0]],
                elevations : [saveE[0]]
              })
              this.coordinates = new_coordinates.coordinates
              this.elevations = new_coordinates.elevations
              this.draw()
            })
        div1.appendChild(range)
        let span2 = document.createElement("span")
            span2.textContent = "2"
        div1.appendChild(span2)
        div.appendChild(div1)
        /*let div1 = document.createElement("div")
        let span1 = document.createElement("span")
            span1.textContent = this.coordinates.length
        let span2 = document.createElement("span")
            span2.textContent = this.coordinates.length
        div1.appendChild(span1)
        div1.appendChild(span2)
        div.appendChild(div1)*/
        let div2 = document.createElement("div")
        let cancel = document.createElement("button")
            cancel.id = "cancel"
            cancel.name = "cancel"
            cancel.textContent = "Annuler"
            cancel.addEventListener("click", () => {
              this.coordinates = save
              this.elevations = saveE
              document.getElementById("wand").dispatchEvent(new Event("click"))
            })
        let validation = document.createElement("button")
            validation.id = "validation"
            validation.name = "validation"
            validation.textContent = "Valider"
            validation.addEventListener("click", () => {
              document.getElementById("wand").dispatchEvent(new Event("click"))
            })
        div2.appendChild(cancel)
        div2.appendChild(validation)
        div.appendChild(div2)
        document.body.appendChild(div)
      } else {
        document.getElementById("tolerance-container").remove()
        this.saveState()
        this.updateChart()
        this.updateInformations()
        this.draw()
      }
    })

    window.addEventListener("new", (e) => {
      this.coordinates = (e as any).detail.coordinates
      this.elevations = (e as any).detail.elevations
      this.metadata = (e as any).detail.informations
      this.fillMeta()
      this.draw()
      this.map.fitBounds(this.polyline.getBounds())
      this.updateChart()
      this.updateInformations()
      this.saveState()
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

  }

}
