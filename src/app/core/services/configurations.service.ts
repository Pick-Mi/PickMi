import { Injectable } from "@angular/core";
import { SupabaseClient } from "@supabase/supabase-js";
import { AuthService } from "./auth.service";
import { PickConfiguracionGlobal } from "../../data/interfaces/configurations";

@Injectable({ providedIn: 'root' })
export class ConfigurationsService {
  private supabase: SupabaseClient;
  private readonly table = 'pick_configuracion_global';

  constructor(private authService: AuthService) {
    this.supabase = this.authService.getSupabaseClient();
  }

  async obtenerConfiguraciones(): Promise<PickConfiguracionGlobal[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data as PickConfiguracionGlobal[];
  }

  async obtenerConfiguracionPorId(id: string): Promise<PickConfiguracionGlobal | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as PickConfiguracionGlobal;
  }

  async crearConfiguracion(config: Omit<PickConfiguracionGlobal, 'id' | 'fecha_creacion'>): Promise<PickConfiguracionGlobal> {
    const { data, error } = await this.supabase
      .from(this.table)
      .insert(config)
      .select()
      .single();

    if (error) throw error;
    return data as PickConfiguracionGlobal;
  }

  async actualizarConfiguracion(id: string, config: Partial<PickConfiguracionGlobal>): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update(config)
      .eq('id', id);

    if (error) throw error;
  }

  async eliminarConfiguracion(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async obtenerConfiguracionPorParametro(parametro: string): Promise<PickConfiguracionGlobal | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('parametro', parametro)
      .maybeSingle();

    if (error) throw error;
    return data as PickConfiguracionGlobal | null;
  }
}
