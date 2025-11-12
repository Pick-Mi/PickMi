import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoresService } from '../../../core/services/stores.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PickComercio } from '../../../data/interfaces/comercios';

@Component({
  selector: 'app-stores-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stores-list.component.html',
  styleUrl: './stores-list.component.scss'
})
export class StoresListComponent implements OnInit {
  negocios: PickComercio[] = [];
  loading = false;
  error: string | null = null;

  constructor(private storesService: StoresService, private loaderService: LoaderService) {}

  async ngOnInit(): Promise<void> {
    await this.cargarNegocios();
  }

  get negociosActivos(): number {
    return this.negocios.filter(n => n.estatus === 'activo').length;
  }

  async cargarNegocios(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.loaderService.show();

    try {
      const { comercios, error } = await this.storesService.listarComercios();

      if (error) {
        this.error = 'No se pudieron cargar los negocios. Intenta nuevamente.';
        this.negocios = [];
        return;
      }

      this.negocios = comercios;
    } catch (err) {
      console.error('Error al cargar negocios', err);
      this.error = 'Ocurrio un error inesperado. Intenta nuevamente.';
      this.negocios = [];
    } finally {
      this.loading = false;
      this.loaderService.hide();
    }
  }

  trackByNegocio(index: number, negocio: PickComercio): string {
    return negocio.id ?? `${negocio.nombre}-${index}`;
  }
}
