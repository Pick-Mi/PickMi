import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StoresService } from '../../../core/services/stores.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PickComercio } from '../../../data/interfaces/comercios';

type FiltroTab = 'todos' | 'activos' | 'pausados';

@Component({
  selector: 'app-stores-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stores-list.component.html',
  styleUrl: './stores-list.component.scss'
})
export class StoresListComponent implements OnInit {
  negocios: PickComercio[] = [];
  loading = false;
  error: string | null = null;

  filtroTab: FiltroTab = 'todos';
  busqueda = '';
  filtroTipo = 'todos';

  private readonly AVATAR_COLORS = [
    { bg: '#fee2e2', text: '#b91c1c' },
    { bg: '#fce7f3', text: '#be185d' },
    { bg: '#ede9fe', text: '#6d28d9' },
    { bg: '#dbeafe', text: '#1d4ed8' },
    { bg: '#dcfce7', text: '#15803d' },
    { bg: '#fef3c7', text: '#b45309' },
    { bg: '#e0f2fe', text: '#0369a1' },
    { bg: '#fce7f3', text: '#be185d' },
    { bg: '#fee2e2', text: '#c2410c' },
    { bg: '#f0fdf4', text: '#166534' },
  ];

  constructor(
    private storesService: StoresService,
    private loaderService: LoaderService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarNegocios();
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  get totalActivos(): number {
    return this.negocios.filter(n => n.estatus === 'activo').length;
  }

  get totalPausados(): number {
    return this.negocios.filter(n => n.estatus === 'pausado').length;
  }

  get totalPendiente(): number {
    return this.negocios.filter(n => n.estatus === 'inactivo').length;
  }

  get porcentajeActivos(): number {
    if (!this.negocios.length) return 0;
    return Math.round((this.totalActivos / this.negocios.length) * 100);
  }

  // ── Tipo options ───────────────────────────────────────────────────────────
  get tiposDisponibles(): string[] {
    const set = new Set(this.negocios.map(n => n.tipo_comercio_nombre).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  get negociosFiltrados(): PickComercio[] {
    let result = this.negocios;

    if (this.filtroTab === 'activos') result = result.filter(n => n.estatus === 'activo');
    else if (this.filtroTab === 'pausados') result = result.filter(n => n.estatus === 'pausado');

    if (this.filtroTipo !== 'todos') {
      result = result.filter(n => n.tipo_comercio_nombre === this.filtroTipo);
    }

    const q = this.busqueda.trim().toLowerCase();
    if (q) result = result.filter(n => n.nombre.toLowerCase().includes(q));

    return result;
  }

  setFiltroTab(tab: FiltroTab): void {
    this.filtroTab = tab;
  }

  onBusqueda(): void {}

  // ── Display helpers ────────────────────────────────────────────────────────
  trackByNegocio(index: number, n: PickComercio): string {
    return n.id ?? `${n.nombre}-${index}`;
  }

  avatarColor(nombre: string): { bg: string; text: string } {
    return this.AVATAR_COLORS[(nombre || 'A').charCodeAt(0) % this.AVATAR_COLORS.length];
  }

  initiales(nombre: string): string {
    return (nombre || '?').slice(0, 2).toUpperCase();
  }

  formatId(index: number): string {
    return `ID #${String(index + 1).padStart(4, '0')}`;
  }

  estatusLabel(n: PickComercio): string {
    const map: Record<string, string> = { activo: 'Activo', pausado: 'Pausado', inactivo: 'Inactivo' };
    return map[n.estatus ?? ''] ?? n.estatus ?? '—';
  }

  estatusBadgeClass(n: PickComercio): string {
    if (n.estatus === 'activo') return 'sl__badge sl__badge--success';
    if (n.estatus === 'pausado') return 'sl__badge sl__badge--warning';
    return 'sl__badge sl__badge--neutral';
  }

  verPreview(n: PickComercio): void {
    if (!n.id) return;
    this.router.navigate(['/preview/stores', n.id]);
  }

  // ── Load ───────────────────────────────────────────────────────────────────
  async cargarNegocios(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.loaderService.show();
    try {
      const { comercios, error } = await this.storesService.listarComercios();
      if (error) { this.error = 'No se pudieron cargar los negocios.'; this.negocios = []; return; }
      this.negocios = comercios;
    } catch (err) {
      console.error('Error al cargar negocios', err);
      this.error = 'Ocurrió un error inesperado.';
      this.negocios = [];
    } finally {
      this.loading = false;
      this.loaderService.hide();
    }
  }
}
