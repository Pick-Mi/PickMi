import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewsService } from '../../../core/services/reviews.service';
import { PickReview } from '../../../data/interfaces/reviews';
import * as sweetAlert from '../../../data/utils/alerts';

type Orden = 'recientes' | 'mejor' | 'peor';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent implements OnInit {
  reviews: PickReview[] = [];
  loading = false;

  paginaActual = 1;
  registrosPorPagina = 10;
  totalRegistros = 0;
  totalPaginas = 1;

  busqueda = '';
  estatusFiltro: 'todos' | 'activo' | 'inactivo' = 'todos';
  calificacionFiltro: number | 'todas' = 'todas';
  orden: Orden = 'recientes';

  // stats
  promedioCalificacion: number | null = null;
  totalReportadas = 0;

  ngOnInit(): void {
    this.cargarReviews();
  }

  constructor(private reviewsService: ReviewsService) {}

  async cargarReviews(): Promise<void> {
    this.loading = true;
    try {
      const { data, total } = await this.reviewsService.obtenerReviewsGlobales({
        pagina: this.paginaActual,
        limite: this.registrosPorPagina,
        estatus: this.estatusFiltro === 'todos' ? undefined : this.estatusFiltro,
        busqueda: this.busqueda.trim() || undefined
      });

      this.reviews = data;
      this.totalRegistros = total;
      this.totalPaginas = Math.max(1, Math.ceil(total / this.registrosPorPagina));

      if (data.length) {
        const sum = data.reduce((acc, r) => acc + (r.calificacion ?? 0), 0);
        this.promedioCalificacion = sum / data.length;
      } else {
        this.promedioCalificacion = null;
      }
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudieron cargar los reviews.');
    } finally {
      this.loading = false;
    }
  }

  get reviewsOrdenadas(): PickReview[] {
    let result = [...this.reviews];
    if (this.calificacionFiltro !== 'todas') {
      result = result.filter(r => Math.floor(r.calificacion) === this.calificacionFiltro);
    }
    if (this.orden === 'mejor') result.sort((a, b) => b.calificacion - a.calificacion);
    else if (this.orden === 'peor') result.sort((a, b) => a.calificacion - b.calificacion);
    return result;
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarReviews();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.estatusFiltro = 'todos';
    this.calificacionFiltro = 'todas';
    this.orden = 'recientes';
    this.aplicarFiltros();
  }

  setOrden(orden: Orden): void {
    this.orden = orden;
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas) return;
    this.paginaActual = nuevaPagina;
    this.cargarReviews();
  }

  cambiarRegistrosPorPagina(valor: number): void {
    this.registrosPorPagina = valor;
    this.paginaActual = 1;
    this.cargarReviews();
  }

  async alternarEstatus(review: PickReview): Promise<void> {
    const nuevoEstatus = review.estatus === 'activo' ? 'inactivo' : 'activo';
    try {
      await this.reviewsService.actualizarEstatusReview(review.id, nuevoEstatus);
      review.estatus = nuevoEstatus;
      sweetAlert.alertSuccess(`Reseña ${nuevoEstatus === 'activo' ? 'activada' : 'ocultada'} correctamente.`);
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo actualizar el estatus de la reseña.');
    }
  }

  async eliminarReview(review: PickReview): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar esta reseña? Esta acción no se puede deshacer.')) return;
    try {
      await this.reviewsService.eliminarReview(review.id);
      this.reviews = this.reviews.filter(r => r.id !== review.id);
      this.totalRegistros = Math.max(0, this.totalRegistros - 1);
      this.totalPaginas = Math.max(1, Math.ceil(this.totalRegistros / this.registrosPorPagina));
      sweetAlert.alertSuccess('Reseña eliminada correctamente.');
      if (!this.reviews.length && this.paginaActual > 1) {
        this.paginaActual -= 1;
        await this.cargarReviews();
      }
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo eliminar la reseña.');
    }
  }

  generateThumbs(rating: number): string[] {
    const thumbs: string[] = [];
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    for (let i = 0; i < full; i++) thumbs.push('assets/svg/like.svg');
    if (half) thumbs.push('assets/svg/like_half.svg');
    while (thumbs.length < 5) thumbs.push('assets/svg/like_empty.svg');
    return thumbs;
  }
}
