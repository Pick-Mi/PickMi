import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { MensajeFiltro, MensajeWeb } from '../../data/interfaces/mensajes';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = this.authService.getSupabaseClient();
  }

  async listarMensajes(filtros: MensajeFiltro = {}): Promise<{ data: MensajeWeb[]; error: string | null }> {
    let query = this.supabase
      .from('pick_mensajes_web')
      .select('*')
      .order('fecha_envio', { ascending: false });

    if (typeof filtros.leido === 'boolean') {
      query = query.eq('leido', filtros.leido);
    }

    if (filtros.tipo && filtros.tipo !== 'todos') {
      query = query.eq('tipo', filtros.tipo);
    }

    if (filtros.search?.trim()) {
      const term = `%${filtros.search.trim()}%`;
      query = query.or(`nombre.ilike.${term},email.ilike.${term},asunto.ilike.${term},mensaje.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al listar mensajes web:', error.message);
      return { data: [], error: error.message };
    }

    return { data: (data as MensajeWeb[]) ?? [], error: null };
  }

  async actualizarEstadoLectura(id: string, leido: boolean): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from('pick_mensajes_web')
      .update({ leido })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar estado de lectura:', error.message);
      return { error: error.message };
    }

    return { error: null };
  }

  async marcarTodosComoLeidos(ids: string[]): Promise<{ error: string | null }> {
    if (!ids.length) return { error: null };

    const { error } = await this.supabase
      .from('pick_mensajes_web')
      .update({ leido: true })
      .in('id', ids);

    if (error) {
      console.error('Error al marcar todos como leídos:', error.message);
      return { error: error.message };
    }

    return { error: null };
  }
}
