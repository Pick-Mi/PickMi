import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { BusinessType } from '../../data/interfaces/business-type';

@Injectable({ providedIn: 'root' })
export class BusinessTypeService {
  private supabase: SupabaseClient;
  private readonly table = 'pick_tipo_comercio';

  constructor(private authService: AuthService) {
    this.supabase = this.authService.getSupabaseClient();
  }

  async obtenerTipos(): Promise<BusinessType[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data as BusinessType[];
  }

  async obtenerTipoPorId(id: number): Promise<BusinessType | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as BusinessType;
  }

  async crearTipo(payload: Omit<BusinessType, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<BusinessType> {
    const { data, error } = await this.supabase
      .from(this.table)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as BusinessType;
  }

  async actualizarTipo(id: number, cambios: Partial<BusinessType>): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update({
        ...cambios,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  async eliminarTipo(id: number): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async cambiarEstado(id: number, estado: boolean): Promise<void> {
    await this.actualizarTipo(id, { estado });
  }
}
