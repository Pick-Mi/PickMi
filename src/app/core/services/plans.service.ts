import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickPlan } from '../../data/interfaces/planes';

@Injectable({ providedIn: 'root' })
export class PlansService {
  private supabase: SupabaseClient;
  private readonly table = 'pick_planes';

  constructor(private authService: AuthService) {
    this.supabase = this.authService.getSupabaseClient();
  }

  async listarPlanes(): Promise<PickPlan[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as PickPlan[];
  }

  async crearPlan(payload: Omit<PickPlan, 'id' | 'created_at' | 'updated_at'>): Promise<PickPlan> {
    await this.clearExclusiveFlags({
      clearDefault: payload.es_default,
      clearTrial: payload.es_trial_default
    });

    const { data, error } = await this.supabase
      .from(this.table)
      .insert({
        ...payload,
        limites: payload.limites ?? {},
        features: payload.features ?? {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as PickPlan;
  }

  async actualizarPlan(id: string, cambios: Partial<PickPlan>): Promise<PickPlan> {
    await this.clearExclusiveFlags(
      {
        clearDefault: Boolean(cambios.es_default),
        clearTrial: Boolean(cambios.es_trial_default)
      },
      id
    );

    const { data, error } = await this.supabase
      .from(this.table)
      .update({
        ...cambios,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PickPlan;
  }

  async eliminarPlan(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private async clearExclusiveFlags(
    flags: { clearDefault: boolean; clearTrial: boolean },
    excludeId?: string
  ): Promise<void> {
    if (flags.clearDefault) {
      let clearDefaultQuery = this.supabase
        .from(this.table)
        .update({ es_default: false })
        .eq('es_default', true);
      if (excludeId) {
        clearDefaultQuery = clearDefaultQuery.neq('id', excludeId);
      }
      const { error } = await clearDefaultQuery;
      if (error) throw error;
    }

    if (flags.clearTrial) {
      let clearTrialQuery = this.supabase
        .from(this.table)
        .update({ es_trial_default: false })
        .eq('es_trial_default', true);
      if (excludeId) {
        clearTrialQuery = clearTrialQuery.neq('id', excludeId);
      }
      const { error } = await clearTrialQuery;
      if (error) throw error;
    }
  }
}
