import { Component, ViewChild } from '@angular/core'

import { ChartComponent } from 'ng-apexcharts'
import { ApexOptions } from 'apexcharts'

/*export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};*/

@Component({
  selector: "apex-chart",
  template: '<div id="chart"><apx-chart [series]="chartOptions.series" [chart]="chartOptions.chart" [xaxis]="chartOptions.xaxis" [yaxis]="chartOptions.yaxis" [dataLabels]="chartOptions.dataLabels" [tooltip]="chartOptions.tooltip" [grid]="chartOptions.grid" [stroke]="chartOptions.stroke" [markers]="chartOptions.markers"></apx-chart></div>',
  styles: [
    require("to-string-loader!../scss/chart.component.scss").toString(),
  ]
})
export class ChartElevationComponent {
  @ViewChild("chart") chart: ChartComponent
  public chartOptions: Partial<ApexOptions>

  constructor() {
    /*setTimeout(() => {
      this.chartOptions.chart.height = 200
      this.chartOptions.series = [
        {
          data: [19, 2, 14, 5, 20, 15, 3]
        }
      ]
    }, 4000);*/
    this.chartOptions = {
      series: [
        {
          name: "Altitude",
          data: [0, 0]
        }
      ],
      chart: {
        id: "elevation-chart",
        height: 100,
          type: "area",
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        }
      },
      tooltip: {
        followCursor: false,
        enabled: true,
        marker: {
          show: false
        },
        x: {
          show: false
        },
        y: {
          title: {
            formatter: () => ''
          }
        }
      },
      fill: {
        //colors: ['red'],
        //type: "gradient",
        /*gradient: {
          //colorStops: [50
            {
              offset: 0,
              color: "#89f7fe",
              opacity: 1
            },
            {
              offset: 100,
              color: "#66a6ff",
              opacity: 1
            }
          //]
        }*/
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 1,
        colors: ['#3379FF']
      },
      grid: {
        show: false,
        padding: {
          left: 0,
          right: 0,
          bottom: 0,
          top: 0
        },
        row: {
          colors: ["transparent"],
          opacity: 1
        }
      },
      yaxis: {
        floating: true,
        axisTicks: {
          show: false
        },
        axisBorder: {
          show: false,
        },
        labels: {
          show: false
        }
      },
      xaxis: {
        floating: true,
        axisTicks: {
          show: true
        },
        axisBorder: {
          show: false
        },
        labels: {
          show: false
        },
        tooltip: {
          enabled: false
        }
      },
      markers: {
        size: 4,
        colors: ['#3379FF'],
        strokeWidth: 1
      },
    }
  }
}
