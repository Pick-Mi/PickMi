import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BusinessTypeService } from '../../../core/services/business-type.service';
import { BusinessType } from '../../../data/interfaces/business-type';
import * as sweetAlert from '../../../data/utils/alerts';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { ToggleSwitchComponent } from '../../../shared/components/toggle-switch/toggle-switch.component';

@Component({
  selector: 'app-business-type',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent, ToggleSwitchComponent],
  templateUrl: './business-type.component.html',
  styleUrls: ['./business-type.component.scss']
})
export class BusinessTypeComponent implements OnInit {
  types: BusinessType[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;

  iconOptions = [
    { name: 'fa-utensils', label: '\uf2e7  fa-utensils' },
    { name: 'fa-store', label: '\uf54e  fa-store' },
    { name: 'fa-wand-magic-sparkles', label: '\uf72b  fa-wand-magic-sparkles' }
  ];

  typeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private businessTypeService: BusinessTypeService
  ) {
    this.buildForm();
  }

  private buildForm(): void {
    this.typeForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
    icono: [this.iconOptions[0].name, Validators.required],
      estado: [true]
    });
  }
  ngOnInit(): void {
    this.cargarTipos();
  }

  async cargarTipos(): Promise<void> {
    this.loading = true;
    try {
      this.types = await this.businessTypeService.obtenerTipos();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudieron cargar los tipos de negocio');
    } finally {
      this.loading = false;
    }
  }

  editarTipo(tipo: BusinessType): void {
    this.editingId = tipo.id ?? null;
    this.typeForm.setValue({
      nombre: tipo.nombre,
      icono: tipo.icono || this.iconOptions[0].name,
      estado: tipo.estado ?? true
    });
  }

  cancelarEdicion(): void {
    this.editingId = null;
    this.typeForm.reset({
      nombre: '',
      icono: this.iconOptions[0].name,
      estado: true
    });
  }

  async guardarTipo(): Promise<void> {
    if (this.typeForm.invalid) {
      this.typeForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    try {
      const payload = this.typeForm.value as BusinessType;
      if (this.editingId) {
        await this.businessTypeService.actualizarTipo(this.editingId, payload);
        sweetAlert.alertSuccess('Tipo actualizado correctamente');
      } else {
        await this.businessTypeService.crearTipo(payload);
        sweetAlert.alertSuccess('Tipo creado correctamente');
      }
      await this.cargarTipos();
      this.cancelarEdicion();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo guardar el tipo de negocio');
    } finally {
      this.saving = false;
    }
  }

  async eliminarTipo(tipo: BusinessType): Promise<void> {
    if (!tipo.id) {
      return;
    }
    const confirmed = confirm(`¿Eliminar el tipo "${tipo.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmed) {
      return;
    }
    try {
      await this.businessTypeService.eliminarTipo(tipo.id);
      this.types = this.types.filter(t => t.id !== tipo.id);
      sweetAlert.alertSuccess('Tipo eliminado');
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo eliminar el tipo de negocio');
    }
  }

  async alternarEstado(tipo: BusinessType): Promise<void> {
    if (!tipo.id) {
      return;
    }
    const nuevoEstado = !(tipo.estado ?? true);
    try {
      await this.businessTypeService.cambiarEstado(tipo.id, nuevoEstado);
      tipo.estado = nuevoEstado;
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo cambiar el estado del tipo');
    }
  }
}
