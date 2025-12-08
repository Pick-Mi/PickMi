import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { ComercioResumen, PickUsuario, PlanResumen, PropietarioDetalle, PropietarioListado, UsuariosFiltro } from '../../data/interfaces/usuarios';



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
   * Lista propietarios incluyendo información de onboarding/plan
   */
  async listarPropietariosConPlan(): Promise<{ data: PropietarioListado[]; error: string | null }> {
    const { data, error } = await this.supabase
      .from('pick_propietarios')
      .select(`
        id,
        onboarding_status,
        plan_solicitado_id,
        plan_solicitado_at,
        plan_id,
        usuario:usuario_id (
          id,
          nombre,
          apellido,
          email,
          estatus,
          tipo_usuario,
          telefono,
          fecha_creacion
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al listar propietarios:', error.message);
      return { data: [], error: error.message };
    }

    const propietarios: PropietarioListado[] = (data ?? []).map((item: any) => {
      const usuario = item.usuario ?? {};
      return {
        propietario_id: item.id,
        onboarding_status: item.onboarding_status,
        plan_solicitado_id: item.plan_solicitado_id,
        plan_solicitado_at: item.plan_solicitado_at,
        plan_id: item.plan_id ?? null,
        ...usuario
      } as PropietarioListado;
    });

    return { data: propietarios, error: null };
  }

  /**
   * Obtiene el detalle de un propietario incluyendo planes y comercios.
   */
  async obtenerDetallePropietario(propietarioId: string): Promise<{ data: PropietarioDetalle | null; error: string | null }> {
    const { data, error } = await this.supabase
      .from('pick_propietarios')
      .select(`
        id,
        onboarding_status,
        plan_solicitado_id,
        plan_solicitado_at,
        plan_id,
        usuario:usuario_id (
          id,
          nombre,
          apellido,
          email,
          estatus,
          tipo_usuario,
          telefono,
          fecha_creacion
        ),
        plan:plan_id (id, nombre, slug, descripcion),
        plan_solicitado:plan_solicitado_id (id, nombre, slug, descripcion)
      `)
      .eq('id', propietarioId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error al obtener detalle del propietario:', error?.message);
      return { data: null, error: error?.message ?? 'Propietario no encontrado' };
    }

    const { data: comercios } = await this.supabase
      .from('pick_comercios')
      .select('id, nombre, estatus, tipo_entrega')
      .eq('propietario_id', propietarioId);

    const usuario = (data.usuario ?? {}) as any;
    const plan = Array.isArray((data as any).plan) ? (data as any).plan[0] : (data as any).plan;
    const planSolicitado = Array.isArray((data as any).plan_solicitado) ? (data as any).plan_solicitado[0] : (data as any).plan_solicitado;

    const detalle: PropietarioDetalle = {
      propietario_id: data.id,
      onboarding_status: data.onboarding_status,
      plan_solicitado_id: data.plan_solicitado_id,
      plan_solicitado_at: data.plan_solicitado_at,
      plan_id: data.plan_id ?? null,
      plan: (plan as PlanResumen) ?? null,
      plan_solicitado: (planSolicitado as PlanResumen) ?? null,
      comercios: (comercios as ComercioResumen[]) ?? [],
      id: usuario.id,
      nombre: usuario.nombre ?? '',
      apellido: usuario.apellido ?? '',
      email: usuario.email ?? '',
      estatus: usuario.estatus ?? '',
      tipo_usuario: usuario.tipo_usuario,
      telefono: usuario.telefono,
      fecha_creacion: usuario.fecha_creacion,
      fecha_registro: usuario.fecha_registro,
      creado_por: usuario.creado_por,
      fecha_actualizacion: usuario.fecha_actualizacion,
      actualizado_por: usuario.actualizado_por,
      avatar_url: usuario.avatar_url,
      en_periodo_prueba: usuario.en_periodo_prueba
    };

    return { data: detalle, error: null };
  }

  /**
   * Aprueba la solicitud de plan de un propietario.
   */
  async aprobarPlanPropietario(propietarioId: string, planSolicitadoId: string | null): Promise<{ error: string | null }> {
    const updates: Record<string, any> = {
      onboarding_status: 'activo',
      plan_solicitado_id: null,
      plan_solicitado_at: null
    };

    if (planSolicitadoId) {
      updates['plan_id'] = planSolicitadoId;
    }

    const { error } = await this.supabase
      .from('pick_propietarios')
      .update(updates)
      .eq('id', propietarioId);

    if (error) {
      console.error('Error al aprobar plan:', error.message);
      return { error: error.message };
    }

    return { error: null };
  }

  /**
   * Rechaza la solicitud de plan de un propietario.
   */
  async rechazarSolicitudPlan(propietarioId: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from('pick_propietarios')
      .update({
        onboarding_status: 'rechazado',
        plan_solicitado_id: null,
        plan_solicitado_at: null
      })
      .eq('id', propietarioId);

    if (error) {
      console.error('Error al rechazar solicitud de plan:', error.message);
      return { error: error.message };
    }

    return { error: null };
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
