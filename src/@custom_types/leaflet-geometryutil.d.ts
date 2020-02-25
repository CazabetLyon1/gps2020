import * as Leaflet from 'leaflet'

declare module "leaflet" {

  export class GeometryUtil {
    static belongsSegment(a: L.Latlng, b: L.Latlng, c: L.Latlng): boolean;
  }

}
