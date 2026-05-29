import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RetosService } from '../../../core/services/retos.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PickReto, RetoProgreso, TipoReto } from '../../../data/interfaces/retos';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import * as sweetAlert from '../../../data/utils/alerts';

@Component({
  selector: 'app-reto-detail',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  templateUrl: './reto-detail.component.html',
  styleUrls: ['./reto-detail.component.scss']
})
export class RetoDetailComponent implements OnInit {
  reto: PickReto | null = null;
  progreso: RetoProgreso[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private retosService: RetosService,
    private loaderService: LoaderService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading = true;
    this.loaderService.show();
    try {
      [this.reto, this.progreso] = await Promise.all([
        this.retosService.obtenerRetoPorId(id),
        this.retosService.obtenerProgresoReto(id)
      ]);
    } catch {
      sweetAlert.alertError('No se pudo cargar la información del reto.');
    } finally {
      this.loading = false;
      this.loaderService.hide();
    }
  }

  asignando = false;

  async asignarATodos(): Promise<void> {
    if (!this.reto?.reto_id) return;
    this.asignando = true;
    this.loaderService.show();
    try {
      const total = await this.retosService.asignarRetoATodos(this.reto.reto_id);
      if (total > 0) {
        sweetAlert.alertSuccess(`Reto asignado a ${total} cliente${total !== 1 ? 's' : ''}.`);
        this.progreso = await this.retosService.obtenerProgresoReto(this.reto.reto_id);
      } else {
        sweetAlert.alertSuccess('No hay clientes activos para asignar por el momento.');
      }
    } catch {
      sweetAlert.alertError('No se pudo asignar el reto.');
    } finally {
      this.asignando = false;
      this.loaderService.hide();
    }
  }

  get totalParticipantes(): number { return this.progreso.length; }
  get totalCompletados(): number { return this.progreso.filter(p => p.completado).length; }
  get totalEnProgreso(): number { return this.progreso.filter(p => !p.completado && p.progreso > 0).length; }
  get tasaCompletado(): number {
    if (!this.progreso.length) return 0;
    return Math.round((this.totalCompletados / this.progreso.length) * 100);
  }

  porcentajeBarra(p: RetoProgreso): number {
    if (!this.reto?.meta) return 0;
    return Math.min(100, Math.round((p.progreso / this.reto.meta) * 100));
  }

  medallaIcon(index: number): string {
    if (index === 0) return 'fa-trophy rt__medal--gold';
    if (index === 1) return 'fa-medal rt__medal--silver';
    if (index === 2) return 'fa-medal rt__medal--bronze';
    return '';
  }

  tipoBadgeClass(tipo: TipoReto): string {
    const map: Record<TipoReto, string> = {
      bienvenida: 'rd__badge--blue',
      permanente: 'rd__badge--purple',
      evento: 'rd__badge--amber'
    };
    return map[tipo];
  }

  tipoLabel(tipo: TipoReto): string {
    const map: Record<TipoReto, string> = {
      bienvenida: 'Bienvenida',
      permanente: 'Permanente',
      evento: 'Evento'
    };
    return map[tipo];
  }

  initiales(nombre: string, apellido: string): string {
    return `${(nombre || '?').charAt(0)}${(apellido || '').charAt(0)}`.toUpperCase();
  }
}
