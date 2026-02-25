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
import { MensajeSolicitud } from '../../../data/interfaces/mensajes';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgApexchartsModule, CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  mensajes: MensajeSolicitud[] = [];
  activeTab: 'resumen' | 'graficos' = 'resumen';
  showCounters = true;
  showGraficos = true;

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
  
  totalPropietarios = 0;
  totalLocales = 0;
  totalResenas = 0;
  totalUsuarios = 0;

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
    labels: ['DIAS RESTANTES']
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
    const [counters] = await Promise.all([
      this.dashboardService.getAdminCounters()
    ]);
    
    this.totalPropietarios = counters.propietarios;
    this.totalLocales = counters.locales;
    this.totalResenas = counters.resenas;
    this.totalUsuarios = counters.usuarios;

    this.cargarMensajes();
    
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
        categories: ordered.map(d => `ðŸ‘ ${d.calificacion}`),
      };
      
      this.actividadReciente = await this.dashboardService.getActividadReciente(uid, this.comercioSeleccionado);
      
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

  get showLocalesFilter(): boolean {
    return !!this.comercios?.length;
  }

  setTab(tab: 'resumen' | 'graficos') {
    this.activeTab = tab;
    if (tab === 'graficos') {
      this.onTabChanged('graficos');
    }
  }

  onTabChanged(tab: string) {
    if (tab === 'graficos') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 10); // pequeÃ±o delay para asegurarse que se ha hecho visible
    }
  }

  recortar(texto: string, max: number): string {
      return texto.length > max ? texto.substring(0, max) + '...' : texto;
  }

  async cargarMensajes(): Promise<void> {
    this.mensajes = await this.dashboardService.obtenerMensajesSolicitudes();
  }

}

