import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickUsuario, UsuariosFiltro } from '../../data/interfaces/usuarios';



@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = this.authService.getSupabaseClient();
  }

  /**
   * Obtiene el perfil del usuario por ID
   */
  async getPerfilUsuario(id: string): Promise<PickUsuario | null> {
    const { data, error } = await this.supabase
      .from('pick_usuarios')
      .select('*')
      .eq('id', id)
      .maybeSingle<PickUsuario>();

    if (error) {
      console.error('Error al obtener perfil de usuario:', error.message);
      return null;
    }

    return data;
  }

  /**
   * Obtiene la lista de usuarios aplicando filtros opcionales
   */
  async listarUsuarios(filtros: UsuariosFiltro = {}): Promise<{ data: PickUsuario[]; error: string | null }> {
    let query = this.supabase
      .from('pick_usuarios')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (filtros.estatus) {
      query = query.eq('estatus', filtros.estatus);
    }

    if (filtros.tipo_usuario) {
      query = query.eq('tipo_usuario', filtros.tipo_usuario);
    }

    if (filtros.search) {
      const term = filtros.search.trim();
      if (term.length) {
        const pattern = `%${term}%`;
        query = query.or(`nombre.ilike.${pattern},apellido.ilike.${pattern},email.ilike.${pattern}`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al listar usuarios:', error.message);
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  }

  /**
   * Crea un nuevo usuario
   */
  async crearUsuario(usuario: Partial<PickUsuario>): Promise<{ data: PickUsuario | null; error: string | null }> {
    const payload = {
      ...usuario,
      fecha_creacion: usuario.fecha_creacion ?? new Date().toISOString(),
      fecha_registro: usuario.fecha_registro ?? new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('pick_usuarios')
      .insert([payload])
      .select('*')
      .single<PickUsuario>();

    if (error) {
      console.error('Error al crear usuario:', error.message);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  }

  /**
   * Actualiza el perfil del usuario
   */
  async actualizarPerfilUsuario(id: string, cambios: Partial<PickUsuario>): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from('pick_usuarios')
      .update(cambios)
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar perfil de usuario:', error.message);
      return { error: error.message };
    }

    return { error: null };
  }

  /**
   * Alias para reutilizar la misma logica de actualizacion desde otros componentes
   */
  async actualizarUsuario(id: string, cambios: Partial<PickUsuario>): Promise<{ error: string | null }> {
    return this.actualizarPerfilUsuario(id, cambios);
  }

  /**
   * Elimina un usuario por ID
   */
  async eliminarUsuario(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from('pick_usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar usuario:', error.message);
      return { error: error.message };
    }

    return { error: null };
  }

  /**
   * Cambia el estatus del usuario a "activo"
   */
  async activarPerfilUsuario(id: string): Promise<{ error: string | null }> {
    return this.actualizarPerfilUsuario(id, { estatus: 'activo' });
  }
}
