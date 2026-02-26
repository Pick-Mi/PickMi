import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PreviewService } from '../../../core/services/preview.service';
import { PickProductos } from '../../../data/interfaces/productos';
import { PickHorarios } from '../../../data/interfaces/horarios';
import { PickGallery } from '../../../data/interfaces/galeria';
import { PickComercioConTipoYUbicacion } from '../../../data/interfaces/preview';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';
import { TelephoneFormatPipe } from '../../../shared/pipes/telephone.pipe';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../../environments/environment';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { catalogs_owloptions } from '../../../data/utils/owl.options';

@Component({
  selector: 'app-preview',
  imports: [NgIf, CommonModule, TelephoneFormatPipe, NgFor, CarouselModule],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent implements OnInit, AfterViewInit {

  diasSemana = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  productosPaginados: PickProductos[] = [];
  page: number = 1;
  pageSize: number = 12;

  map!: mapboxgl.Map;
  marker!: mapboxgl.Marker;
  @ViewChild('mapContainer') divElementRef!: ElementRef;

  catalogs_owloptions = catalogs_owloptions;
  comercio: PickComercioConTipoYUbicacion | null = null;
  productos: PickProductos[] = [];
  productosDestacados: PickProductos[] = [];
  horarios: PickHorarios[] = [];
  imagenes: PickGallery[] = [];
  isOpenNow: boolean = false;
  comercioId!: string;

  constructor(
    private previewService: PreviewService,
    private loaderService: LoaderService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    const comercioId = this.route.snapshot.paramMap.get('id');
    if (comercioId) {
      this.comercioId = comercioId;
      this.loaderService.show();
      this.loadPreviewData(comercioId);
    }
  }

  ngAfterViewInit(): void {
      
  }

  loadPreviewData(comercioId: string): void {
    forkJoin({
      comercio: this.previewService.getComercioWithUbicacion(comercioId),
      productos: this.previewService.getProductos(comercioId),
      horarios: this.previewService.getHorarios(comercioId),
      imagenes: this.previewService.getGaleria(comercioId)
    }).subscribe(({ comercio, productos, horarios, imagenes }) => {
      this.comercio = comercio;
      this.productos = productos;
      this.horarios = horarios;
      this.imagenes = imagenes;
      this.productosDestacados = this.productos.filter(p => p.destacado);
      
      this.isOpenNow = this.previewService.evaluarSiEstaAbierto(horarios);


      if (this.comercio?.posee_local) {
        setTimeout(() => this.initMap(), 0);
      }
      
      this.updateProductosPaginados();

      this.loaderService.hide();
    });
  }

  private initMap() {
    if (!this.divElementRef || !this.divElementRef.nativeElement) {
      console.error('El elemento del mapa no está disponible');
      return;
    }

    (mapboxgl as any).config.ACCESS_TOKEN = environment.mapboxToken;

    const lat = this.comercio?.latitud || 0;
    const lng = this.comercio?.longitud || 0;

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

  }


  getHorariosOrdenados(): PickHorarios[] {
    return this.horarios.slice().sort((a, b) => a.dia_semana - b.dia_semana);
  }

  formatHorarioDia(horaApertura: string | null, horaCierre: string | null): string {
    if (!horaApertura || !horaCierre) {
      return 'Cerrado';
    }

    const [hA, mA] = horaApertura.split(':').map(Number);
    const [hC, mC] = horaCierre.split(':').map(Number);

    const ampmA = hA >= 12 ? 'PM' : 'AM';
    const ampmC = hC >= 12 ? 'PM' : 'AM';

    const horaInicio = `${(hA % 12 || 12)}:${mA.toString().padStart(2, '0')} ${ampmA}`;
    const horaFin = `${(hC % 12 || 12)}:${mC.toString().padStart(2, '0')} ${ampmC}`;

    return `${horaInicio} - ${horaFin}`;
  }

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  regresar(): void {
    this.router.navigate(['/stores-list']);
  }

  get bannerImagen(): string {
    return this.comercio?.banner_url || 'assets/img/banner-business-1.jpg';
  }

  get totalComentarios(): number {
    return this.comercio?.total_reviews ?? 0;
  }

  get promedioCalificacion(): number {
    return this.comercio?.promedio_calificacion ?? 0;
  }

  generateThumbs(rate: number): string[] {
    const rounded = Math.round(rate || 0);
    return Array.from({ length: 5 }, (_, idx) =>
      idx < rounded ? 'assets/svg/like.svg' : 'assets/svg/like_empty.svg'
    );
  }

  get totalPages(): number {
    return Math.ceil(this.productos.length / this.pageSize);
  }

  updateProductosPaginados(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.productosPaginados = this.productos.slice(start, end);
  }

  cambiarPagina(nuevaPagina: number): void {
    this.page = nuevaPagina;
    this.updateProductosPaginados();
  }

  calcularPrecioConDescuento(producto: PickProductos): number {
    if (!producto.en_promocion || !producto.valor_promocion) return producto.precio;

    if (producto.tipo_promocion === 'porcentaje') {
      return producto.precio - (producto.precio * producto.valor_promocion / 100);
    } else if (producto.tipo_promocion === 'cantidad') {
      return producto.precio - producto.valor_promocion;
    }

    return producto.precio;
  }

  obtenerTextoPromocion(producto: PickProductos): string {
    if (!producto.en_promocion || !producto.valor_promocion) {
      return '';
    }

    if (producto.tipo_promocion === 'porcentaje') {
      return `-${producto.valor_promocion}%`;
    } else if (producto.tipo_promocion === 'cantidad') {
      return `-${producto.valor_promocion} USD`;
    }

    return '';
  }

}
