import { Component, OnInit } from '@angular/core';
import { ReviewsService } from '../../../core/services/reviews.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from '../../../core/services/loader.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reviews',
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss'
})
export class ReviewsComponent implements OnInit {
  comercioId!: string;
  nombreComercio = '';
  comentarios: {
    comentario: string;
    calificacion: number;
    fecha_comentario: string;
    usuario: { nombre: string; apellido: string; avatar_url: string };
  }[] = [];

  paginaActual = 1;
  comentariosPorPagina = 5;
  totalComentarios = 0;
  totalPaginas = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewsService: ReviewsService,
    private loaderService: LoaderService
  ) {}

  async ngOnInit() {
    this.loaderService.show();
    this.comercioId = this.route.snapshot.paramMap.get('id')!;
    this.nombreComercio = await this.reviewsService.obtenerNombreComercio(this.comercioId);
    await this.cargarComentarios();
    this.loaderService.hide();
  }

  async cargarComentarios() {
    const { data, total } = await this.reviewsService.getComentariosPorComercioPaginado(
      this.comercioId,
      this.paginaActual,
      this.comentariosPorPagina
    );

    this.comentarios = data.map((item: any) => ({
      comentario: item.comentario,
      calificacion: item.calificacion,
      fecha_comentario: item.fecha,
      usuario: {
        nombre: item.usuarioNombre,
        apellido: '', // As 'usuarioApellido' is not provided, set as empty or adjust as needed
        avatar_url: item.usuarioAvatar
      }
    }));
    this.totalComentarios = total;
    this.totalPaginas = Math.ceil(total / this.comentariosPorPagina);
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas) return;
    this.paginaActual = nuevaPagina;
    this.cargarComentarios();
  }

  onCancel() {
    this.router.navigate(['/schedule-list']);
  }

  generateThumbs(rating: number): string[] {
    const thumbs: string[] = [];
    const fullThumbs = Math.floor(rating);
    const halfThumb = rating % 1 >= 0.5;

    for (let i = 0; i < fullThumbs; i++) thumbs.push('assets/svg/like.svg');
    if (halfThumb) thumbs.push('assets/svg/like_half.svg');
    while (thumbs.length < 5) thumbs.push('assets/svg/like_empty.svg');

    return thumbs;
  }
}

