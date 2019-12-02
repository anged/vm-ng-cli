// tslint:disable-next-line: max-line-length
import { Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, ChangeDetectorRef, SimpleChanges, AfterViewInit } from '@angular/core';
import Graphic from 'arcgis-js-api/Graphic';
import { MapService } from '../../../../core/services/map.service';
import Chart from 'chart.js';
import { Symbols } from '../../symbols';


class ProfileChart extends Chart {
  tooltip: any;
  fullData: any;
}

ProfileChart.controllers.customChart = ProfileChart.controllers.line;

const customChart = ProfileChart.controllers.line.extend({
  // tslint:disable-next-line: object-literal-shorthand
  draw: function(ease) {
    // Call super method first
    Chart.controllers.line.prototype.draw.call(this, ease);

    if (this.chart.tooltip._active && this.chart.tooltip._active.length) {
      const activePoint = this.chart.tooltip._active[0];
      const ctx = this.chart.ctx;
      const x = activePoint.tooltipPosition().x;
      const topY = this.chart.scales['y-axis-0'].top;
      const bottomY = this.chart.scales['y-axis-0'].bottom;

      // draw line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#e61c24';
      ctx.stroke();

      // draw circle point
      ctx.beginPath();
      ctx.arc(activePoint.tooltipPosition().x, activePoint.tooltipPosition().y, 5, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#e61c24';
      ctx.stroke();

      ctx.restore();
    }
  }
});

Chart.controllers.customChart = customChart;

@Component({
  selector: 'maps-v-profile-elevation',
  templateUrl: './profile-elevation.component.html',
  styleUrls: ['./profile-elevation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileElevationComponent implements AfterViewInit {
  @Input() data;
  @Input() fullscreen;
  @ViewChild('elevationChart', { static: false }) elevationChart: ElementRef;

  profileChart: ProfileChart;
  canvasChart: any;
  previousPoint: Graphic;
  view: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private mapService: MapService
  ) { }

  ngAfterViewInit() {
    this.view = this.mapService.getView();
    this.canvasChart = this.elevationChart.nativeElement.getContext('2d');
    this.profileChart = new ProfileChart(this.canvasChart, {
      type: 'customChart',
      options: {
        maintainAspectRatio: false,
        tooltips: {
          caretPadding: 10,
          caretSize: 4,
          cornerRadius: 2,
          mode: 'index',
          intersect: false,

          // get active tooltip point coordinates
          custom: () => {
            const isActiveTooltip = this.profileChart.tooltip._active[0] ? true : false;
            if (isActiveTooltip) {
              const activePointIndex = this.profileChart.tooltip._active[0]._index;
              const activePointCoordinates = this.profileChart.fullData[activePointIndex];
              this.createPointGraphic(activePointCoordinates);
            }

          }
        },
        legend: {
          display: false
        },
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              fontSize: 14,
              labelString: 'Aukštis (m)'
            },
            gridLines: {
              display: true
            },
            ticks: {
              callback(label) { return label + ' m'; },
              beginAtZero: false
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              fontSize: 14,
              labelString: 'Atstumas (km)'
            },
            gridLines: {
              display: false
            },
            ticks: {
              // autoSkip: true,
              maxTicksLimit: 10,
              beginAtZero: false
            }
          }]
        }
      }
    });
  }

  initProfileElevationChart(chartData) {
    const data = chartData.geometry.paths[0].map(coord => (Math.round(coord[2] * 10) / 10).toFixed(1));
    // add x y data to chart
    this.profileChart.fullData = chartData.geometry.paths[0].map(coord => {
      coord.pop();
      return coord;
    });
    const datasets = [
      {
        label: '',
        data,
        backgroundColor: [
          'rgba(154, 8, 8, 0.1)'
        ],
        borderColor: [
          'rgba(230, 28, 36, 1.0)'
        ],
        borderWidth: 2,
        pointHoverBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointHoverBorderColor: 'rgba(150, 106, 236, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointHoverRadius: 0,
        pointRadius: 0,
        spanGaps: false,
        steppedLine: false // square lines enabled, no smoothing
        // pointHitRadius: 10
      }
    ];

    this.profileChart.data.labels = this.getLabel(data, chartData);
    this.profileChart.data.datasets = datasets;
    this.profileChart.update();

  }

  getLabel(dataZCoord: number[], chartData): string[] {
    const dataXCoord = chartData.geometry.paths[0].map(coord => coord[0].toFixed(2));
    const dataYCoord = chartData.geometry.paths[0].map(coord => coord[1].toFixed(2));
    const length = chartData.attributes.ProfileLength.toFixed(2);
    const dataXLength = this.calcLengthXData(dataXCoord, dataYCoord, dataZCoord, length);
    return dataZCoord.map((z, i) => {
      if (i === 0) { return '0'; }
      return (dataXLength[i] / 1000).toFixed(3) + ' km';
    });
  }

  // calculate length value in meters
  calcLengthXData(dataXCoord: number[], dataYCoord: number[], dataZCoord: number[], length): number[] {
    let lengthInMeters = 0;
    return dataXCoord.map((x, i) => {
      if (i === 0) { return 0; }
      if (i > 0) {
        // calculate length (vector length) based  on Pythagorean theorem
        const l = Math.sqrt(Math.pow((x - dataXCoord[i - 1]), 2) + Math.pow((dataYCoord[i] - dataYCoord[i - 1]), 2));
        lengthInMeters += l;
        return lengthInMeters;
      }

      if (i === (dataXCoord.length - 1)) { return length; }
    });
  }

  removePointGraphic() {
    if (this.previousPoint) {
      this.view.graphics.remove(this.previousPoint);
    }
  }

  createPointGraphic(pointCoordinates) {
    this.removePointGraphic();

    const point = {
      // tslint:disable-next-line: quotemark
      type: "point", // autocasts as /Point
      x: pointCoordinates[0],
      y: pointCoordinates[1],
      spatialReference: this.view.spatialReference
    };

    const graphic = new Graphic({
      geometry: point,
      symbol: Symbols.profileHoverPoint
    });

    this.view.graphics.add(graphic);
    this.previousPoint = graphic;
  }

  resetChart() {
    this.profileChart.data.datasets = [{ data: [] }];
    this.profileChart.data.labels = [];
    this.profileChart.update();
    this.cdr.detectChanges();

  }

  ngOnChanges(changes: SimpleChanges) {
    this.removePointGraphic();
    this.profileChart && this.profileChart.clear();

    // do not init chart if fullscreen value has change,
    // run init only on first time
    this.data && !changes.fullscreen && this.initProfileElevationChart(this.data);
    this.cdr.detectChanges();

    if (!this.data && this.profileChart) {
      this.resetChart();
    }
  }

  ngOnDestroy() {
    this.previousPoint = null;
    this.profileChart.destroy();
  }

}

