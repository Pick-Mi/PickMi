import { Injectable } from "@angular/core";
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickHorarios } from "../../data/interfaces/horarios";

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

    private supabase: SupabaseClient;

    constructor(private authService: AuthService) {
        this.supabase = this.authService.getSupabaseClient();
    }

    async obtenerHorarios(comercioId: string): Promise<PickHorarios[]> {
        const { data, error } = await this.supabase
        .from('pick_horarios')
        .select('*')
        .eq('comercio_id', comercioId)
        .order('dia_semana', { ascending: true });

        if (error) throw error;
        return data;
    }

    async guardarHorarios(comercioId: string, horarios: PickHorarios[]): Promise<void> {
        const upsertData = horarios.map(h => ({
        ...h,
        comercio_id: comercioId,
        }));

        const { error } = await this.supabase
        .from('pick_horarios')
        .upsert(upsertData, { onConflict: 'comercio_id, dia_semana' });

        if (error) throw error;
    }

    async obtenerNombreComercio(comercioId: string): Promise<string> {
        const { data, error } = await this.supabase
        .from('pick_comercios')
        .select('nombre')
        .eq('id', comercioId)
        .single();

        if (error) throw error;
        return data.nombre;
    }

}