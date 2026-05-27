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

  readonly groups = [
    {
      label: 'Sitio público',
      subtitle: 'Lo que ven los visitantes y comercios potenciales',
      items: [
        {
          label: 'Sitio en mantenimiento',
          icon: 'fa-solid fa-screwdriver-wrench',
          description: 'Gestiona el estado del portal y los mensajes que ven los visitantes.',
          link: '/configurations/maintenance',
        },
        {
          label: 'Slide del Home',
          icon: 'fa-solid fa-house',
          description: 'Actualiza el carrusel principal con campañas y noticias destacadas.',
          link: '/configurations/slides/home',
        },
        {
          label: 'Slide de Negocios',
          icon: 'fa-solid fa-building',
          description: 'Controla los banners que aparecen en la sección de negocios.',
          link: '/configurations/slides/business',
        },
      ]
    },
    {
      label: 'Catálogo y comercio',
      subtitle: 'Estructura que alimenta a las plataformas hermanas',
      items: [
        {
          label: 'Tipos de negocio',
          icon: 'fa-solid fa-sitemap',
          description: 'Administra los tipos disponibles para clasificar los comercios.',
          link: '/configurations/business-type',
        },
        {
          label: 'Categorías',
          icon: 'fa-solid fa-tags',
          description: 'Edita las categorías principales y subcategorías del catálogo.',
          link: '/configurations/category',
        },
        {
          label: 'Promociones',
          icon: 'fa-solid fa-ticket',
          description: 'Administra promociones y descuentos visibles en toda la plataforma.',
          link: '/configurations/promotions/list',
        },
      ]
    },
    {
      label: 'Monetización',
      subtitle: 'Planes y reglas comerciales',
      items: [
        {
          label: 'Planes',
          icon: 'fa-solid fa-layer-group',
          description: 'Configura precios, límites y features de los planes para propietarios.',
          link: '/configurations/plans',
        },
      ]
    },
  ];

  goTo(link: string): void {
    if (!link) return;
    this.router.navigate([link]);
  }
}
