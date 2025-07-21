import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { PickUsuario } from '../../../data/interfaces/usuarios';
import { ProfileService } from '../../../core/services/profile.service';
import { CommonModule } from '@angular/common';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import * as sweetAlert from '../../../data/utils/alerts';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ImageCropperComponent ],
})
export class ProfileComponent implements OnInit {
  perfilForm!: FormGroup;
  usuario!: PickUsuario | null;
  avatarUrl: string = 'https://placehold.co/500x500';
  isUploading: boolean = false;

  imageChangedEvent: any = '';
  croppedImage: any = '';
  showCropper: boolean = false;

  constructor(
    private fb: FormBuilder,
    private perfilService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.currentUsuario;

    if (!this.usuario) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.perfilForm = this.fb.group({
      nombre: [this.usuario.nombre || '', Validators.required],
      apellido: [this.usuario.apellido || '', Validators.required],
      telefono: [this.usuario.telefono || '', [Validators.pattern(/^[0-9]{7,15}$/)]],
      email: [{ value: this.usuario.email, disabled: true }]
    });

    this.cargarAvatar();
  }

  async onSubmit() {
    if (this.perfilForm.invalid || !this.usuario) return;

    const cambios = {
      nombre: this.perfilForm.value.nombre,
      apellido: this.perfilForm.value.apellido,
      telefono: this.perfilForm.value.telefono,
      estatus: 'activo'
    };

    const { error } = await this.perfilService.actualizarPerfilUsuario(this.usuario.id!, cambios);

    if (error) {
      sweetAlert.alertError('Error al actualizar el perfil');
      return;
    }

    await this.authService.refreshUsuario();
    sweetAlert.alertSuccess('Perfil actualizado exitosamente');
    this.router.navigate(['/profile']);
  }

  onAvatarChange(event: any): void {
    this.imageChangedEvent = event;
    this.showCropper = true;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
  }

  async guardarAvatarCortado() {
    if (!this.usuario || !this.croppedImage) return;

    this.isUploading = true;

    const filePath = `usuario-${this.usuario.id}/avatar.png`;

    const { error: uploadError } = await this.authService
      .getSupabaseClient()
      .storage
      .from('avatars-business')
      .upload(filePath, this.croppedImage, {
        upsert: true,
        contentType: 'image/png',
      });

    if (uploadError) {
      sweetAlert.alertError('Error al subir la imagen');
      this.isUploading = false;
      return;
    }

    // ✅ Obtener la URL pública
    const { data } = this.authService
      .getSupabaseClient()
      .storage
      .from('avatars-business')
      .getPublicUrl(filePath);

    const publicUrl = data?.publicUrl;

    if (publicUrl) {
      await this.perfilService.actualizarPerfilUsuario(this.usuario.id!, {
        avatar_url: publicUrl,
      });
      this.avatarUrl = publicUrl;
      await this.authService.refreshUsuario();
    }

    this.imageChangedEvent = null;
    this.croppedImage = null;
    this.showCropper = false;
    this.isUploading = false;
  }


  private async cargarAvatar() {
    if (!this.usuario) return;

    if (this.usuario.avatar_url) {
      this.avatarUrl = this.usuario.avatar_url;
    } else {
      this.avatarUrl = 'assets/img/usuario.png';
    }
  }


}
