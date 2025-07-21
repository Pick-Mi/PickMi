import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GalleryService } from '../../../core/services/gallery.service';
import { PickGallery } from '../../../data/interfaces/galeria';
import { LoaderService } from '../../../core/services/loader.service';
import Swal from 'sweetalert2';
import * as sweetAlert from '../../../data/utils/alerts';
import { PlataformasPickmi } from '../../../data/constants/constants';

@Component({
  standalone: true,
  selector: 'app-gallery',
  imports: [CommonModule, FormsModule, NgIf],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent implements OnInit {
    
  constructor(
    private route: ActivatedRoute,
    private loaderService: LoaderService,
    private router: Router,
    private galleryService: GalleryService
  ) {}

  comercioId!: string;
  nombreComercio = '';
  galleryItems: PickGallery[] = [];
  files: File[] = [];
  previews: string[] = [];
  maxImages = 6;
  isUploading = false;
  isFileInputBlocked = false;

  async ngOnInit() {
    this.loaderService.show();
    this.comercioId = this.route.snapshot.paramMap.get('id')!;
    this.nombreComercio = await this.galleryService.obtenerNombreComercio(this.comercioId);  
    await this.loadGallery();
    this.loaderService.hide();
  }

  async loadGallery() {
    this.galleryItems = await this.galleryService.getImages(this.comercioId);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFiles = input.files;
    if (!selectedFiles?.length) return;

    const availableSlots = this.maxImages - (this.files.length + this.galleryItems.length);

    if (availableSlots <= 0) {
      sweetAlert.alertError('Ya has alcanzado el máximo de 6 imágenes permitidas.');
      input.value = ''; // Asegura que el input quede limpio
      return;
    }

    const filesToAdd = Array.from(selectedFiles).slice(0, availableSlots);

    // Limpia el input de inmediato antes de procesar
    setTimeout(() => input.value = '', 0);

    for (let file of filesToAdd) {
      this.files.push(file);
      const reader = new FileReader();
      reader.onload = () => this.previews.push(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    this.files.splice(index, 1);
    this.previews.splice(index, 1);
  }

  async uploadImages() {
    const totalImages = this.galleryItems.length + this.files.length;
    if (totalImages > 6) {
      sweetAlert.alertError('Superas el límite de 6 imágenes en total.');
      return;
    }

    this.isUploading = true;

    for (let i = 0; i < this.files.length; i++) {
      const original = this.files[i];
      const compressed = await this.galleryService.compressImage(original);
      const url = await this.galleryService.uploadImage(compressed, this.comercioId, i);

      if (url) {
        const saved = await this.galleryService.saveImageMetadata({
          comercio_id: this.comercioId,
          url_imagen: url,
          creado_por: PlataformasPickmi.BUSINESS,
        });

        if (saved) {
          this.galleryItems.unshift(saved);
        }
      }
    }

    this.files = [];
    this.previews = [];
    this.isUploading = false;
  }


  async deleteImage(item: PickGallery) {
    Swal.fire('¿Seguro que deseas eliminar esta imagen?')
    .then(async (result) => {
      if (result.isConfirmed) {
        const ok = await this.galleryService.deleteImage(item.id!, item.url_imagen);
        if (ok) {
          this.galleryItems = this.galleryItems.filter(img => img.id !== item.id);
        }
      }
    });    
  }

  onCancel() {
    this.router.navigate(['/gallery-list']);
  }

}
