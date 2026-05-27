import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SlidesService } from '../../../core/services/slides.service';
import { PickSlide } from '../../../data/interfaces/slides';
import { AuthService } from '../../../core/services/auth.service';
import * as sweetAlert from '../../../data/utils/alerts';
import Swal from 'sweetalert2';
import { ToggleSwitchComponent } from '../../../shared/components/toggle-switch/toggle-switch.component';

@Component({
  selector: 'app-slides-maintenance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent, ToggleSwitchComponent],
  templateUrl: './slides-maintenance.component.html',
  styleUrls: ['./slides-maintenance.component.scss']
})
export class SlidesMaintenanceComponent implements OnInit {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  slides: PickSlide[] = [];
  targetPage: 'HOME' | 'BUSINESS' = 'HOME';
  targetLabel = 'Inicio';
  bucketName = 'slide-home';
  loadingSlides = false;
  saving = false;
  selectedFile?: File;
  imagePreview: string | null = null;

  slideForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private slidesService: SlidesService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.buildForm();
  }

  private buildForm(): void {
    this.slideForm = this.fb.group({
      title: ['', Validators.required],
      position: [0, [Validators.required, Validators.min(0)]],
      is_active: [true],
      target_page: ['HOME']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const param = (params.get('target') || 'home').toUpperCase();
      this.targetPage = param === 'BUSINESS' ? 'BUSINESS' : 'HOME';
      this.targetLabel = this.targetPage === 'BUSINESS' ? 'Negocios' : 'Inicio';
      this.bucketName = this.targetPage === 'BUSINESS' ? 'slide-business' : 'slide-home';
      this.slideForm.patchValue({ target_page: this.targetPage });
      this.cargarSlides();
    });
  }

  async cargarSlides(): Promise<void> {
    this.loadingSlides = true;
    try {
      this.slides = await this.slidesService.obtenerSlidesPorTarget(this.targetPage);
      this.resetForm();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudieron cargar los slides');
    } finally {
      this.loadingSlides = false;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  async guardarSlide(): Promise<void> {
    if (this.slideForm.invalid || !this.selectedFile) {
      sweetAlert.alertWarning('Completa la información del slide e incluye una imagen.');
      return;
    }

    this.saving = true;
    try {
      const imageUrl = await this.subirImagen(this.selectedFile);
      const { title, position, is_active } = this.slideForm.value;

      await this.slidesService.crearSlide({
        title: title!,
        position: position ?? 0,
        is_active: is_active ?? true,
        image_path: imageUrl,
        target_page: this.targetPage
      });

      sweetAlert.alertSuccess('Slide creado correctamente');
      await this.cargarSlides();
      this.limpiarImagen();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo guardar el slide');
    } finally {
      this.saving = false;
    }
  }

  async cambiarEstado(slide: PickSlide): Promise<void> {
    if (!slide.id) return;

    try {
      const nuevoEstado = !slide.is_active;
      await this.slidesService.actualizarSlide(slide.id, { is_active: nuevoEstado });
      slide.is_active = nuevoEstado;
      sweetAlert.alertSuccess(`Slide ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo actualizar el estado del slide');
    }
  }

  async eliminarSlide(slide: PickSlide): Promise<void> {

    Swal.fire({
      title: `¿Deseas eliminar "${slide.title}"?`,
      showDenyButton: true,
      confirmButtonText: 'Si',
      confirmButtonColor: '#6f42c1',
      denyButtonText: 'No',
      denyButtonColor: '#b6b6b6',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const id = slide.id;
          if (!id) {
            sweetAlert.alertError('Slide inválido');
            return;
          }
          await this.slidesService.eliminarSlide(id);
          this.slides = this.slides.filter(s => s.id !== slide.id);
          sweetAlert.alertSuccess('Slide eliminado');
        } catch (error) {
          console.error(error);
          sweetAlert.alertError('No se pudo eliminar el slide');
        }     
      }
    });    
  }

  private async subirImagen(file: File): Promise<string> {
    const supabase = this.authService.getSupabaseClient();
    const extension = file.name.split('.').pop() || 'jpg';
    const filePath = `${this.targetPage.toLowerCase()}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(this.bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  }

  private resetForm(): void {
    const nextPosition = this.obtenerSiguientePosicion();
    this.slideForm.reset({
      title: '',
      position: nextPosition,
      is_active: true,
      target_page: this.targetPage
    });
  }

  private obtenerSiguientePosicion(): number {
    if (!this.slides.length) {
      return 0;
    }
    const maxPosition = Math.max(...this.slides.map(slide => slide.position ?? 0));
    return maxPosition + 1;
  }

  limpiarImagen(): void {
    this.selectedFile = undefined;
    this.imagePreview = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
