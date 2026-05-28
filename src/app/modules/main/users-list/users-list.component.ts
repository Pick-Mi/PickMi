import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PickUsuario, TipoUsuario } from '../../../data/interfaces/usuarios';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  clientes: PickUsuario[] = [];
  loading = false;
  error: string | null = null;
  ultimaActualizacion: Date | null = null;

  busqueda = '';
  filtroEstatus: 'todos' | 'activo' | 'inactivo' = 'todos';

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
      this.ultimaActualizacion = new Date();
    } catch (err) {
      console.error('Error al cargar clientes', err);
      this.error = 'Ocurrió un error inesperado. Intenta nuevamente.';
      this.clientes = [];
    } finally {
      this.loading = false;
      this.loaderService.hide();
    }
  }

  get totalActivos30dias(): number {
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    return this.clientes.filter(c => {
      const fecha = c.fecha_actualizacion ?? c.fecha_creacion;
      return fecha ? new Date(fecha) >= hace30 : false;
    }).length;
  }

  get nuevosDelMes(): number {
    const ahora = new Date();
    return this.clientes.filter(c => {
      if (!c.fecha_creacion) return false;
      const f = new Date(c.fecha_creacion);
      return f.getFullYear() === ahora.getFullYear() && f.getMonth() === ahora.getMonth();
    }).length;
  }

  get porcentajeActivos(): number {
    if (!this.clientes.length) return 0;
    const activos = this.clientes.filter(c => c.estatus === 'activo').length;
    return Math.round((activos / this.clientes.length) * 100);
  }

  get clientesFiltrados(): PickUsuario[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.clientes.filter(c => {
      const matchEstatus = this.filtroEstatus === 'todos' || c.estatus === this.filtroEstatus;
      if (!matchEstatus) return false;
      if (!q) return true;
      const nombre = `${c.nombre} ${c.apellido}`.toLowerCase();
      return nombre.includes(q) || (c.email ?? '').toLowerCase().includes(q) || (c.telefono ?? '').includes(q);
    });
  }

  trackByUsuario(index: number, usuario: PickUsuario): string {
    return usuario.id ?? `${usuario.email ?? 'sin-email'}-${index}`;
  }
}
