import { Injectable } from "@angular/core";
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickHorarios } from "../../data/interfaces/horarios";

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {

    private supabase: SupabaseClient;

    constructor(private authService: AuthService) {
        this.supabase = this.authService.getSupabaseClient();
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

    async getComentariosPorComercioPaginado(
        comercioId: string,
        pagina: number,
        limite: number
        ): Promise<{
        data: {
            comentario: string;
            calificacion: number;
            fecha: string;
            usuarioNombre: string;
            usuarioAvatar: string;
        }[];
        total: number;
        error: any;
        }> {
        const from = (pagina - 1) * limite;
        const to = from + limite - 1;

        const { data, count, error } = await this.supabase
            .from('pick_comentarios')
            .select(
            `
            comentario,
            calificacion,
            fecha_comentario,
            pick_usuarios (
                nombre,
                apellido,
                avatar_url
            )
            `,
            { count: 'exact' }
            )
            .eq('comercio_id', comercioId)
            .eq('estatus', 'activo')
            .order('fecha_comentario', { ascending: false })
            .range(from, to);

        if (error || !data) {
            console.error('Error obteniendo comentarios paginados:', error);
            return { data: [], total: 0, error };
        }

        const parsedData = data.map(item => {
            const usuario = Array.isArray(item.pick_usuarios)
            ? item.pick_usuarios[0]
            : item.pick_usuarios;

            return {
            comentario: item.comentario,
            calificacion: item.calificacion,
            fecha: item.fecha_comentario,
            usuarioNombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario',
            usuarioAvatar: usuario?.avatar_url ?? '',
            };
        });

        return {
            data: parsedData,
            total: count ?? 0,
            error: null
        };
    }




}