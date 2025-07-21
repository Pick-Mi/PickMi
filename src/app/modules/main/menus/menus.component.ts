import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PickProductos } from '../../../data/interfaces/productos';
import { MenusService } from '../../../core/services/menus.service';
import { LoaderService } from '../../../core/services/loader.service';
import { ResponsiveService } from '../../../core/services/responsive.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import * as sweetAlert from '../../../data/utils/alerts';

@Component({
  selector: 'app-menus',
  imports: [CommonModule, ReactiveFormsModule, ImageCropperComponent, NgxDatatableModule],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.scss'
})
export class MenusComponent implements OnInit {
  comercioId!: string;
  nombreComercio = '';
  productos: PickProductos[] = [];
  imageChangedEvent: any = null;
  croppedImage: Blob | null = null;
  showCropper = false;
  logoPreview: string = 'assets/img/producto.png';
  productoSeleccionado: PickProductos | null = null;
  isMobile = false;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    private loaderService: LoaderService,
    private menusService: MenusService,
    private responsiveService: ResponsiveService
  ) {}

  form!: FormGroup;

  async ngOnInit() {

    this.responsiveService.isMobile$.subscribe(value => {
      this.isMobile = value;
    });

    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      destacado: [false],
      en_promocion: [false],
      tipo_promocion: ['porcentaje'],
      valor_promocion: [null],
      descripcion_promocion: [''],
      fecha_inicio_promo: [''],
      fecha_fin_promo: ['']
    });

    this.loaderService.show();
    this.comercioId = this.route.snapshot.paramMap.get('id')!;
    this.nombreComercio = await this.menusService.obtenerNombreComercio(this.comercioId);
    this.productos = await this.menusService.obtenerProductosPorComercio(this.comercioId);

    this.form.get('en_promocion')?.valueChanges.subscribe((promocion: boolean) => {
      const tipo = this.form.get('tipo_promocion');
      const valor = this.form.get('valor_promocion');

      if (promocion) {
        tipo?.setValidators([Validators.required]);
        valor?.setValidators([Validators.required, Validators.min(0.01)]);
      } else {
        valor?.clearValidators();
      }

      tipo?.updateValueAndValidity();
      valor?.updateValueAndValidity();
    });


    this.loaderService.hide();
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.blob) {
      const objectUrl = URL.createObjectURL(event.blob);
      this.croppedImage = event.blob;
      this.logoPreview = objectUrl;
    }
  }

  onActivate(event: any): void {
    if (event.type === 'click') {
      const row = event.row;
      this.editarProducto(row);
    }
  }

  cancelarCrop() {
    this.imageChangedEvent = null;
    this.croppedImage = null;
    this.showCropper = false;
  }

  onFileChange(event: any): void {
    this.imageChangedEvent = event;
    this.showCropper = true;
  }

  async guardar() {
    if (this.form.invalid) return;

    let url_imagen = this.logoPreview;

    if (this.croppedImage) {
      const file = new File([this.croppedImage], `producto-${Date.now()}.jpg`, {
        type: this.croppedImage.type,
      });
      url_imagen = await this.menusService.subirImagenProducto(this.comercioId, file);
    }

    const datos = {
      comercio_id: this.comercioId,
      nombre: this.form.value.nombre!,
      descripcion: this.form.value.descripcion!,
      precio: this.form.value.precio!,
      url_imagen,
      destacado: this.form.value.destacado,
      en_promocion: this.form.value.en_promocion,
      tipo_promocion: this.form.value.tipo_promocion || 'porcentaje',
      valor_promocion: this.form.value.valor_promocion || null,
      descripcion_promocion: this.form.value.descripcion_promocion || null,
      fecha_inicio_promo: this.form.value.fecha_inicio_promo || null,
      fecha_fin_promo: this.form.value.fecha_fin_promo || null
    };

    if (this.productoSeleccionado) {
      if (this.productoSeleccionado.id !== undefined) {
        await this.menusService.actualizarProducto(this.productoSeleccionado.id, datos);
        sweetAlert.alertSuccess('Producto actualizado correctamente');
      } else {
        throw new Error('El producto seleccionado no tiene un ID definido.');
      }
    } else {
      await this.menusService.guardarProducto(datos);
      sweetAlert.alertSuccess('Producto guardado correctamente');
    }

    this.resetFormulario();
    this.productos = await this.menusService.obtenerProductosPorComercio(this.comercioId);
  }

  resetFormulario() {
    this.form.reset();
    this.croppedImage = null;
    this.imageChangedEvent = null;
    this.showCropper = false;
    this.productoSeleccionado = null;
    this.logoPreview = 'assets/img/producto.png';
  }


  editarProducto(producto: PickProductos) {
    this.productoSeleccionado = producto;
    
    this.form.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      destacado: producto.destacado,
      en_promocion: producto.en_promocion,
      tipo_promocion: producto.tipo_promocion || 'porcentaje',
      valor_promocion: producto.valor_promocion,
      descripcion_promocion: producto.descripcion_promocion,
      fecha_inicio_promo: producto.fecha_inicio_promo?.split('T')[0] || '',
      fecha_fin_promo: producto.fecha_fin_promo?.split('T')[0] || ''
    });
    this.logoPreview = producto.url_imagen;
  }

  async eliminarProducto(producto: PickProductos) {
    const confirmado = confirm(`¿Eliminar el producto "${producto.nombre}"?`);
    if (!confirmado) return;

    if (producto.id !== undefined) {
      await this.menusService.eliminarProducto(producto.id);
    } else {
      throw new Error('El producto no tiene un ID definido.');
    }
    this.productos = await this.menusService.obtenerProductosPorComercio(this.comercioId);
  }

  onCancel() {
    this.router.navigate(['/menus-list']);
  }

}