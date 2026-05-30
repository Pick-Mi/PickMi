import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { debounceTime, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import Swal from 'sweetalert2';
import { PromotionsService } from '../../../core/services/promotions.service';
import { PickPromocion, TipoPromocion } from '../../../data/interfaces/promotions';
import { PickComercio } from '../../../data/interfaces/comercios';
import { StoresService } from '../../../core/services/stores.service';
import * as sweetAlert from '../../../data/utils/alerts';
import { PlataformasPickmi } from '../../../data/constants/constants';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageCropperComponent, BackButtonComponent],
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.scss'],
})
export class PromotionsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private promotionsService = inject(PromotionsService);
  private storesService = inject(StoresService);

  promotions: PickPromocion[] = [];
  comercios: PickComercio[] = [];
  loading = false;
  porcentajeDescuento: number | null = null;
  private pctSub?: Subscription;
  saving = false;
  editingId: string | null = null;
  pendingStatePromo: PickPromocion | null = null;

  cropperVisible = false;
  imageChangedEvent: any = null;
  croppedPreview: string | null = null;
  croppedFile?: Blob;
  currentImageUrl: string | null = null;

  // Cropper config — all explicit to avoid ngx-image-cropper v9 input issues
  readonly cropAspectRatio = 1;
  readonly cropMaintainRatio = true;
  readonly cropFormat: 'png' = 'png';
  readonly cropOutput: 'base64' = 'base64';
  readonly cropSize = 900;

  form = this.fb.group({
    tipo_promocion: ['descuento' as TipoPromocion, Validators.required],
    comercio_id: ['', Validators.required],
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
    fecha_inicio: ['', Validators.required],
    fecha_fin: ['', Validators.required],
    precio_original: [null as number | null, [Validators.required, Validators.min(0)]],
    precio_promocion: [null as number | null, [Validators.required, Validators.min(0)]],
    item_regalo: [null as string | null],
    codigo_promocion: [''],
    estatus: ['activo', Validators.required],
  });

  get tipoActual(): TipoPromocion {
    return this.form.get('tipo_promocion')?.value as TipoPromocion;
  }

  get requierePrecioPromo(): boolean {
    return this.tipoActual === 'descuento' || this.tipoActual === 'bundle';
  }

  get requiereItemRegalo(): boolean {
    return this.tipoActual === 'regalo' || this.tipoActual === 'bundle';
  }

  ngOnInit(): void {
    const passed = history.state?.promo as PickPromocion | undefined;
    if (passed?.id) {
      this.pendingStatePromo = passed;
    }
    this.loadData();
    this.setupTipoWatcher();
    this.setupPorcentajeWatcher();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      await Promise.all([this.loadPromotions(), this.loadComercios()]);
      if (this.pendingStatePromo) {
        this.edit(this.pendingStatePromo);
        this.pendingStatePromo = null;
      } else {
        this.setNuevoCodigo();
      }
    } finally {
      this.loading = false;
    }
  }

  private async loadPromotions(): Promise<void> {
    try {
      this.promotions = await this.promotionsService.listar();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudieron cargar las promociones.');
    }
  }

  private async loadComercios(): Promise<void> {
    try {
      const { comercios, error } = await this.storesService.listarComercios();
      if (error) {
        throw new Error(error);
      }
      this.comercios = comercios;
    } catch (error) {
      console.error(error);
      sweetAlert.alertWarning('No se pudieron cargar los comercios.');
    }
  }

  ngOnDestroy(): void {
    this.pctSub?.unsubscribe();
  }

  private setupPorcentajeWatcher(): void {
    this.pctSub = this.form.valueChanges
      .pipe(debounceTime(400))
      .subscribe(val => {
        if (!this.requierePrecioPromo) { this.porcentajeDescuento = null; return; }
        const original = parseFloat(String(val.precio_original ?? 0));
        const promo    = parseFloat(String(val.precio_promocion ?? 0));
        if (!original || original <= 0 || isNaN(promo) || promo < 0 || promo > original) {
          this.porcentajeDescuento = null;
          return;
        }
        this.porcentajeDescuento = Math.round((original - promo) / original * 10000) / 100;
      });
  }

  private setupTipoWatcher(): void {
    this.form.get('tipo_promocion')?.valueChanges.subscribe(() => {
      const precioPromoCtrl = this.form.get('precio_promocion');
      const itemRegaloCtrl  = this.form.get('item_regalo');

      if (this.requierePrecioPromo) {
        precioPromoCtrl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        precioPromoCtrl?.clearValidators();
        precioPromoCtrl?.setValue(null, { emitEvent: false });
      }

      if (this.requiereItemRegalo) {
        itemRegaloCtrl?.setValidators([Validators.required]);
      } else {
        itemRegaloCtrl?.clearValidators();
        itemRegaloCtrl?.setValue(null, { emitEvent: false });
      }

      precioPromoCtrl?.updateValueAndValidity({ emitEvent: false });
      itemRegaloCtrl?.updateValueAndValidity({ emitEvent: false });

      if (!this.requierePrecioPromo) {
        this.porcentajeDescuento = null;
      }
    });
  }

async submit(): Promise<void> {
    if (this.form.invalid) {
      sweetAlert.alertWarning('Completa los campos obligatorios.');
      return;
    }

    const { fecha_inicio, fecha_fin } = this.form.value;
    const precioOriginal = Number(this.form.value.precio_original ?? 0);
    const precioPromocion = Number(this.form.value.precio_promocion ?? 0);

    if (this.requierePrecioPromo && precioPromocion > precioOriginal) {
      sweetAlert.alertWarning('El precio de promoción debe ser menor o igual al precio original.');
      return;
    }

    if (fecha_inicio && fecha_fin && new Date(fecha_inicio) > new Date(fecha_fin)) {
      sweetAlert.alertWarning('La fecha de inicio no puede ser mayor a la fecha de fin.');
      return;
    }

    this.saving = true;
    try {
      const payload = await this.buildPayload();

      if (this.editingId) {
        await this.promotionsService.actualizar(this.editingId, {
          ...payload,
          fecha_actualizacion: new Date().toISOString(),
          actualizado_por: PlataformasPickmi.ADMIN,
        });
        sweetAlert.alertSuccess('Promoción actualizada.');
      } else {
        const created = await this.promotionsService.crear({
          ...payload,
          fecha_creacion: new Date().toISOString(),
          creado_por: PlataformasPickmi.ADMIN,
        });
        this.promotions.unshift(created);
        sweetAlert.alertSuccess('Promoción creada.');
      }

      await this.loadPromotions();
      this.resetForm();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo guardar la promoción.');
    } finally {
      this.saving = false;
    }
  }

  private async buildPayload(): Promise<Partial<PickPromocion>> {
    const value = this.form.value;
    let imagenUrl = this.currentImageUrl;
    const precioOriginal = Number(value.precio_original ?? 0);
    // Para tipos sin precio_promocion se guarda igual al original (cumple constraint DB)
    const precioPromocion = this.requierePrecioPromo
      ? Number(value.precio_promocion ?? 0)
      : precioOriginal;
    const porcentaje = this.requierePrecioPromo ? this.porcentajeDescuento : null;

    if (this.croppedFile && value.comercio_id) {
      imagenUrl = await this.promotionsService.subirImagen(value.comercio_id, this.croppedFile);
    }

    return {
      comercio_id: value.comercio_id || '',
      titulo: value.titulo || '',
      descripcion: value.descripcion || null,
      fecha_inicio: value.fecha_inicio ? new Date(value.fecha_inicio).toISOString() : new Date().toISOString(),
      fecha_fin: value.fecha_fin ? new Date(value.fecha_fin).toISOString() : new Date().toISOString(),
      precio_original: precioOriginal,
      precio_promocion: precioPromocion,
      porcentaje_descuento: porcentaje !== null ? Number(porcentaje) : null,
      codigo_promocion: value.codigo_promocion || null,
      estatus: value.estatus || 'activo',
      tipo_promocion: value.tipo_promocion as TipoPromocion,
      item_regalo: value.item_regalo || null,
      imagen_url: imagenUrl,
    };
  }

  edit(promo: PickPromocion): void {
    this.editingId = promo.id || null;
    this.currentImageUrl = promo.imagen_url || null;
    this.croppedPreview = promo.imagen_url || null;
    this.croppedFile = undefined;
    this.imageChangedEvent = null;
    this.cropperVisible = false;

    this.form.patchValue({
      tipo_promocion: (promo.tipo_promocion ?? 'descuento') as TipoPromocion,
      comercio_id: promo.comercio_id,
      titulo: promo.titulo,
      descripcion: promo.descripcion,
      fecha_inicio: this.toInputDate(promo.fecha_inicio),
      fecha_fin: this.toInputDate(promo.fecha_fin),
      precio_original: promo.precio_original,
      precio_promocion: promo.precio_promocion,
      item_regalo: promo.item_regalo ?? null,
      codigo_promocion: promo.codigo_promocion,
      estatus: promo.estatus || 'activo',
    });
  }

  async delete(id?: string): Promise<void> {
    if (!id) return;

    const result = await Swal.fire({
      title: '¿Eliminar promoción?',
      text: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (!result.isConfirmed) return;

    try {
      await this.promotionsService.eliminar(id);
      this.promotions = this.promotions.filter(p => p.id !== id);
      sweetAlert.alertSuccess('Promoción eliminada.');
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo eliminar la promoción.');
    }
  }

  onFileChange(event: any): void {
    this.imageChangedEvent = event;
    this.cropperVisible = true;
  }

  imageCropped(event: ImageCroppedEvent): void {
    this.croppedPreview = event.base64 || null;
    this.croppedFile = event.blob || undefined;
  }

  cancelCropper(): void {
    this.cropperVisible = false;
    this.imageChangedEvent = null;
    this.croppedFile = undefined;
    this.croppedPreview = this.currentImageUrl;
  }

  resetForm(): void {
    this.form.reset({
      tipo_promocion: 'descuento',
      estatus: 'activo',
      item_regalo: null,
    });
    this.editingId = null;
    this.currentImageUrl = null;
    this.croppedPreview = null;
    this.imageChangedEvent = null;
    this.croppedFile = undefined;
    this.cropperVisible = false;
    this.setNuevoCodigo();
  }

  comercioNombre(id: string): string {
    const comercio = this.comercios.find(c => c.id === id);
    return comercio?.nombre || id;
  }

  private toInputDate(value?: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  generarCodigoPromocion(): string {
    const prefix = 'PM';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = prefix;
    while (codigo.length < 8) {
      codigo += chars[Math.floor(Math.random() * chars.length)];
    }
    return codigo;
  }

  private setNuevoCodigo(): void {
    this.form.patchValue({
      codigo_promocion: this.generarCodigoPromocion(),
    });
  }
}
