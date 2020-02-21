import * as Leaflet from 'leaflet'

declare module "leaflet" {

  interface TileLayerOptions extends GridLayerOptions {
      useCache?: boolean;
  }

  interface LeafletEvent {
    url?: string;
  }
  
}
