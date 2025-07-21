import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickUsuario } from '../../data/interfaces/usuarios';

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
  async getPerfilUsuario(id: number): Promise<PickUsuario | null> {
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
   * Cambia el estatus del usuario a "activo"
   */
  async activarPerfilUsuario(id: string): Promise<{ error: string | null }> {
    return this.actualizarPerfilUsuario(id, { estatus: 'activo' });
  }
}
