import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PropietarioListado, TipoUsuario } from '../../../data/interfaces/usuarios';
import { Router } from '@angular/router';

type FiltroTab = 'todos' | 'trial' | 'verificacion';

@Component({
  selector: 'app-owners-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owners-list.component.html',
  styleUrl: './owners-list.component.scss'
})
export class OwnersListComponent implements OnInit {
  propietarios: PropietarioListado[] = [];
  loading = false;
  error: string | null = null;
  accionandoId: string | null = null;

  filtroTab: FiltroTab = 'todos';
  busqueda = '';
  pagina = 1;
  readonly pageSize = 10;

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
    this.pagina = 1;
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
      this.error = 'Ocurrió un error inesperado.';
      this.propietarios = [];
    } finally {
      this.loading = false;
      this.loaderService.hide();
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  get totalConPlanPagado(): number {
    return this.propietarios.filter(p => p.plan_estado === 'activo' && p.plan_origen !== 'gratis').length;
  }

  get totalTrial(): number {
    return this.propietarios.filter(p => p.en_periodo_prueba === true).length;
  }

  get totalVerificacion(): number {
    return this.propietarios.filter(p => p.onboarding_status === 'verificacion').length;
  }

  get porcentajePagado(): number {
    if (!this.propietarios.length) return 0;
    return Math.round((this.totalConPlanPagado / this.propietarios.length) * 100);
  }

  get diasMinTrial(): number | null {
    const dias = this.propietarios
      .filter(p => p.en_periodo_prueba && p.plan_activo_fin)
      .map(p => this.calcDiasRestantes(p))
      .filter((d): d is number => d !== null && d >= 0);
    return dias.length ? Math.min(...dias) : null;
  }

  // ── Filters & pagination ───────────────────────────────────────────────────
  get propietariosFiltrados(): PropietarioListado[] {
    let result = this.propietarios;

    if (this.filtroTab === 'trial') {
      result = result.filter(p => p.en_periodo_prueba === true);
    } else if (this.filtroTab === 'verificacion') {
      result = result.filter(p => p.onboarding_status === 'verificacion');
    }

    const q = this.busqueda.trim().toLowerCase();
    if (q) {
      result = result.filter(p =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    }

    return result;
  }

  get totalFiltrados(): number {
    return this.propietariosFiltrados.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalFiltrados / this.pageSize);
  }

  get propietariosPaginados(): PropietarioListado[] {
    const start = (this.pagina - 1) * this.pageSize;
    return this.propietariosFiltrados.slice(start, start + this.pageSize);
  }

  setFiltroTab(tab: FiltroTab): void {
    this.filtroTab = tab;
    this.pagina = 1;
  }

  onBusqueda(): void {
    this.pagina = 1;
  }

  paginaAnterior(): void {
    if (this.pagina > 1) this.pagina--;
  }

  paginaSiguiente(): void {
    if (this.pagina < this.totalPaginas) this.pagina++;
  }

  // ── Display helpers ────────────────────────────────────────────────────────
  trackByPropietario(index: number, p: PropietarioListado): string {
    return p.propietario_id ?? `${p.email}-${index}`;
  }

  avatarColor(nombre: string): { bg: string; text: string } {
    const code = (nombre || 'A').charCodeAt(0);
    return this.AVATAR_COLORS[code % this.AVATAR_COLORS.length];
  }

  initiales(p: PropietarioListado): string {
    return `${(p.nombre || '?').charAt(0)}${(p.apellido || '').charAt(0)}`.toUpperCase();
  }

  estatusLabel(p: PropietarioListado): string {
    if (p.onboarding_status === 'verificacion') return 'Verificación';
    if (p.estatus === 'activo') return 'Activo';
    return p.estatus || '—';
  }

  estatusBadgeClass(p: PropietarioListado): string {
    if (p.onboarding_status === 'verificacion') return 'ol__badge ol__badge--info';
    if (p.estatus === 'activo') return 'ol__badge ol__badge--success';
    return 'ol__badge ol__badge--neutral';
  }

  planCicloHint(p: PropietarioListado): string {
    if (p.en_periodo_prueba && p.plan_activo_fin) {
      const dias = this.calcDiasRestantes(p);
      return dias !== null ? `Trial · ${dias} días restantes` : 'Trial';
    }
    if (p.plan_estado === 'activo') {
      if (p.plan_origen === 'gratis' || !p.plan_activo_fin) return 'Plan gratuito sin vencimiento';
      const fin = new Date(p.plan_activo_fin);
      const mes = fin.toLocaleString('es', { month: 'short' });
      return `Pago próximo · ${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${fin.getDate()}`;
    }
    return '';
  }

  private calcDiasRestantes(p: PropietarioListado): number | null {
    if (!p.plan_activo_fin) return null;
    const diff = Math.floor((new Date(p.plan_activo_fin).getTime() - Date.now()) / 86400000);
    return isNaN(diff) ? null : diff;
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  tieneSolicitudPlan(p: PropietarioListado): boolean {
    return Boolean(p.plan_solicitado_id || p.plan_estado === 'pendiente_aprobacion' || p.plan_estado === 'pendiente_pago');
  }

  puedeTomarAccion(p: PropietarioListado): boolean {
    return p.plan_estado === 'pendiente_aprobacion' && !!p.propietario_id;
  }

  async aprobarSolicitud(p: PropietarioListado): Promise<void> {
    if (!this.puedeTomarAccion(p)) return;
    this.accionandoId = p.propietario_id;
    this.loaderService.show();
    try {
      const { error } = await this.profileService.aprobarPlanPropietario(p.propietario_id, p.plan_solicitado_id ?? null);
      if (error) { this.error = 'No se pudo aprobar la solicitud.'; return; }
      await this.cargarPropietarios();
    } catch (err) {
      console.error('Error al aprobar solicitud', err);
      this.error = 'Ocurrió un error al aprobar la solicitud.';
    } finally {
      this.accionandoId = null;
      this.loaderService.hide();
    }
  }

  async rechazarSolicitud(p: PropietarioListado): Promise<void> {
    if (!this.puedeTomarAccion(p)) return;
    this.accionandoId = p.propietario_id;
    this.loaderService.show();
    try {
      const { error } = await this.profileService.rechazarSolicitudPlan(p.propietario_id);
      if (error) { this.error = 'No se pudo rechazar la solicitud.'; return; }
      await this.cargarPropietarios();
    } catch (err) {
      console.error('Error al rechazar solicitud', err);
      this.error = 'Ocurrió un error al rechazar la solicitud.';
    } finally {
      this.accionandoId = null;
      this.loaderService.hide();
    }
  }

  verDetalle(p: PropietarioListado): void {
    if (!p.propietario_id) return;
    this.router.navigate(['/owners', p.propietario_id]);
  }
}
