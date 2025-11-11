import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-configurations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './configurations.component.html',
  styleUrls: ['./configurations.component.scss']
})
export class ConfigurationsComponent {
  constructor(private router: Router) {}

  readonly options = [
    {
      label: 'Sitio en mantenimiento',
      icon: 'bi-tools',
      description: 'Gestiona el estado del portal',
      link: '/configurations/maintenance'
    },
    {
      label: 'Slide Home',
      icon: 'bi-house-door',
      description: 'Actualiza el carrusel principal',
      link: '/configurations/slides/home'
    },
    {
      label: 'Slide Negocios',
      icon: 'bi-building',
      description: 'Controla los banners para negocios',
      link: '/configurations/slides/business'
    },
    {
      label: 'Tipo negocio',
      icon: 'bi-diagram-3',
      description: 'Administra los tipos disponibles',
      link: '/configuraciones/tipos-negocio'
    },
    {
      label: 'Categorías',
      icon: 'bi-tags',
      description: 'Edita las categorías principales',
      link: '/configuraciones/categorias'
    },
    {
      label: 'Subcategorías',
      icon: 'bi-grid',
      description: 'Personaliza las subcategorías',
      link: '/configuraciones/subcategorias'
    },
  ];

  goTo(link: string): void {
    if (!link) {
      return;
    }
    this.router.navigate([link]);
  }
}
