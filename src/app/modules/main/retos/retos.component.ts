import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RetosService } from '../../../core/services/retos.service';
import { PickReto, TipoReto } from '../../../data/interfaces/retos';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { ToggleSwitchComponent } from '../../../shared/components/toggle-switch/toggle-switch.component';
import * as sweetAlert from '../../../data/utils/alerts';

type TabFiltro = 'todos' | TipoReto;

@Component({
  selector: 'app-retos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent, ToggleSwitchComponent],
  templateUrl: './retos.component.html',
  styleUrls: ['./retos.component.scss']
})
export class RetosComponent implements OnInit {
  retos: PickReto[] = [];
  loading = false;
  saving = false;
  showForm = false;
  editingId: string | null = null;
  tabActivo: TabFiltro = 'todos';

  form: FormGroup;

  readonly iconOptions = [
    'fa-star', 'fa-trophy', 'fa-medal', 'fa-fire', 'fa-bolt',
    'fa-heart', 'fa-thumbs-up', 'fa-crown', 'fa-gem', 'fa-flag',
    'fa-rocket', 'fa-bullseye', 'fa-gift', 'fa-handshake', 'fa-store'
  ];

  readonly accionOptions = [
    'reseñas', 'favoritos', 'calificar', 'visitas', 'compartidos'
  ];

  constructor(private fb: FormBuilder, private retosService: RetosService, private router: Router) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(120)]],
      descripcion: [''],
      tipo_reto: ['permanente', Validators.required],
      meta: [1, [Validators.required, Validators.min(1)]],
      tipo_accion: ['reseñas', Validators.required],
      periodo_dias: [7],
      dia_reinicio: [0],
      fecha_inicio: [null],
      fecha_fin: [null],
      activo: [true],
      icono: ['fa-star']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarRetos();
  }

  async cargarRetos(): Promise<void> {
    this.loading = true;
    try {
      this.retos = await this.retosService.obtenerRetos();
    } catch (e) {
      sweetAlert.alertError('No se pudieron cargar los retos.');
    } finally {
      this.loading = false;
    }
  }

  get retosFiltrados(): PickReto[] {
    if (this.tabActivo === 'todos') return this.retos;
    return this.retos.filter(r => r.tipo_reto === this.tabActivo);
  }

  get totalActivos(): number { return this.retos.filter(r => r.activo).length; }
  get totalBienvenida(): number { return this.retos.filter(r => r.tipo_reto === 'bienvenida').length; }
  get totalPermanentes(): number { return this.retos.filter(r => r.tipo_reto === 'permanente').length; }
  get totalEventos(): number { return this.retos.filter(r => r.tipo_reto === 'evento').length; }

  get tipoActual(): TipoReto {
    return this.form.get('tipo_reto')?.value as TipoReto;
  }

  abrirNuevo(): void {
    this.editingId = null;
    this.form.reset({
      titulo: '', descripcion: '', tipo_reto: 'permanente',
      meta: 1, tipo_accion: 'reseñas', periodo_dias: 7,
      dia_reinicio: 0, fecha_inicio: null, fecha_fin: null, activo: true, icono: 'fa-star'
    });
    this.showForm = true;
  }

  editar(reto: PickReto): void {
    this.editingId = reto.reto_id ?? null;
    this.form.setValue({
      titulo: reto.titulo,
      descripcion: reto.descripcion ?? '',
      tipo_reto: reto.tipo_reto,
      meta: reto.meta,
      tipo_accion: reto.tipo_accion,
      periodo_dias: reto.periodo_dias ?? 7,
      dia_reinicio: reto.dia_reinicio ?? 0,
      fecha_inicio: reto.fecha_inicio ? reto.fecha_inicio.slice(0, 10) : null,
      fecha_fin: reto.fecha_fin ? reto.fecha_fin.slice(0, 10) : null,
      activo: reto.activo ?? true,
      icono: reto.icono ?? 'fa-star'
    });
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.showForm = false;
    this.editingId = null;
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    try {
      const val = this.form.value;
      const payload: Omit<PickReto, 'reto_id' | 'created_at'> = {
        titulo: val.titulo,
        descripcion: val.descripcion || null,
        tipo_reto: val.tipo_reto,
        meta: val.meta,
        tipo_accion: val.tipo_accion,
        periodo_dias: val.tipo_reto === 'permanente' ? val.periodo_dias : null,
        dia_reinicio: val.tipo_reto === 'permanente' ? val.dia_reinicio : null,
        fecha_inicio: val.tipo_reto === 'evento' ? val.fecha_inicio : null,
        fecha_fin: val.tipo_reto === 'evento' ? val.fecha_fin : null,
        activo: val.activo,
        icono: val.icono || null
      };
      if (this.editingId) {
        await this.retosService.actualizarReto(this.editingId, payload);
        sweetAlert.alertSuccess('Reto actualizado');
      } else {
        await this.retosService.crearReto(payload);
        sweetAlert.alertSuccess('Reto creado');
      }
      await this.cargarRetos();
      this.cancelar();
    } catch (e) {
      sweetAlert.alertError('No se pudo guardar el reto.');
    } finally {
      this.saving = false;
    }
  }

  async eliminar(reto: PickReto): Promise<void> {
    if (!reto.reto_id) return;
    if (!confirm(`¿Eliminar el reto "${reto.titulo}"?`)) return;
    try {
      await this.retosService.eliminarReto(reto.reto_id);
      sweetAlert.alertSuccess('Reto eliminado');
      this.retos = this.retos.filter(r => r.reto_id !== reto.reto_id);
    } catch (e) {
      sweetAlert.alertError('No se pudo eliminar el reto.');
    }
  }

  verDetalle(reto: PickReto): void {
    this.router.navigate(['/configurations/retos', reto.reto_id]);
  }

  async toggleActivo(reto: PickReto): Promise<void> {
    if (!reto.reto_id) return;
    const nuevoEstado = !reto.activo;
    try {
      await this.retosService.actualizarReto(reto.reto_id, { activo: nuevoEstado });
      reto.activo = nuevoEstado;
    } catch (e) {
      sweetAlert.alertError('No se pudo actualizar el reto.');
    }
  }

  tipoBadgeClass(tipo: TipoReto): string {
    const map: Record<TipoReto, string> = {
      bienvenida: 'rt__badge--blue',
      permanente: 'rt__badge--purple',
      evento: 'rt__badge--amber'
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
}
