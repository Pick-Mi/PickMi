import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StoresService } from '../../../core/services/stores.service';
import { PickUsuario } from '../../../data/interfaces/usuarios';
import { PlataformasPickmi } from '../../../data/constants/constants';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../../environments/environment';
import { PickDepartamentos, PickMunicipios, PickTipoComercio } from '../../../data/interfaces/comercios';
import { CommonModule } from '@angular/common';
import * as sweetAlert from '../../../data/utils/alerts';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { PickCategoria, PickSubcategoria } from '../../../data/interfaces/categorias';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-stores',
  templateUrl: './stores.component.html',
  styleUrl: './stores.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ImageCropperComponent],
})
export class StoresComponent implements OnInit {
  localForm!: FormGroup;
  usuario!: PickUsuario | null;
  tiposComercio: PickTipoComercio[] = [];
  categorias: PickCategoria[] = [];
  categoriasFiltradas: PickCategoria[] = [];
  
  map!: mapboxgl.Map;
  marker!: mapboxgl.Marker;
  @ViewChild('mapContainer') divElementRef!: ElementRef;

  isUploadingLogo: boolean = false;
  logoChangedEvent: any = '';
  croppedImage: any = '';
  comercioId: string | null = null;
  croppedLogo: string | null = null;
  showLogoCropper: boolean = false;
  logoPreview: string = 'assets/img/tienda.png';
  departamentos: PickDepartamentos[] = [];
  municipios: PickMunicipios[] = [];
  departamentoSeleccionado: number | null = null;
  municipiosFiltrados: PickMunicipios[] = [];
  municipioSeleccionado: number | null = null;

  subcategorias: PickSubcategoria[] = [];
  subcategoriasPorCategoria: { [categoriaId: number]: PickSubcategoria[] } = {};
  subcategoriasSeleccionadas: string[] = [];

  constructor(
    private fb: FormBuilder,
    private comercioService: StoresService,
    private authService: AuthService,
    private router: Router,
    public route: ActivatedRoute, 
    private loaderService: LoaderService
  ) {}

  async ngOnInit() {
    this.usuario = this.authService.currentUsuario;
    if (!this.usuario) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.localForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],      
      telefono: ['', Validators.required],
      email: ['', [Validators.email]],
      website: [''],      
      posee_local: [true],
      direccion: [''],
      departamento: [null],
      municipio: [null],
      latitud: ['13.701150'],
      longitud: ['-89.191409'],
      pet_friendly: [false],
      tipo_entrega: ['envio', Validators.required],
      tiempo_entrega_valor: [null],
      tiempo_entrega_unidad: ['horas'],
      tipo_comercio_id: [1, Validators.required],
      categorias: [[]],
      subcategorias: [[]],
      url_facebook: [''],
      url_twitter: [''],
      url_instagram: [''],
      url_tiktok: [''],
      url_youtube: [''],
      url_whatsapp: ['']
    });

    this.loaderService.show();
    
    await this.getTiposComercio();
    await this.cargarCategorias();
    await this.cargarSubcategorias();
    await this.getDepartamentos();
    await this.getMunicipios();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== '0') {
      await this.cargarComercio(id);
      await this.cargarCategoriasSeleccionadas(id);
      await this.cargarSubcategoriasSeleccionadas(id);
    }
    
    this.initMap();

    this.localForm.get('departamento')?.valueChanges.subscribe((idDepartamento: number) => {
      this.municipiosFiltrados = this.municipios.filter(
        m => m.id_departamento == idDepartamento
      );
    });

    this.localForm.get('tipo_comercio_id')?.valueChanges.subscribe((tipoId: number) => {
      this.filtrarCategoriasPorTipo(tipoId);
    });


    this.localForm.get('posee_local')?.valueChanges.subscribe((tipo: boolean) => {
      this.actualizarValidadoresUbicacion(tipo);
    });

    this.localForm.get('tipo_entrega')?.valueChanges.subscribe((tipo: string) => {
      const tiempoControl = this.localForm.get('tiempo_entrega_valor');
      if (tipo === 'local') {
        tiempoControl?.clearValidators();
        tiempoControl?.setValue(null);
      } else {
        tiempoControl?.setValidators([Validators.required, Validators.min(1)]);
      }
      tiempoControl?.updateValueAndValidity();
    });



    this.loaderService.hide();
  }

  get mostrarUbicacion(): boolean {
    return this.localForm.get('posee_local')?.value === true;
  }

  private actualizarValidadoresUbicacion(tipo: boolean) {
    const campos = ['direccion', 'departamento', 'municipio'];

    campos.forEach(campo => {
      const control = this.localForm.get(campo);
      if (control) {
        if (tipo) {
          control.setValidators([Validators.required]);
        } else {
          control.clearValidators();
          control.setValue(null); // Opcional: limpiar campo si no se usará
        }
        control.updateValueAndValidity();
      }
    });
  }


  private async getTiposComercio() {
    const { tipos, error } = await this.comercioService.obtenerTiposComercio();
    if (!error && tipos) {
      this.tiposComercio = tipos;
    }
  }

  private async cargarCategorias() {
    const { categorias, error } = await this.comercioService.obtenerCategorias();
    if (!error && categorias) {
      this.categorias = categorias;
      const tipo = this.localForm.get('tipo_comercio_id')?.value || 1;
      this.filtrarCategoriasPorTipo(tipo);
    }
  }

  private async cargarSubcategorias() {
    const { subcategorias, error } = await this.comercioService.obtenerSubcategorias();

    if (!error) {
      // Agrupar por categoría
      subcategorias.forEach(sub => {
        if (!this.subcategoriasPorCategoria[sub.categoria_id]) {
          this.subcategoriasPorCategoria[sub.categoria_id] = [];
        }
        this.subcategoriasPorCategoria[sub.categoria_id].push(sub);
      });
    }
  }

  private filtrarCategoriasPorTipo(tipoId: number) {
    this.categoriasFiltradas = this.categorias.filter(cat => cat.tipo_comercio_id == tipoId);
    // Resetear las categorías seleccionadas si no pertenecen al nuevo tipo
    const seleccionadas = this.localForm.get('categorias')?.value || [];
    const validas = this.categoriasFiltradas.map(cat => cat.id);
    const filtradas = seleccionadas.filter((id: number) => validas.includes(id));
    this.localForm.patchValue({ categorias: filtradas });
  }


  private async getDepartamentos() {
    const { departamentos, error } = await this.comercioService.getDepartamentos();
    if (!error && departamentos) {
      this.departamentos = departamentos;
    }
  }

  private async getMunicipios() {
    const { municipios, error } = await this.comercioService.getMunicipios();
    if (!error && municipios) {
      this.municipios = municipios;
    }
  }

  onCategoriaChange(event: any, categoriaId: number) {
    const categorias = this.localForm.value.categorias as number[];
    const subcategorias = this.localForm.value.subcategorias as number[];

    if (event.target.checked) {
      // Seleccionamos la categoría
      if (!categorias.includes(categoriaId)) {
        categorias.push(categoriaId);
      }

      // Seleccionamos automáticamente sus subcategorías
      const subcats = this.subcategoriasPorCategoria[categoriaId] ?? [];
      subcats.forEach(sub => {
        if (!subcategorias.includes(sub.id)) {
          subcategorias.push(sub.id);
        }
      });

    } else {
      // Quitamos la categoría
      const catIndex = categorias.indexOf(categoriaId);
      if (catIndex !== -1) categorias.splice(catIndex, 1);

      // Quitamos sus subcategorías
      const subcats = this.subcategoriasPorCategoria[categoriaId] ?? [];
      subcats.forEach(sub => {
        const subIndex = subcategorias.indexOf(sub.id);
        if (subIndex !== -1) subcategorias.splice(subIndex, 1);
      });
    }

    this.localForm.patchValue({ categorias, subcategorias });
  }

  onSubcategoriaChange(event: any, categoriaId: number) {
    const subcategorias = this.localForm.value.subcategorias as number[];
    const categorias = this.localForm.value.categorias as number[];
    const subcatId = +event.target.value;

    if (event.target.checked) {
      if (!subcategorias.includes(subcatId)) {
        subcategorias.push(subcatId);
      }

      // Asegurar que la categoría esté seleccionada
      if (!categorias.includes(categoriaId)) {
        categorias.push(categoriaId);
      }

    } else {
      const index = subcategorias.indexOf(subcatId);
      if (index !== -1) subcategorias.splice(index, 1);

      // Si ya no queda ninguna subcategoría activa de esa categoría, desmarcar la principal
      const subcats = this.subcategoriasPorCategoria[categoriaId] ?? [];
      const algunaActiva = subcats.some(sub => subcategorias.includes(sub.id));

      if (!algunaActiva) {
        const catIndex = categorias.indexOf(categoriaId);
        if (catIndex !== -1) categorias.splice(catIndex, 1);
      }
    }

    this.localForm.patchValue({ categorias, subcategorias });
  }

  private async cargarComercio(id: string) {
    const { comercio, error } = await this.comercioService.obtenerComercioPorId(id);

    if (error || !comercio) {
      sweetAlert.alertError('No se pudo cargar la información del comercio');
      return;
    }
    

    this.localForm.patchValue({
      nombre: comercio.nombre,
      descripcion: comercio.descripcion,      
      telefono: comercio.telefono,
      email: comercio.email,
      website: comercio.website,
      posee_local: comercio.posee_local ?? true,
      pet_friendly: comercio.pet_friendly ?? false,
      tipo_entrega: comercio.tipo_entrega ?? 'envio',
      tiempo_entrega_valor: comercio.tiempo_entrega_valor,
      tiempo_entrega_unidad: comercio.tiempo_entrega_unidad || 'horas',
      direccion: comercio.direccion,
      latitud: comercio.latitud,
      longitud: comercio.longitud,
      departamento: comercio.departamento,
      municipio: comercio.municipio,
      tipo_comercio_id: comercio.tipo_comercio_id,
      url_facebook: comercio.url_facebook,
      url_twitter: comercio.url_twitter,
      url_instagram: comercio.url_instagram,
      url_tiktok: comercio.url_tiktok,
      url_youtube: comercio.url_youtube,
      url_whatsapp: comercio.url_whatsapp
    });

    this.municipiosFiltrados = this.municipios.filter(
      m => m.id_departamento == Number(comercio.departamento)
    );

    this.filtrarCategoriasPorTipo(comercio.tipo_comercio_id);

    this.logoPreview = comercio.logo_url || 'assets/img/tienda.png';
  }

  async onSubmit() {
    if (this.localForm.invalid || !this.usuario) return;

    const id = this.route.snapshot.paramMap.get('id');
    const formValue = { ...this.localForm.value };

    // Removemos las categorías del objeto que se enviará a la tabla pick_comercios
    delete formValue.categorias;
    delete formValue.subcategorias;

    const local = {
      ...formValue,
      usuario_id: this.usuario.id,
      fecha_creacion: new Date().toISOString(),
      creado_por: PlataformasPickmi.BUSINESS,
    };

    if (id && id !== '0') {
      // Actualizar comercio
      this.comercioId = id;
      const { error } = await this.comercioService.actualizarComercio(id, local);
      
      if (!error) {
        await this.guardarLogoCortado();
        await this.guardarCategoriasComercio();

        sweetAlert.alertSuccess('Local actualizado correctamente');
        this.router.navigate(['/stores-list']);
      }else{
        sweetAlert.alertError('Error al actualizar el local');
      }
    } else {
      // Crear nuevo comercio
      const { comercios, error } = await this.comercioService.crearComercio(local);
      if (!error && comercios) {
        this.comercioId = comercios[0]?.id ?? null;
        await this.guardarLogoCortado();
        await this.guardarCategoriasComercio();
        
        sweetAlert.alertSuccess('Local registrado exitosamente');
        this.router.navigate(['/stores-list']);
      }else {
        sweetAlert.alertError('Error al registrar el local');
      }
    }
  }

  private async cargarCategoriasSeleccionadas(id: string) {
    const { categoriaIds, error } = await this.comercioService.cargarCategoriasSeleccionadas(id);
    if (!error) {
      this.localForm.patchValue({ categorias: categoriaIds });
      const tipo = this.localForm.get('tipo_comercio_id')?.value;
      if (tipo) {
        this.filtrarCategoriasPorTipo(tipo);
      }
    }
  }

  private async cargarSubcategoriasSeleccionadas(id: string) {
    const { subcategoriaIds, error } = await this.comercioService.cargarSubcategoriasSeleccionadas(id);
    if (!error) {
      this.localForm.patchValue({ subcategorias: subcategoriaIds });
    }
  }

  async guardarCategoriasComercio() {
    if (!this.comercioId || !this.usuario) return;

    const categoriaIds = this.localForm.value.categorias as number[] || [];
    const subcategoriaIds = this.localForm.value.subcategorias as number[] || [];

    // Guardar categorías
    if (categoriaIds.length > 0) {
      const { error } = await this.comercioService.actualizarCategoriasComercio(
        this.comercioId,
        categoriaIds
      );

      if (error) {
        sweetAlert.alertError('Error al actualizar las categorías del comercio');
      }
    }

    // Guardar subcategorías
    if (subcategoriaIds.length > 0) {
      const { error } = await this.comercioService.actualizarSubcategoriasComercio(
        this.comercioId,
        subcategoriaIds
      );

      if (error) {
        sweetAlert.alertError('Error al actualizar las subcategorías del comercio');
      }
    }
  }


  async guardarLogoCortado() {
    if (this.croppedImage && this.comercioId) {
      const filePath = `comercio-${this.comercioId}/logo.png`;

      // Subida a Supabase
      const { error: uploadError } = await this.authService.getSupabaseClient().storage
        .from('logos-business')
        .upload(filePath, this.croppedImage, {
          upsert: true,
          contentType: 'image/png',
        });

      if (!uploadError) {
        const { data } = this.authService.getSupabaseClient()
          .storage.from('logos-business')
          .getPublicUrl(filePath);

        const publicUrl = data?.publicUrl;

        if (publicUrl) {
          await this.comercioService.actualizarLogoComercio(this.comercioId, publicUrl);
        }
      }
    }
  }



  private initMap() {
    (mapboxgl as any).config.ACCESS_TOKEN = environment.mapboxToken;

    const lat = parseFloat(this.localForm.get('latitud')?.value) || 13.701150;
    const lng = parseFloat(this.localForm.get('longitud')?.value) || -89.191409;

    this.map = new mapboxgl.Map({
      container: this.divElementRef.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 13,
      attributionControl: false,
    });

    this.map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    this.marker = new mapboxgl.Marker({ draggable: true, color: '#d02b38' })
      .setLngLat([lng, lat])
      .addTo(this.map);

    this.marker.on('dragend', () => {
      const lngLat = this.marker.getLngLat();
      this.localForm.patchValue({
        latitud: lngLat.lat.toFixed(6),
        longitud: lngLat.lng.toFixed(6),
      });
    });
  }

  private resetMarker() {
    const lat = parseFloat(this.localForm.get('latitud')?.value) || 13.701150;
    const lng = parseFloat(this.localForm.get('longitud')?.value) || -89.191409;
    this.marker.setLngLat([lng, lat]);
    this.map.flyTo({ center: [lng, lat], zoom: 13 });
  }

  onLogoChange(event: any): void {
    this.logoChangedEvent = event;
    this.showLogoCropper = true;
  }

  logoCropped(event: ImageCroppedEvent) {
    if (event.blob) {
      const objectUrl = URL.createObjectURL(event.blob);
      this.croppedImage = event.blob;
      this.croppedLogo = objectUrl;
      this.logoPreview = objectUrl;
    }
  }

  cancelCropper() {
    this.logoChangedEvent = null;
    this.croppedLogo = null;
    this.croppedImage = null;
    this.showLogoCropper = false;
    this.logoPreview = 'assets/img/tienda.png';
  }

  onCancel() {
    this.router.navigate(['/stores-list']);
  }

  onReset() {
    this.localForm.reset();
    this.resetMarker();
  }

}
