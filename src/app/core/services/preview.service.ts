import { Injectable } from '@angular/core';
import { catchError, forkJoin, from, map, of } from 'rxjs';
import { AuthService } from './auth.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { PickGallery } from '../../data/interfaces/galeria';
import { PickProductos } from '../../data/interfaces/productos';
import { PickHorarios } from '../../data/interfaces/horarios';
import { PickComercioConTipoYUbicacion } from '../../data/interfaces/preview';
import { PickMenuPdf } from '../../data/interfaces/menus';

@Injectable({
  providedIn: 'root'
})
export class PreviewService {

    private supabase: SupabaseClient;

    constructor(private authService: AuthService) {
        this.supabase = this.authService.getSupabaseClient();
    }

    async getComercioWithUbicacion(comercioId: string): Promise<PickComercioConTipoYUbicacion | null> {
        const { data, error } = await this.supabase
            .from('pick_comercios')
            .select(`
            *,
            pick_tipo_comercio:tipo_comercio_id (
                nombre
            ),
            pick_municipios:municipio (
                nombre,
                pick_departamentos:id_departamento (
                nombre
                )
            )
            `)
            .eq('id', comercioId)
            .single<PickComercioConTipoYUbicacion>();

        if (error) {
            console.error('❌ Error cargando comercio:', error);
            return null;
        }

        return data;
    }


    async getGaleria(comercioId: string): Promise<PickGallery[]> {
        const { data, error } = await this.supabase
        .from('pick_imagenes_comercios')
        .select('*')
        .eq('comercio_id', comercioId);

        if (error) {
            console.error('❌ Error obteniendo imágenes:', error);
            return [];
        }
        return data as PickGallery[];
    }

    async getHorarios(comercioId: string): Promise<PickHorarios[]> {
        const { data, error } = await this.supabase
        .from('pick_horarios')
        .select('*')
        .eq('comercio_id', comercioId);

        if (error) {
            console.error('❌ Error obteniendo horarios:', error);
            return [];
        }
        return data as PickHorarios[];
    }

    async getProductos(comercioId: string): Promise<PickProductos[]> {
        const { data, error } = await this.supabase
        .from('pick_productos')
        .select('*')
        .eq('comercio_id', comercioId);

        if (error) {
            console.error('❌ Error obteniendo productos:', error);
            return [];
        }
        return data as PickProductos[];
    }

    async getMenus(comercioId: string): Promise<PickMenuPdf[]> {
        const { data, error } = await this.supabase
        .from('pick_menus')
        .select('*')
        .eq('comercio_id', comercioId)
        .eq('activo', true);

        if (error) {
            console.error('❌ Error obteniendo menús:', error);
            return [];
        }
        return data as PickMenuPdf[];
    }

    evaluarSiEstaAbierto(horarios: any[]) {
        const now = new Date();
        const dia = now.toLocaleDateString('es-SV', { weekday: 'long' }).toLowerCase();
        const hoy = horarios.find(h => h.dia?.toLowerCase() === dia);

        if (!hoy || !hoy.hora_apertura || !hoy.hora_cierre) return false;

        const [hA, mA] = hoy.hora_apertura.split(':').map(Number);
        const [hC, mC] = hoy.hora_cierre.split(':').map(Number);
        const apertura = new Date();
        apertura.setHours(hA, mA, 0);
        const cierre = new Date();
        cierre.setHours(hC, mC, 0);

        return now >= apertura && now <= cierre;
    }

    getComercioPublicData(comercioId: string) {
        return forkJoin({
            comercio: from(this.getComercioWithUbicacion(comercioId)).pipe(
            catchError(err => {
                console.error('Error en comercio:', err);
                return of(null);
            })
            ),
            imagenes: from(this.getGaleria(comercioId)).pipe(
            catchError(err => {
                console.error('Error en galería:', err);
                return of([]);
            })
            ),
            horarios: from(this.getHorarios(comercioId)).pipe(
            catchError(err => {
                console.error('Error en horarios:', err);
                return of([]);
            })
            ),
            productos: from(this.getProductos(comercioId)).pipe(
            catchError(err => {
                console.error('Error en productos:', err);
                return of([]);
            })
            )
        }).pipe(
            map(res => ({
            ...res,
            abiertoAhora: this.evaluarSiEstaAbierto(res.horarios)
            }))
        );
    }

}