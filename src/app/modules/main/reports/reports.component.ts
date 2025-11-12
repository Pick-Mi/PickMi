import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ReportOption {
  id: string;
  title: string;
  description: string;
  iconClass: string;
  chip?: string;
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
      chip: 'Beta'
    },
    {
      id: 'engagement',
      title: 'Interacciones y engagement',
      description: 'Vistas, favoritos y mensajes por negocio. Útil para demostrar valor a los propietarios.',
      iconClass: 'fa-solid fa-chart-column'
    },
    {
      id: 'reputation',
      title: 'Reputación y reseñas',
      description: 'Distribución de calificaciones, comentarios pendientes y tiempos de respuesta.',
      iconClass: 'fa-solid fa-comments'
    },
    {
      id: 'clients',
      title: 'Comportamiento de clientes',
      description: 'Búsquedas populares, rutas de descubrimiento y comercios con mayor tráfico.',
      iconClass: 'fa-solid fa-users'
    },
    {
      id: 'finance',
      title: 'Ingresos y planes',
      description: 'MRR/ARR por plan, facturas vencidas y proyección de renovaciones.',
      iconClass: 'fa-solid fa-wallet'
    },
    {
      id: 'geo',
      title: 'Mapa de cobertura',
      description: 'Concentración de negocios y clientes por ciudad o categoría para detectar oportunidades.',
      iconClass: 'fa-solid fa-map-location-dot'
    }
  ];

  ejecutarReporte(reporte: ReportOption): void {
    console.log(`Reporte ${reporte.id} en preparación`);
  }
}
