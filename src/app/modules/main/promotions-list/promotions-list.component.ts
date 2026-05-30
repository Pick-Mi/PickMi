import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PromotionsService } from '../../../core/services/promotions.service';
import { PickPromocion } from '../../../data/interfaces/promotions';
import { StoresService } from '../../../core/services/stores.service';
import { PickComercio } from '../../../data/interfaces/comercios';
import * as sweetAlert from '../../../data/utils/alerts';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { PromoCardComponent } from '../../../shared/components/promo-card/promo-card.component';

@Component({
  selector: 'app-promotions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BackButtonComponent, PromoCardComponent],
  templateUrl: './promotions-list.component.html',
  styleUrls: ['./promotions-list.component.scss']
})
export class PromotionsListComponent implements OnInit {
  private promotionsService = inject(PromotionsService);
  private router = inject(Router);
  private storesService = inject(StoresService);

  promotions: PickPromocion[] = [];
  comercios: PickComercio[] = [];
  filtered: PickPromocion[] = [];
  loading = false;
  processingId: string | null = null;
  busqueda = '';
  estatusFiltro: 'todos' | 'activo' | 'inactivo' = 'todos';
  error: string | null = null;
  previewPromo: PickPromocion | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  get promocionesActivas(): number {
    return this.promotions.filter(p => p.estatus === 'activo').length;
  }

  get promocionesConImagen(): number {
    return this.promotions.filter(p => !!p.imagen_url).length;
  }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const [promos, comerciosResp] = await Promise.all([
        this.promotionsService.listar(),
        this.storesService.listarComercios(),
      ]);

      this.promotions = promos;
      if (!comerciosResp.error) {
        this.comercios = comerciosResp.comercios;
      }
      this.aplicarFiltros();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudieron cargar las promociones.');
      this.error = 'No se pudieron cargar las promociones.';
      this.promotions = [];
      this.filtered = [];
    } finally {
      this.loading = false;
    }
  }

  edit(promo: PickPromocion): void {
    // Reutiliza el formulario existente
    this.router.navigate(['/configurations/promotions'], { state: { promo } });
  }

  async toggleStatus(promo: PickPromocion): Promise<void> {
    if (!promo.id) return;
    this.processingId = promo.id;
    const nextStatus = promo.estatus === 'inactivo' ? 'activo' : 'inactivo';

    try {
      await this.promotionsService.actualizar(promo.id, { estatus: nextStatus });
      promo.estatus = nextStatus;
      sweetAlert.alertSuccess(`Promoción ${nextStatus === 'activo' ? 'activada' : 'desactivada'}.`);
      this.aplicarFiltros();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo actualizar el estado.');
    } finally {
      this.processingId = null;
    }
  }

  async delete(promo: PickPromocion): Promise<void> {
    if (!promo.id) return;

    const result = await Swal.fire({
      title: `¿Eliminar "${promo.titulo}"?`,
      text: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (!result.isConfirmed) return;

    this.processingId = promo.id;
    try {
      await this.promotionsService.eliminar(promo.id);
      this.promotions = this.promotions.filter(p => p.id !== promo.id);
      this.aplicarFiltros();
      sweetAlert.alertSuccess('Promoción eliminada.');
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo eliminar la promoción.');
    } finally {
      this.processingId = null;
    }
  }

  abrirPreview(promo: PickPromocion): void { this.previewPromo = promo; }
  cerrarPreview(): void { this.previewPromo = null; }

  tipoBadgeClass(tipo?: string | null): string {
    const map: Record<string, string> = {
      descuento: 'prl__tipo--descuento',
      regalo:    'prl__tipo--regalo',
      '2x1':     'prl__tipo--2x1',
      bundle:    'prl__tipo--bundle',
    };
    return map[tipo ?? ''] ?? 'prl__tipo--default';
  }

  tipoLabel(tipo?: string | null): string {
    const map: Record<string, string> = {
      descuento: 'Descuento', regalo: 'Regalo', '2x1': '2×1', bundle: 'Bundle'
    };
    return map[tipo ?? ''] ?? 'Promoción';
  }

  comercioNombre(id: string): string {
    const comercio = this.comercios.find(c => c.id === id);
    return comercio?.nombre || id;
  }

  aplicarFiltros(): void {
    const term = this.busqueda.trim().toLowerCase();
    this.filtered = this.promotions.filter(promo => {
      const coincideBusqueda =
        !term ||
        promo.titulo.toLowerCase().includes(term) ||
        (promo.codigo_promocion || '').toLowerCase().includes(term) ||
        this.comercioNombre(promo.comercio_id).toLowerCase().includes(term);

      const coincideEstatus =
        this.estatusFiltro === 'todos' || promo.estatus === this.estatusFiltro;

      return coincideBusqueda && coincideEstatus;
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.estatusFiltro = 'todos';
    this.aplicarFiltros();
  }
}
