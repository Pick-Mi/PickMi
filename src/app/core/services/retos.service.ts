import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickReto, RetoProgreso } from '../../data/interfaces/retos';

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

  async asignarRetoATodos(retoId: string): Promise<number> {
    const [{ data: usuarios }, { data: asignados }] = await Promise.all([
      this.supabase
        .from('pick_usuarios')
        .select('id')
        .eq('tipo_usuario', 'cliente')
        .eq('estatus', 'activo'),
      this.supabase
        .from('pick_retos_usuarios')
        .select('usuario_id')
        .eq('reto_id', retoId)
    ]);

    const yaAsignados = new Set((asignados ?? []).map((r: any) => r.usuario_id));
    const nuevos = (usuarios ?? [])
      .filter((u: any) => !yaAsignados.has(u.id))
      .map((u: any) => ({ usuario_id: u.id, reto_id: retoId }));

    if (!nuevos.length) return 0;

    const { error } = await this.supabase.from('pick_retos_usuarios').insert(nuevos);
    if (error) throw error;
    return nuevos.length;
  }

  async obtenerRetoPorId(retoId: string): Promise<PickReto> {
    const { data, error } = await this.supabase
      .from('pick_retos')
      .select('*')
      .eq('reto_id', retoId)
      .single();
    if (error) throw error;
    return data;
  }

  async obtenerProgresoReto(retoId: string): Promise<RetoProgreso[]> {
    const { data, error } = await this.supabase
      .from('pick_retos_usuarios')
      .select('id, usuario_id, progreso, completado, fecha_inicio, fecha_completado, usuario:usuario_id (nombre, apellido, email, avatar_url)')
      .eq('reto_id', retoId)
      .order('completado', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row: any) => {
      const u = Array.isArray(row.usuario) ? row.usuario[0] : row.usuario;
      return {
        id: row.id,
        usuario_id: row.usuario_id,
        progreso: row.progreso ?? 0,
        completado: row.completado ?? false,
        fecha_inicio: row.fecha_inicio,
        fecha_completado: row.fecha_completado,
        usuario_nombre: u?.nombre ?? '',
        usuario_apellido: u?.apellido ?? '',
        usuario_email: u?.email ?? '',
        usuario_avatar: u?.avatar_url ?? null,
      };
    }).sort((a, b) => {
      if (a.completado !== b.completado) return a.completado ? -1 : 1;
      if (a.completado && b.completado) {
        return new Date(a.fecha_completado!).getTime() - new Date(b.fecha_completado!).getTime();
      }
      return b.progreso - a.progreso;
    });
  }
}
