import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { LoaderService } from '../../../core/services/loader.service';
import { ComercioResumen, PropietarioDetalle } from '../../../data/interfaces/usuarios';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

enum PlanEstadoView {
  SinPlan = 'sin_plan',
  Trial = 'trial',
  Activo = 'activo',
  Expirado = 'expirado',
  PendienteCambio = 'pendiente_cambio'
}

@Component({
  selector: 'app-owners-details',
  standalone: true,
  imports: [CommonModule, RouterModule, BackButtonComponent],
  templateUrl: './owners-details.component.html',
  styleUrl: './owners-details.component.scss'
})
export class OwnersDetailsComponent implements OnInit {
  propietario: PropietarioDetalle | null = null;
  loading = false;
  error: string | null = null;
  estadoView: PlanEstadoView = PlanEstadoView.SinPlan;
  diasRestantesValor: number | null = null;
  actionLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private loaderService: LoaderService
  ) {}

  async ngOnInit(): Promise<void> {
    const propietarioId = this.route.snapshot.paramMap.get('id');
    if (!propietarioId) {
      this.error = 'Propietario no encontrado';
      return;
    }
    await this.cargarPropietario(propietarioId);
  }

  async cargarPropietario(propietarioId: string): Promise<void> {
    this.loading = true;
    this.error = null;
    this.loaderService.show();
    try {
      const { data, error } = await this.profileService.obtenerDetallePropietario(propietarioId);
      if (error || !data) {
        this.error = error ?? 'No se pudo cargar el propietario';
        this.propietario = null;
        this.estadoView = PlanEstadoView.SinPlan;
        this.diasRestantesValor = null;
      } else {
        this.propietario = data;
        this.estadoView = this.calcularEstadoPlan(data);
        this.diasRestantesValor = this.calcularDiasRestantes(data.plan_activo_fin);
      }
    } finally {
      this.loading = false;
      this.loaderService.hide();
    }
  }

  diasRestantes(): number | null {
    return this.diasRestantesValor;
  }

  async aprobarPlan(): Promise<void> {
    if (!this.propietario?.propietario_id) return;
    this.actionLoading = true;
    const { error } = await this.profileService.aprobarPlanPropietario(
      this.propietario.propietario_id,
      this.propietario.plan_solicitado_id ?? null
    );
    if (error) {
      this.error = error;
    } else {
      await this.cargarPropietario(this.propietario.propietario_id);
    }
    this.actionLoading = false;
  }

  async rechazarSolicitud(): Promise<void> {
    if (!this.propietario?.propietario_id) return;
    this.actionLoading = true;
    const { error } = await this.profileService.rechazarSolicitudPlan(this.propietario.propietario_id);
    if (error) {
      this.error = error;
    } else {
      await this.cargarPropietario(this.propietario.propietario_id);
    }
    this.actionLoading = false;
  }

  badgeLabel(): string {
    switch (this.estadoView) {
      case PlanEstadoView.Trial:
        return 'Trial';
      case PlanEstadoView.Activo:
        return 'Activo';
      case PlanEstadoView.Expirado:
        return 'Expirado';
      case PlanEstadoView.PendienteCambio:
        return 'Cambio solicitado';
      default:
        return 'Sin plan';
    }
  }

  badgeClass(): string {
    switch (this.estadoView) {
      case PlanEstadoView.Trial:       return 'od__row-badge od__row-badge--warning';
      case PlanEstadoView.Activo:      return 'od__row-badge od__row-badge--success';
      case PlanEstadoView.Expirado:    return 'od__row-badge od__row-badge--danger';
      case PlanEstadoView.PendienteCambio: return 'od__row-badge od__row-badge--info';
      default:                         return 'od__row-badge od__row-badge--neutral';
    }
  }

  get stores(): ComercioResumen[] {
    return this.propietario?.comercios ?? [];
  }

  private readonly AVATAR_COLORS = [
    { bg: '#fee2e2', text: '#b91c1c' },
    { bg: '#fce7f3', text: '#be185d' },
    { bg: '#ede9fe', text: '#6d28d9' },
    { bg: '#dbeafe', text: '#1d4ed8' },
    { bg: '#dcfce7', text: '#15803d' },
    { bg: '#fef3c7', text: '#b45309' },
    { bg: '#e0f2fe', text: '#0369a1' },
    { bg: '#f3e8ff', text: '#7e22ce' },
  ];

  get avatarColors(): { bg: string; text: string } {
    const nombre = this.propietario?.nombre || 'A';
    return this.AVATAR_COLORS[nombre.charCodeAt(0) % this.AVATAR_COLORS.length];
  }

  get initiales(): string {
    const n = this.propietario;
    if (!n) return '?';
    return `${(n.nombre || '?').charAt(0)}${(n.apellido || '').charAt(0)}`.toUpperCase();
  }

  onPreview(store: ComercioResumen): void {
    if (!store?.id) return;
    this.router.navigate(['/preview/stores', store.id]);
  }

  stripHtml(html: string | null | undefined): string {
    if (!html) return 'Sin descripción aún.';
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || 'Sin descripción aún.').replace(/ /g, ' ');
  }

  private calcularEstadoPlan(data: PropietarioDetalle): PlanEstadoView {
    // Prioridad: solicitud pendiente > trial > activo > expirado > sin plan
    if (data.plan_solicitado_id) return PlanEstadoView.PendienteCambio;

    const fin = data.plan_activo_fin ? new Date(data.plan_activo_fin).getTime() : null;
    const ahora = Date.now();

    if (data.en_periodo_prueba) return PlanEstadoView.Trial;
    if (fin && fin >= ahora) return PlanEstadoView.Activo;
    if (fin && fin < ahora) return PlanEstadoView.Expirado;

    return PlanEstadoView.SinPlan;
  }

  private calcularDiasRestantes(finIso?: string | null): number | null {
    if (!finIso) return null;
    const fin = new Date(finIso).getTime();
    const diff = Math.floor((fin - Date.now()) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? null : diff;
  }
}
