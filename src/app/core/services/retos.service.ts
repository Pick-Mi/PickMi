import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickReto } from '../../data/interfaces/retos';

@Injectable({ providedIn: 'root' })
export class RetosService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = this.authService.getSupabaseClient();
  }

  async obtenerRetos(): Promise<PickReto[]> {
    const { data, error } = await this.supabase
      .from('pick_retos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async crearReto(reto: Omit<PickReto, 'reto_id' | 'created_at'>): Promise<void> {
    const { error } = await this.supabase.from('pick_retos').insert(reto);
    if (error) throw error;
  }

  async actualizarReto(retoId: string, cambios: Partial<PickReto>): Promise<void> {
    const { error } = await this.supabase
      .from('pick_retos')
      .update(cambios)
      .eq('reto_id', retoId);
    if (error) throw error;
  }

  async eliminarReto(retoId: string): Promise<void> {
    const { error } = await this.supabase
      .from('pick_retos')
      .delete()
      .eq('reto_id', retoId);
    if (error) throw error;
  }
}
