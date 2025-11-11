import { Injectable } from "@angular/core";
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickReview } from "../../data/interfaces/reviews";

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

    async obtenerReviewsGlobales(params: {
        pagina: number;
        limite: number;
        estatus?: 'activo' | 'inactivo';
        busqueda?: string;
    }): Promise<{ data: PickReview[]; total: number; }> {
        const { pagina, limite, estatus, busqueda } = params;
        const from = (pagina - 1) * limite;
        const to = from + limite - 1;

        let query = this.supabase
            .from('pick_comentarios')
            .select(`
                id,
                comentario,
                calificacion,
                fecha_comentario,
                estatus,
                pick_comercios ( id, nombre ),
                pick_usuarios ( nombre, apellido, avatar_url )
            `, { count: 'exact' })
            .order('fecha_comentario', { ascending: false })
            .range(from, to);

        if (estatus) {
            query = query.eq('estatus', estatus);
        }

        if (busqueda) {
            const term = this.formatSearchTerm(busqueda);
            query = query.or(`comentario.ilike.${term},pick_comercios.nombre.ilike.${term},pick_usuarios.nombre.ilike.${term},pick_usuarios.apellido.ilike.${term}`);
        }

        const { data, count, error } = await query;

        if (error || !data) {
            console.error('Error obteniendo reviews:', error);
            return { data: [], total: 0 };
        }

        return {
            data: data.map(row => this.mapReview(row)),
            total: count ?? 0
        };
    }

    async actualizarEstatusReview(id: string, estatus: 'activo' | 'inactivo'): Promise<void> {
        const { error } = await this.supabase
            .from('pick_comentarios')
            .update({ estatus })
            .eq('id', id);

        if (error) {
            console.error('Error actualizando estatus del review:', error);
            throw error;
        }
    }

    async eliminarReview(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('pick_comentarios')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando review:', error);
            throw error;
        }
    }

    private mapReview(row: any): PickReview {
        const comercio = Array.isArray(row.pick_comercios) ? row.pick_comercios[0] : row.pick_comercios;
        const usuario = Array.isArray(row.pick_usuarios) ? row.pick_usuarios[0] : row.pick_usuarios;

        return {
            id: row.id,
            comentario: row.comentario,
            calificacion: row.calificacion,
            fecha_comentario: row.fecha_comentario,
            estatus: row.estatus,
            comercio: {
                id: comercio?.id ?? '',
                nombre: comercio?.nombre ?? 'Sin comercio'
            },
            usuario: {
                nombre: usuario?.nombre ?? 'Usuario',
                apellido: usuario?.apellido ?? '',
                avatar_url: usuario?.avatar_url ?? ''
            }
        };
    }

    private formatSearchTerm(value: string): string {
        const sanitized = value
            .replace(/\*/g, '\\*')
            .replace(/,/g, '\\,');
        return `*${sanitized}*`;
    }
}
