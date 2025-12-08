import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlansService } from '../../../core/services/plans.service';
import { PickPlan } from '../../../data/interfaces/planes';
import * as sweetAlert from '../../../data/utils/alerts';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

interface LimitEntry {
  key: string;
  value: number | null;
}

interface FeatureEntry {
  key: string;
  value: boolean;
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BackButtonComponent],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {
  plans: PickPlan[] = [];
  loading = false;
  saving = false;
  editingId: string | null = null;

  planForm!: FormGroup;
  limitEntries: LimitEntry[] = [];
  featureEntries: FeatureEntry[] = [];

  monedas = ['USD', 'MXN', 'EUR'];

  constructor(
    private fb: FormBuilder,
    private plansService: PlansService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.cargarPlanes();
  }

  private buildForm(): void {
    this.planForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      slug: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: [''],
      precio_mensual: [0, [Validators.required, Validators.min(0)]],
      moneda: ['USD', Validators.required],
      trial_dias: [0, [Validators.min(0)]],
      es_activo: [true],
      es_default: [false],
      es_trial_default: [false],
    });
  }

  async cargarPlanes(): Promise<void> {
    this.loading = true;
    try {
      this.plans = await this.plansService.listarPlanes();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudieron cargar los planes');
    } finally {
      this.loading = false;
    }
  }

  agregarLimite(): void {
    this.limitEntries.push({ key: '', value: null });
  }

  eliminarLimite(index: number): void {
    this.limitEntries.splice(index, 1);
  }

  agregarFeature(): void {
    this.featureEntries.push({ key: '', value: true });
  }

  eliminarFeature(index: number): void {
    this.featureEntries.splice(index, 1);
  }

  editarPlan(plan: PickPlan): void {
    this.editingId = plan.id ?? null;
    this.planForm.setValue({
      nombre: plan.nombre,
      slug: plan.slug,
      descripcion: plan.descripcion ?? '',
      precio_mensual: plan.precio_mensual,
      moneda: plan.moneda ?? 'USD',
      trial_dias: plan.trial_dias ?? 0,
      es_activo: plan.es_activo ?? true,
      es_default: plan.es_default ?? false,
      es_trial_default: plan.es_trial_default ?? false,
    });

    this.limitEntries = this.toLimitEntries(plan.limites);
    this.featureEntries = this.toFeatureEntries(plan.features);
  }

  cancelarEdicion(): void {
    this.editingId = null;
    this.planForm.reset({
      nombre: '',
      slug: '',
      descripcion: '',
      precio_mensual: 0,
      moneda: 'USD',
      trial_dias: 0,
      es_activo: true,
      es_default: false,
      es_trial_default: false,
    });
    this.limitEntries = [];
    this.featureEntries = [];
  }

  async guardarPlan(): Promise<void> {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    const payload: PickPlan = {
      ...this.planForm.value,
      limites: this.limitEntriesToObject(),
      features: this.featureEntriesToObject(),
    } as PickPlan;

    this.saving = true;
    try {
      if (this.editingId) {
        await this.plansService.actualizarPlan(this.editingId, payload);
        sweetAlert.alertSuccess('Plan actualizado correctamente');
      } else {
        await this.plansService.crearPlan(payload);
        sweetAlert.alertSuccess('Plan creado correctamente');
      }
      await this.cargarPlanes();
      this.cancelarEdicion();
    } catch (error: any) {
      console.error(error);
      sweetAlert.alertError(error?.message || 'No se pudo guardar el plan');
    } finally {
      this.saving = false;
    }
  }

  async eliminarPlan(plan: PickPlan): Promise<void> {
    if (!plan.id) return;
    const confirmado = confirm(`Eliminar el plan "${plan.nombre}"? Esta accion no se puede deshacer.`);
    if (!confirmado) return;

    try {
      await this.plansService.eliminarPlan(plan.id);
      this.plans = this.plans.filter(p => p.id !== plan.id);
      sweetAlert.alertSuccess('Plan eliminado');
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo eliminar el plan');
    }
  }

  onNombreBlur(): void {
    const nombre = this.planForm.get('nombre')?.value || '';
    const slugControl = this.planForm.get('slug');
    if (!slugControl?.value) {
      slugControl?.setValue(this.slugify(nombre));
    }
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  toLimitEntries(limites?: Record<string, number> | null): LimitEntry[] {
    if (!limites) return [];
    return Object.entries(limites).map(([key, value]) => ({
      key,
      value: Number(value),
    }));
  }

  toFeatureEntries(features?: Record<string, boolean> | null): FeatureEntry[] {
    if (!features) return [];
    return Object.entries(features).map(([key, value]) => ({
      key,
      value: Boolean(value),
    }));
  }

  private limitEntriesToObject(): Record<string, number> {
    return this.limitEntries.reduce((acc, item) => {
      if (item.key && item.value !== null) {
        acc[item.key.trim()] = Number(item.value);
      }
      return acc;
    }, {} as Record<string, number>);
  }

  private featureEntriesToObject(): Record<string, boolean> {
    return this.featureEntries.reduce((acc, item) => {
      if (item.key) {
        acc[item.key.trim()] = Boolean(item.value);
      }
      return acc;
    }, {} as Record<string, boolean>);
  }
}
