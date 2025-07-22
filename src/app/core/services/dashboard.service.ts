import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { ActividadUsuario, PickUsuario } from '../../data/interfaces/usuarios';
import { DashboardResumen } from '../../data/interfaces/dashboard';
import { MensajeSolicitud } from '../../data/interfaces/mensajes';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
    private supabase: SupabaseClient;
  
    constructor(private authService: AuthService) {
        this.supabase = this.authService.getSupabaseClient();
    }

    async getDashboardData(propietarioId: string, comercioId?: string): Promise<DashboardResumen> {
        const [
            totalVistas,
            totalFavoritos,
            resumenCalificaciones,
            distribucion,
            calificacionesPorComercio,
            vistasPorComercio,
            favoritosPorComercio,
        ] = await Promise.all([
            this.getTotalVistas(propietarioId, comercioId),
            this.getTotalFavoritos(propietarioId, comercioId),
            this.getResumenCalificaciones(propietarioId, comercioId),
            this.getDistribucionCalificaciones(propietarioId, comercioId),
            this.getCalificacionesResumen(propietarioId, comercioId),
            this.getVistasResumen(propietarioId, comercioId),
            this.getFavoritosResumen(propietarioId, comercioId),
        ]);

        return {
            totalVistas,
            totalFavoritos,
            promedioGlobal: resumenCalificaciones.promedioGlobal,
            totalComentariosGlobal: resumenCalificaciones.totalComentarios,
            calificacionesDistribucion: distribucion,
            calificacionesPorComercio,
            vistasPorComercio,
            favoritosPorComercio,
        };
    }

    // TOTAL VISTAS
    async getTotalVistas(propietarioId: string, comercioId?: string): Promise<number> {
        const comercioIds = comercioId
            ? [comercioId]
            : await this.getComercioIdsDelPropietario(propietarioId);

        if (comercioIds.length === 0) return 0;

        const { count, error } = await this.supabase
            .from('pick_vistas_comercios')
            .select('*', { count: 'exact', head: true })
            .in('comercio_id', comercioIds);

        if (error) return 0;
        return count ?? 0;
        }

        // TOTAL FAVORITOS
        async getTotalFavoritos(propietarioId: string, comercioId?: string): Promise<number> {
        const comercioIds = comercioId
            ? [comercioId]
            : await this.getComercioIdsDelPropietario(propietarioId);

        if (comercioIds.length === 0) return 0;

        const { count, error } = await this.supabase
            .from('pick_usuarios_comercios_favoritos')
            .select('*', { count: 'exact', head: true })
            .in('comercio_id', comercioIds);

        if (error) return 0;
        return count ?? 0;
    }

    // RESUMEN CALIFICACIONES (Promedio global + total)
    async getResumenCalificaciones(propietarioId: string, comercioId?: string): Promise<{ promedioGlobal: number; totalComentarios: number }> {
        const comercioIds = comercioId
            ? [comercioId]
            : await this.getComercioIdsDelPropietario(propietarioId);

        if (comercioIds.length === 0) return { promedioGlobal: 0, totalComentarios: 0 };

        const { data, error } = await this.supabase
            .from('pick_comentarios')
            .select('calificacion')
            .in('comercio_id', comercioIds)
            .eq('estatus', 'activo');

        const totalComentarios = data?.length ?? 0;
        const promedioGlobal =
            totalComentarios > 0
            ? +((data ?? []).reduce((s, c) => s + c.calificacion, 0) / totalComentarios).toFixed(2)
            : 0;

        return { promedioGlobal, totalComentarios };
    }

    // DISTRIBUCIÓN CALIFICACIONES (1–5)
    async getDistribucionCalificaciones(propietarioId: string, comercioId?: string): Promise<{ calificacion: number; total: number }[]> {
        const comercioIds = comercioId
            ? [comercioId]
            : await this.getComercioIdsDelPropietario(propietarioId);

        if (comercioIds.length === 0) return [];

        const { data, error } = await this.supabase
            .from('pick_comentarios')
            .select('calificacion')
            .in('comercio_id', comercioIds)
            .eq('estatus', 'activo');

        if (error || !data) return [];

        return [1,2,3,4,5].map(c => ({
            calificacion: c,
            total: data.filter(d => d.calificacion === c).length
        }));
    }

    // VISTAS RESUMEN POR COMERCIO
    async getVistasResumen(propietarioId: string, comercioId?: string): Promise<{ comercio: string; total: number }[]> {
        const comercios = await this.getComercios(propietarioId, comercioId);
        const results: { comercio: string; total: number }[] = [];

        for (const c of comercios) {
            const { count } = await this.supabase
            .from('pick_vistas_comercios')
            .select('*', { count: 'exact', head: true })
            .eq('comercio_id', c.id);

            results.push({
            comercio: c.nombre,
            total: count ?? 0,
            });
        }

        return results;
    }

    // FAVORITOS RESUMEN POR COMERCIO
    async getFavoritosResumen(propietarioId: string, comercioId?: string): Promise<{ comercio: string; total: number }[]> {
        const comercios = await this.getComercios(propietarioId, comercioId);
        const results: { comercio: string; total: number }[] = [];

        for (const c of comercios) {
            const { count } = await this.supabase
            .from('pick_usuarios_comercios_favoritos')
            .select('*', { count: 'exact', head: true })
            .eq('comercio_id', c.id);

            results.push({
            comercio: c.nombre,
            total: count ?? 0,
            });
        }

        return results;
    }

    // CALIFICACIONES RESUMEN POR COMERCIO
    async getCalificacionesResumen(propietarioId: string, comercioId?: string): Promise<{ comercio: string; promedio: number; totalComentarios: number }[]> {
        const comercios = await this.getComercios(propietarioId, comercioId);
        const results: { comercio: string; promedio: number; totalComentarios: number }[] = [];

        for (const c of comercios) {
            const { data } = await this.supabase
            .from('pick_comentarios')
            .select('calificacion')
            .eq('comercio_id', c.id)
            .eq('estatus', 'activo');

            const total = data?.length ?? 0;
            const promedio = total > 0
            ? +((data ?? []).reduce((s, c) => s + c.calificacion, 0) / total).toFixed(2)
            : 0;

            results.push({
            comercio: c.nombre,
            promedio,
            totalComentarios: total,
            });
        }

        return results;
    }    

    async getTendenciaVistasPorComercio(comercioIdOrList: string | string[], periodo: 'diario' | 'semanal' | 'mensual'): Promise<{ fecha: string; total: number }[]> {
        let format: string;
        switch (periodo) {
            case 'semanal':
                format = 'IYYY-IW';
                break;
            case 'mensual':
                format = 'YYYY-MM';
                break;
            default:
                format = 'YYYY-MM-DD';
        }

        const comercioIds = Array.isArray(comercioIdOrList) ? comercioIdOrList : [comercioIdOrList];

        // ⚠️ No enviar array vacío
        if (comercioIds.length === 0) return [];

        const { data, error } = await this.supabase
            .rpc('get_tendencia_vistas', {
            comercio_ids: comercioIds,
            fecha_format: format
            });

        if (error || !data) {
            console.error('Error al obtener tendencia:', error);
            return [];
        }

        return data.map((d: any) => ({
            fecha: d.fecha,
            total: d.total
        }));
    }

    private async getComercioIdsDelPropietario(propietarioId: string): Promise<string[]> {
        const { data, error } = await this.supabase
            .from('pick_comercios')
            .select('id')
            .eq('usuario_id', propietarioId);

        if (error || !data) return [];
        return data.map(c => c.id);
    }

    public async getComercios(propietarioId: string, comercioId?: string): Promise<{ id: string; nombre: string }[]> {
        if (comercioId) {
            const { data, error } = await this.supabase
            .from('pick_comercios')
            .select('id, nombre')
            .eq('id', comercioId)
            .eq('usuario_id', propietarioId)
            .maybeSingle();

            return data ? [data] : [];
        } else {
            const { data, error } = await this.supabase
            .from('pick_comercios')
            .select('id, nombre')
            .eq('usuario_id', propietarioId);

            return error || !data ? [] : data;
        }
    }

    async getActividadReciente(propietarioId: string, comercioId?: string): Promise<ActividadUsuario[]> {
        // Obtener comercios según filtro
        let query = this.supabase
                        .from('pick_comercios')
                        .select('id, nombre')
                        .eq('usuario_id', propietarioId);

        if (comercioId) {
            query = query.in('id', [comercioId]);
        }

        const { data: comercios, error } = await query;
        
        if (error || !comercios || comercios.length === 0) return [];

        const comercioMap = new Map<string, string>();
        const comercioIds: string[] = [];

        for (const c of comercios) {
            comercioMap.set(c.id, c.nombre);
            comercioIds.push(c.id);
        }

        const favoritosQuery = this.supabase
            .from('pick_usuarios_comercios_favoritos')
            .select('usuario_id, comercio_id, fecha_favorito')
            .in('comercio_id', comercioIds)
            .order('fecha_favorito', { ascending: false })
            .limit(5);

        const comentariosQuery = this.supabase
            .from('pick_comentarios')
            .select('usuario_id, comercio_id, calificacion, comentario, fecha_comentario')
            .in('comercio_id', comercioIds)
            .eq('estatus', 'activo')
            .order('fecha_comentario', { ascending: false })
            .limit(5);
            
        const [favoritosResult, comentariosResult] = await Promise.all([favoritosQuery, comentariosQuery]);

        const favoritos = favoritosResult.data ?? [];
        const comentarios = comentariosResult.data ?? [];

        const actividades: ActividadUsuario[] = [];

        for (const fav of favoritos) {
            actividades.push({
            tipo: 'favorito',
            usuarioNombre: await this.getNombreUsuario(fav.usuario_id),
            comercioNombre: comercioMap.get(fav.comercio_id) ?? '',
            fecha: fav.fecha_favorito,
            });
        }

        for (const com of comentarios) {
            actividades.push({
            tipo: com.comentario ? 'comentario' : 'calificacion',
            usuarioNombre: await this.getNombreUsuario(com.usuario_id),
            comercioNombre: comercioMap.get(com.comercio_id) ?? '',
            fecha: com.fecha_comentario,
            calificacion: com.calificacion,
            comentario: com.comentario,
            });
        }

        return actividades
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .slice(0, 5);
    }


    // Método auxiliar
    private async getNombreUsuario(usuarioId: string): Promise<string> {
        const { data } = await this.supabase
            .from('pick_usuarios')
            .select('nombre, apellido')
            .eq('id', usuarioId)
            .single();

        return (data ? `${data.nombre} ${data.apellido}` : 'Usuario');
    }

    async getDiasRestantesSuscripcion(usuarioId: string): Promise<{ diasRestantes: number; tipoPlan: string | null }> {
        const { data, error } = await this.supabase
            .from('pick_suscripciones_usuarios')
            .select('fecha_fin, tipo_plan')
            .eq('usuario_id', usuarioId)
            .eq('estado', 'activa')
            .order('fecha_fin', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return {
            diasRestantes: 0,
            tipoPlan: null
            };
        }

        const fechaFin = new Date(data.fecha_fin);
        const hoy = new Date();
        const diff = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        return {
            diasRestantes: diff > 0 ? diff : 0,
            tipoPlan: data.tipo_plan
        };
    }

    async obtenerMensajesSolicitudes(limit = 5): Promise<MensajeSolicitud[]> {
        const { data, error } = await this.supabase
        .from('pick_mensajes_solicitudes')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(limit);

        if (error) {
            console.error('Error al obtener mensajes y solicitudes:', error);
            return [];
        }

        return data || [];
    }

}
