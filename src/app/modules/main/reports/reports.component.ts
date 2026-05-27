import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ReportOption {
  id: string;
  title: string;
  description: string;
  iconClass: string;
  iconBg: string;
  iconColor: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  reportes: ReportOption[] = [
    {
      id: 'growth',
      title: 'Crecimiento de negocios',
      description: 'Altas/bajas mensuales, renovaciones y cancelaciones para medir la salud de la plataforma.',
      iconClass: 'fa-solid fa-chart-line',
      iconBg: '#ede9fe', iconColor: '#6d28d9'
    },
    {
      id: 'engagement',
      title: 'Interacciones y engagement',
      description: 'Vistas, favoritos y mensajes por negocio. Útil para demostrar valor a los propietarios.',
      iconClass: 'fa-solid fa-chart-column',
      iconBg: '#dbeafe', iconColor: '#1d4ed8'
    },
    {
      id: 'reputation',
      title: 'Reputación y reseñas',
      description: 'Distribución de calificaciones, comentarios pendientes y tiempos de respuesta.',
      iconClass: 'fa-solid fa-comments',
      iconBg: '#fef3c7', iconColor: '#b45309'
    },
    {
      id: 'clients',
      title: 'Comportamiento de clientes',
      description: 'Búsquedas populares, rutas de descubrimiento y comercios con mayor tráfico.',
      iconClass: 'fa-solid fa-users',
      iconBg: '#dcfce7', iconColor: '#15803d'
    },
    {
      id: 'finance',
      title: 'Ingresos y planes',
      description: 'MRR/ARR por plan, facturas vencidas y proyección de renovaciones.',
      iconClass: 'fa-solid fa-wallet',
      iconBg: '#94a3b8', iconColor: '#1e293b'
    },
    {
      id: 'geo',
      title: 'Mapa de cobertura',
      description: 'Concentración de negocios y clientes por ciudad o categoría para detectar oportunidades.',
      iconClass: 'fa-solid fa-map-location-dot',
      iconBg: '#fce7f3', iconColor: '#be185d'
    }
  ];

  ejecutarReporte(reporte: ReportOption): void {
    console.log(`Reporte ${reporte.id} en preparación`);
  }
}
