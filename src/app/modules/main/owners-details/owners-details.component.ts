import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { ComercioResumen, PropietarioDetalle } from '../../../data/interfaces/usuarios';

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
  imports: [CommonModule, RouterModule],
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
    private profileService: ProfileService
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
    this.loading = false;
  }

  regresar(): void {
    this.router.navigate(['/owners-list']);
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
      case PlanEstadoView.Trial:
        return 'badge badge--warning';
      case PlanEstadoView.Activo:
        return 'badge badge--success';
      case PlanEstadoView.Expirado:
        return 'badge badge--danger';
      case PlanEstadoView.PendienteCambio:
        return 'badge badge--info';
      default:
        return 'badge';
    }
  }

  get stores(): ComercioResumen[] {
    return this.propietario?.comercios ?? [];
  }

  onPreview(store: ComercioResumen): void {
    if (!store?.id) return;
    this.router.navigate(['/preview/stores', store.id]);
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
