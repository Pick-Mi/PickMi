import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MensajeFiltro, MensajeWeb, MensajeWebTipo } from '../../../data/interfaces/mensajes';
import { MessagesService } from '../../../core/services/messages.service';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit {
  mensajes: MensajeWeb[] = [];
  seleccionado: MensajeWeb | null = null;
  filtros: MensajeFiltro = { tipo: 'todos', leido: undefined, search: '' };
  loading = false;
  updatingEstado = false;
  error: string | null = null;

  constructor(private messagesService: MessagesService, private loaderService: LoaderService) {}

  ngOnInit(): Promise<void> {
    return this.cargarMensajes();
  }

  get totalNoLeidos(): number {
    return this.mensajes.filter(m => !m.leido).length;
  }

  async cargarMensajes(showLoader = true): Promise<void> {
    this.loading = true;
    this.error = null;
    if (showLoader) this.loaderService.show();

    try {
      const { data, error } = await this.messagesService.listarMensajes(this.filtros);
      if (error) {
        this.error = 'No se pudieron cargar los mensajes. Intenta nuevamente.';
        this.mensajes = [];
        return;
      }

      this.mensajes = data;
      if (this.seleccionado) {
        this.seleccionado = this.mensajes.find(m => m.id === this.seleccionado?.id) || null;
      }
    } catch (err) {
      console.error('Error al cargar mensajes', err);
      this.error = 'Ocurrio un error inesperado. Intenta nuevamente.';
      this.mensajes = [];
    } finally {
      this.loading = false;
      if (showLoader) this.loaderService.hide();
    }
  }

  async seleccionarMensaje(mensaje: MensajeWeb): Promise<void> {
    this.seleccionado = mensaje;
    if (!mensaje.leido) {
      await this.cambiarEstadoLectura(mensaje, true, false);
    }
  }

  async cambiarEstadoLectura(mensaje: MensajeWeb, leido: boolean, recargarLista = true): Promise<void> {
    if (this.updatingEstado) return;

    this.updatingEstado = true;
    try {
      const { error } = await this.messagesService.actualizarEstadoLectura(mensaje.id, leido);
      if (error) {
        this.error = 'No se pudo actualizar el estado de lectura.';
        return;
      }

      if (recargarLista) {
        await this.cargarMensajes(false);
      } else {
        mensaje.leido = leido;
        if (this.seleccionado?.id === mensaje.id) {
          this.seleccionado = { ...mensaje };
        }
      }
    } catch (err) {
      console.error('Error al cambiar estado de lectura', err);
      this.error = 'Ocurrio un error inesperado al actualizar el mensaje.';
    } finally {
      this.updatingEstado = false;
    }
  }

  async marcarTodosComoLeidos(): Promise<void> {
    const ids = this.mensajes.filter(m => !m.leido).map(m => m.id);
    if (!ids.length) return;

    this.loading = true;
    this.loaderService.show();

    try {
      const { error } = await this.messagesService.marcarTodosComoLeidos(ids);
      if (error) {
        this.error = 'No se pudieron marcar todos como leidos.';
        return;
      }
      await this.cargarMensajes(false);
    } catch (err) {
      console.error('Error al marcar todos como leidos', err);
      this.error = 'Ocurrio un error al marcar los mensajes.';
    } finally {
      this.loading = false;
      this.loaderService.hide();
    }
  }

  setFiltroLeido(leido: boolean | undefined): void {
    this.filtros.leido = leido;
    this.cargarMensajes();
  }

  setFiltroTipo(tipo: MensajeFiltro['tipo']): void {
    this.filtros.tipo = tipo;
    this.cargarMensajes();
  }

  async buscar(): Promise<void> {
    await this.cargarMensajes();
  }

  limpiarBusqueda(): void {
    this.filtros.search = '';
    this.cargarMensajes();
  }

  getTipoLabel(tipo: MensajeWebTipo): string {
    switch (tipo) {
      case 'comercio':
        return 'Comercio';
      case 'plan':
        return 'Plan';
      default:
        return 'Usuario';
    }
  }

  recortar(texto: string, max = 90): string {
    return texto.length > max ? `${texto.substring(0, max)}...` : texto;
  }

  trackByMensaje(index: number, mensaje: MensajeWeb): string {
    return mensaje.id;
  }
}
