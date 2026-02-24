import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../core/services/profile.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PropietarioListado, TipoUsuario } from '../../../data/interfaces/usuarios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-owners-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owners-list.component.html',
  styleUrl: './owners-list.component.scss'
})
export class OwnersListComponent implements OnInit {
  propietarios: PropietarioListado[] = [];
  loading = false;
  error: string | null = null;
  accionandoId: string | null = null;

  constructor(
    private profileService: ProfileService,
    private loaderService: LoaderService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarPropietarios();
  }

  async cargarPropietarios(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.loaderService.show();

    try {
      const { data, error } = await this.profileService.listarPropietariosConPlan();

      if (error) {
        this.error = 'No se pudieron cargar los propietarios. Intenta nuevamente.';
        this.propietarios = [];
        return;
      }

      this.propietarios = data.filter(p => p.tipo_usuario === TipoUsuario.PROPIETARIO);
    } catch (err) {
      console.error('Error al cargar propietarios', err);
      this.error = 'Ocurrio un error inesperado. Intenta nuevamente.';
      this.propietarios = [];
    } finally {
      this.loading = false;
      this.loaderService.hide();
    }
  }

  trackByPropietario(index: number, propietario: PropietarioListado): string {
    return propietario.id ?? `${propietario.email ?? 'sin-email'}-${index}`;
  }

  tieneSolicitudPlan(propietario: PropietarioListado): boolean {
    return Boolean(
      propietario.plan_solicitado_id ||
      propietario.plan_estado === 'pendiente_aprobacion' ||
      propietario.plan_estado === 'pendiente_pago'
    );
  }

  puedeTomarAccion(propietario: PropietarioListado): boolean {
    return propietario.plan_estado === 'pendiente_aprobacion' && !!propietario.propietario_id;
  }

  diasRestantes(propietario: PropietarioListado): number | null {
    if (!propietario.plan_activo_fin) return null;
    const fin = new Date(propietario.plan_activo_fin).getTime();
    const ahora = Date.now();
    const diff = Math.floor((fin - ahora) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? null : diff;
  }

  async aprobarSolicitud(propietario: PropietarioListado): Promise<void> {
    if (!this.puedeTomarAccion(propietario)) return;
    this.accionandoId = propietario.propietario_id;
    this.loaderService.show();
    try {
      const { error } = await this.profileService.aprobarPlanPropietario(
        propietario.propietario_id,
        propietario.plan_solicitado_id ?? null
      );
      if (error) {
        this.error = 'No se pudo aprobar la solicitud. Intenta nuevamente.';
        return;
      }
      await this.cargarPropietarios();
    } catch (err) {
      console.error('Error al aprobar solicitud de plan', err);
      this.error = 'Ocurrió un error al aprobar la solicitud.';
    } finally {
      this.accionandoId = null;
      this.loaderService.hide();
    }
  }

  async rechazarSolicitud(propietario: PropietarioListado): Promise<void> {
    if (!this.puedeTomarAccion(propietario)) return;
    this.accionandoId = propietario.propietario_id;
    this.loaderService.show();
    try {
      const { error } = await this.profileService.rechazarSolicitudPlan(propietario.propietario_id);
      if (error) {
        this.error = 'No se pudo rechazar la solicitud. Intenta nuevamente.';
        return;
      }
      await this.cargarPropietarios();
    } catch (err) {
      console.error('Error al rechazar solicitud de plan', err);
      this.error = 'Ocurrió un error al rechazar la solicitud.';
    } finally {
      this.accionandoId = null;
      this.loaderService.hide();
    }
  }

  verDetalle(propietario: PropietarioListado): void {
    if (!propietario.propietario_id) return;
    this.router.navigate(['/owners', propietario.propietario_id]);
  }
}
