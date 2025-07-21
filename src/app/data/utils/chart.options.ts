import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexTooltip
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
};

export type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  title?: ApexTitleSubtitle;
};

export type RadialBarChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
  labels: string[];
  dataLabels?: ApexDataLabels;
};

export const baseHorizontalBarChart: ChartOptions = {
  chart: {
    type: 'bar',
    height: 350
  },
  plotOptions: {
    bar: {
      horizontal: true,
      distributed: true,
      barHeight: '60%',
    }
  },
  dataLabels: {
    enabled: true
  },
  tooltip: {
    y: {
      formatter: (val) => `${val} votos`
    }
  },
  xaxis: {
    categories: [],
    labels: {
      formatter: (val: string | number) => {
        return `👍 ${val}`;
      },
      style: {
        fontSize: '14px'
      }
    }
  },
  series: [{
    name: 'Total',
    data: []
  }]
};

export const baseLineChartOptions: LineChartOptions = {
  series: [
    {
      name: 'Vistas',
      data: []
    }
  ],
  chart: {
    height: 350,
    type: 'line',
    zoom: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  xaxis: {
    categories: []
  },
  tooltip: {
    y: {
      formatter: (val) => `${val} vistas`
    }
  }
};

export const baseRadialProgressChart: RadialBarChartOptions = {
  series: [0], // porcentaje
  chart: {
    height: 280,
    type: 'radialBar',
    offsetY: 0
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '70%',
      },
      dataLabels: {
        name: {
          offsetY: 20,
          show: true,
          color: '#999',
          fontSize: '12px',
          fontWeight: 500
        },
        value: {
          show: true,
          fontSize: '50px',
          fontWeight: 800,
          color: '#000',
          offsetY: -10,
          formatter: (val) => {
            // Mostrar solo el número grande, el texto lo ponemos con 'name'
            return `${val}`;
          }
        }
      }
    }
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'horizontal',
      shadeIntensity: 0.5,
      gradientToColors: ['#00BFFF'],
      inverseColors: true,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 100]
    }
  },
  stroke: {
    lineCap: 'round'
  },
  labels: ['']
};
