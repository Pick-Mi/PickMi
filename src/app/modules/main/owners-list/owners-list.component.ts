import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../core/services/profile.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PickUsuario, TipoUsuario } from '../../../data/interfaces/usuarios';

@Component({
  selector: 'app-owners-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owners-list.component.html',
  styleUrl: './owners-list.component.scss'
})
export class OwnersListComponent implements OnInit {
  propietarios: PickUsuario[] = [];
  loading = false;
  error: string | null = null;

  constructor(private profileService: ProfileService, private loaderService: LoaderService) {}

  async ngOnInit(): Promise<void> {
    await this.cargarPropietarios();
  }

  async cargarPropietarios(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.loaderService.show();

    try {
      const { data, error } = await this.profileService.listarUsuarios({
        tipo_usuario: TipoUsuario.PROPIETARIO
      });

      if (error) {
        this.error = 'No se pudieron cargar los propietarios. Intenta nuevamente.';
        this.propietarios = [];
        return;
      }

      this.propietarios = data;
    } catch (err) {
      console.error('Error al cargar propietarios', err);
      this.error = 'Ocurrio un error inesperado. Intenta nuevamente.';
      this.propietarios = [];
    } finally {
      this.loading = false;
      this.loaderService.hide();
    }
  }

  trackByPropietario(index: number, propietario: PickUsuario): string {
    return propietario.id ?? `${propietario.email ?? 'sin-email'}-${index}`;
  }
}
