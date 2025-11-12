import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../core/services/profile.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PickUsuario, TipoUsuario } from '../../../data/interfaces/usuarios';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  clientes: PickUsuario[] = [];
  loading = false;
  error: string | null = null;

  constructor(private profileService: ProfileService, private loaderService: LoaderService) {}

  async ngOnInit(): Promise<void> {
    await this.cargarClientes();
  }

  async cargarClientes(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.loaderService.show();

    try {
      const { data, error } = await this.profileService.listarUsuarios({
        tipo_usuario: TipoUsuario.CLIENTE
      });

      if (error) {
        this.error = 'No se pudieron cargar los clientes. Intenta nuevamente.';
        this.clientes = [];
        return;
      }

      this.clientes = data;
    } catch (err) {
      console.error('Error al cargar clientes', err);
      this.error = 'Ocurrio un error inesperado. Intenta nuevamente.';
      this.clientes = [];
    } finally {
      this.loading = false;
      this.loaderService.hide();
    }
  }

  trackByUsuario(index: number, usuario: PickUsuario): string {
    return usuario.id ?? `${usuario.email ?? 'sin-email'}-${index}`;
  }
}
