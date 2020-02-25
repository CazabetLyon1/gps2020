import * as apexcharts from 'apexcharts'

declare module "apexcharts" {

  export interface ApexOptions {
    fill?: {
      gradient?: {
        colorStops?: number[]
      }
    }
  }

}
