import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ActividadUsuario, PickUsuario } from '../../../data/interfaces/usuarios';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoaderService } from '../../../core/services/loader.service';
import * as sweetAlert from '../../../data/utils/alerts';
import { CommonModule } from '@angular/common';
import { baseHorizontalBarChart, baseLineChartOptions, baseRadialProgressChart, ChartOptions, LineChartOptions, RadialBarChartOptions } from '../../../data/utils/chart.options';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgApexchartsModule, CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  usuario!: PickUsuario | null;
  totalVistas: number = 0;
  totalFavoritos: number = 0;
  vistasPorComercio: { comercio: string; total: number }[] = [];
  favoritosPorComercio: { comercio: string; total: number }[] = [];
  promedioGlobal: number = 0;
  totalComentariosGlobal: number = 0;
  calificacionesPorComercio: {
    comercio: string;
    promedio: number;
    totalComentarios: number;
  }[] = [];
  comercios: { id: string; nombre: string }[] = [];
  comercioSeleccionado: string = '';
  periodo: 'diario' | 'semanal' | 'mensual' = 'diario';
  actividadReciente: ActividadUsuario[] = [];
  diasRestantesPrueba: number = 0;
  tipoPlanActual: string | null = null;
  porcentajePrueba: number = 0;

  //graficos  
  calificacionesDistribucion: { calificacion: number; total: number }[] = [];
  public chartOptions: ChartOptions = {
    ...baseHorizontalBarChart,
    tooltip: {
      y: {
        formatter: (val) => `${val} votos`
      }
    }
  };

  public lineChartOptions: LineChartOptions = {
    ...baseLineChartOptions,
    series: [
      {
        name: 'Vistas',
        data: []
      }
    ],
    xaxis: {
      categories: []
    }
  };

  public radialChartOptions: RadialBarChartOptions = {
    ...baseRadialProgressChart,
    series: [0],
    labels: ['DÍAS RESTANTES']
  };
  
  constructor(private dashboardService: DashboardService, 
              private authService: AuthService, 
              private router: Router, 
              private loaderService: LoaderService) {}

  async ngOnInit(): Promise<void> {
    this.usuario = this.authService.currentUsuario;

    if (!this.usuario?.id) {
      return;
    }

    await this.cargarDashboard();      
    this.comercios = await this.dashboardService.getComercios(this.usuario.id);
  }

  async cargarDashboard() {
    if (!this.usuario?.id) return;   
    this.loaderService.show(); 
    const resumen = await this.dashboardService.getDashboardData(this.usuario.id, this.comercioSeleccionado || undefined);
    
    this.totalVistas = resumen.totalVistas;
    this.totalFavoritos = resumen.totalFavoritos;
    this.promedioGlobal = resumen.promedioGlobal;
    this.totalComentariosGlobal = resumen.totalComentariosGlobal;
    this.calificacionesDistribucion = resumen.calificacionesDistribucion;
    this.calificacionesPorComercio = resumen.calificacionesPorComercio;
    this.vistasPorComercio = resumen.vistasPorComercio;
    this.favoritosPorComercio = resumen.favoritosPorComercio;

    await this.actualizarGraficos();
    await this.cargarTendencia();
    this.loaderService.hide();
  }

  async actualizarGraficos() {
      if (!this.usuario?.id) return;
      const uid = this.usuario.id;
      const ordered = this.calificacionesDistribucion.sort((a, b) => b.calificacion - a.calificacion);
      
      this.chartOptions.series = [{
        name: 'Total',
        data: ordered.map(d => d.total)
      }];

      this.chartOptions.xaxis = {
        categories: ordered.map(d => `👍 ${d.calificacion}`),
      };
      
      this.actividadReciente = await this.dashboardService.getActividadReciente(uid, this.comercioSeleccionado);
      const suscripcion = await this.dashboardService.getDiasRestantesSuscripcion(uid);
      this.diasRestantesPrueba = suscripcion.diasRestantes;
      
      if(suscripcion.tipoPlan == 'prueba') {
        this.tipoPlanActual = 'Prueba Gratuita';
      }else{
        this.tipoPlanActual = 'Plan ' + (suscripcion.tipoPlan || 'Desconocido');
      }
      
      const totalDias = this.getTotalDiasPorPlan(suscripcion.tipoPlan);
      // Cálculo del porcentaje de progreso
      this.porcentajePrueba = 100 - Math.round((this.diasRestantesPrueba / totalDias) * 100);
      // Configurar el gráfico radial
      this.radialChartOptions.series = [this.porcentajePrueba];
      this.radialChartOptions.plotOptions?.radialBar?.dataLabels?.value && 
      (this.radialChartOptions.plotOptions.radialBar.dataLabels.value.formatter = () => {
        return `${this.diasRestantesPrueba}`;
      });
  }

  async cargarTendencia() {
    if (!this.usuario?.id) return;

    let comercioIds: string[] = [];

    if (this.comercioSeleccionado) {
      comercioIds = [this.comercioSeleccionado];
    } else {
      const todos = await this.dashboardService.getComercios(this.usuario.id);
      comercioIds = todos.map(c => c.id);
    }

    const tendencia = await this.dashboardService.getTendenciaVistasPorComercio(comercioIds, this.periodo);
    
    const data = tendencia.length ? tendencia.map(d => d.total) : [0];
    const labels = tendencia.length ? tendencia.map(d => d.fecha) : ['Sin datos'];

    this.lineChartOptions.series = [{ name: 'Vistas', data }];
    this.lineChartOptions.xaxis = { categories: labels };

    setTimeout(() => window.dispatchEvent(new Event('resize')), 10);
  }


  getTotalDiasPorPlan(tipoPlan: string | null): number {
    switch (tipoPlan?.toLowerCase()) {
      case 'mensual':
        return 30;
      case 'prueba':
      default:
        return 90;
    }
  }

  onTabChanged(tab: string) {
    if (tab === 'graficos') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 10); // pequeño delay para asegurarse que se ha hecho visible
    }
  }

  recortar(texto: string, max: number): string {
      return texto.length > max ? texto.substring(0, max) + '...' : texto;
  }

}
