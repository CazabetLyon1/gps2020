import * as Leaflet from 'leaflet'

declare module "leaflet" {

  interface TileLayerOptions extends GridLayerOptions {
      useCache?: boolean;
      cacheMaxAge?: number;
  }

  interface LeafletEvent {
    url?: string;
  }

}
