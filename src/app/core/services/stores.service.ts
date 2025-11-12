// src/app/core/services/stores.service.ts

import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickDepartamentos, PickMunicipios, PickComercio, PickTipoComercio } from '../../data/interfaces/comercios';
import { PickCategoria, PickSubcategoria } from '../../data/interfaces/categorias';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlataformasPickmi } from '../../data/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class StoresService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService, private http: HttpClient) {
    this.supabase = this.authService.getSupabaseClient();
  }

  async crearComercio(nuevoComercio: PickComercio): Promise<{ comercios: PickComercio[]; error: string | null }> {
    const { data, error } = await this.supabase.from('pick_comercios').insert(nuevoComercio);
    return { comercios: data || [], error: error?.message || null };
  }

  async listarComercios(): Promise<{ comercios: PickComercio[]; error: string | null }> {
    const { data, error } = await this.supabase
      .from('pick_comercios')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    return { comercios: data || [], error: error?.message || null };
  }

  async obtenerComerciosPorUsuario(usuarioId: string | undefined): Promise<{ comercios: PickComercio[]; error: string | null }> {
    const { data, error } = await this.supabase
      .from('pick_comercios')
      .select('*')
      .eq('usuario_id', usuarioId);

    return { comercios: data || [], error: error?.message || null };
  }

  async actualizarComercio(id: string, cambios: Partial<PickComercio>): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from('pick_comercios')
      .update(cambios)
      .eq('id', id);

    return { error: error?.message || null };
  }

  async eliminarComercio(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from('pick_comercios')
      .delete()
      .eq('id', id);

    return { error: error?.message || null };
  }

  async obtenerTiposComercio(): Promise<{ tipos: PickTipoComercio[]; error: string | null }> {
    const { data, error } = await this.supabase
        .from('pick_tipo_comercio')
        .select('*')
        .order('nombre', { ascending: true });

    return { tipos: data || [], error: error?.message || null };
  }

  async actualizarLogoComercio(comercioId: string, logoUrl: string) {
    const { error } = await this.supabase
      .from('pick_comercios')
      .update({ logo_url: logoUrl })
      .eq('id', comercioId);

    return { error };
  }

  async obtenerComercioPorId(id: string): Promise<{ comercio: PickComercio | null; error: any }> {
    const { data, error } = await this.supabase
      .from('pick_comercios')
      .select('*')
      .eq('id', id)
      .single(); // solo un resultado esperado

    return { comercio: data, error };
  }

  async obtenerCategorias(): Promise<{ categorias: PickCategoria[]; error: any }> {
   
    const { data, error } = await this.supabase
      .from('pick_categorias')
      .select('id, nombre, tipo_comercio_id')
      .order('nombre', { ascending: true });

    return {
      categorias: data || [],
      error,
    };
  }

  async obtenerSubcategorias(): Promise<{ subcategorias: PickSubcategoria[]; error: any }> {
    const { data, error } = await this.supabase
      .from('pick_subcategorias')
      .select('id, categoria_id, nombre')
      .eq('estado', true); // opcional: solo las activas

    return { subcategorias: data ?? [], error };
  }


  async cargarCategoriasSeleccionadas(comercioId: string): Promise<{ categoriaIds: number[]; error: any }> {
    
    const { data, error } = await this.supabase
      .from('pick_comercio_categoria')
      .select('categoria_id')
      .eq('comercio_id', comercioId);

    return {
      categoriaIds: data?.map((row: any) => row.categoria_id) || [],
      error,
    };
  }

  async cargarSubcategoriasSeleccionadas(comercioId: string): Promise<{ subcategoriaIds: number[]; error: any }> {
    const { data, error } = await this.supabase
      .from('pick_comercio_subcategorias')
      .select('subcategoria_id')
      .eq('comercio_id', comercioId);

    return {
      subcategoriaIds: data?.map(d => d.subcategoria_id) ?? [],
      error,
    };
  }

  async actualizarCategoriasComercio(comercioId: string, categoriaIds: number[]): Promise<{ error: any }> {
    
    // Paso 1: eliminar las categorías actuales
    const { error: deleteError } = await this.supabase
      .from('pick_comercio_categoria')
      .delete()
      .eq('comercio_id', comercioId);

    if (deleteError) {
      return { error: deleteError };
    }

    // Paso 2: insertar las nuevas relaciones
    const nuevasRelaciones = categoriaIds.map(categoriaId => ({
      comercio_id: comercioId,
      categoria_id: categoriaId,
      fecha_creacion: new Date().toISOString(),
      creado_por: PlataformasPickmi.BUSINESS,
    }));

    const { error: insertError } = await this.supabase
      .from('pick_comercio_categoria')
      .insert(nuevasRelaciones);

    return { error: insertError };
  }

  async actualizarSubcategoriasComercio(comercioId: string, subcategoriaIds: number[]): Promise<{ error: any }> {
    // 1. Eliminamos las existentes
    const { error: deleteError } = await this.supabase
      .from('pick_comercio_subcategorias')
      .delete()
      .eq('comercio_id', comercioId);
    if (deleteError) return { error: deleteError };

    // 2. Insertamos las nuevas
    const inserts = subcategoriaIds.map(id => ({
      comercio_id: comercioId,
      subcategoria_id: id,
      usuario_creacion: PlataformasPickmi.BUSINESS,
      fecha_creacion: new Date().toISOString()
    }));
    const { error: insertError } = await this.supabase
      .from('pick_comercio_subcategorias')
      .insert(inserts);
    return { error: insertError };
  }

  async getDepartamentos(): Promise<{ departamentos: PickDepartamentos[]; error: string | null }> {
    const { data, error } = await this.supabase
      .from('pick_departamentos')
      .select('*');

    return { departamentos: data || [], error: error?.message || null };
  }


  async getMunicipios(): Promise<{ municipios: PickMunicipios[]; error: string | null }> {
    const { data, error } = await this.supabase
      .from('pick_municipios')
      .select('*');

    return { municipios: data || [], error: error?.message || null };
  }

  
}
