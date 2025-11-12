import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickCategoria, PickSubcategoria } from '../../data/interfaces/categories';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private supabase: SupabaseClient;
  private readonly categoriasTable = 'pick_categorias';
  private readonly subcategoriasTable = 'pick_subcategorias';

  constructor(private authService: AuthService) {
    this.supabase = this.authService.getSupabaseClient();
  }

  // --------- Categorías ----------

  async obtenerCategorias(): Promise<PickCategoria[]> {
    const { data, error } = await this.supabase
      .from(this.categoriasTable)
      .select(`
        *,
        pick_tipo_comercio (
          id,
          nombre
        )
      `)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data as PickCategoria[];
  }

  async obtenerCategoriaPorId(id: number): Promise<PickCategoria | null> {
    const { data, error } = await this.supabase
      .from(this.categoriasTable)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as PickCategoria;
  }

  async crearCategoria(payload: Omit<PickCategoria, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<PickCategoria> {
    const { data, error } = await this.supabase
      .from(this.categoriasTable)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as PickCategoria;
  }

  async actualizarCategoria(id: number, cambios: Partial<PickCategoria>): Promise<void> {
    const { error } = await this.supabase
      .from(this.categoriasTable)
      .update({
        ...cambios,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  async eliminarCategoria(id: number): Promise<void> {
    const { error } = await this.supabase
      .from(this.categoriasTable)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // --------- Subcategorías ----------

  async obtenerSubcategoriasPorCategoria(categoriaId: number): Promise<PickSubcategoria[]> {
    const { data, error } = await this.supabase
      .from(this.subcategoriasTable)
      .select('*')
      .eq('categoria_id', categoriaId)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data as PickSubcategoria[];
  }

  async crearSubcategoria(payload: Omit<PickSubcategoria, 'id' | 'fecha_creacion'>): Promise<PickSubcategoria> {
    const { data, error } = await this.supabase
      .from(this.subcategoriasTable)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as PickSubcategoria;
  }

  async actualizarSubcategoria(id: number, cambios: Partial<PickSubcategoria>): Promise<void> {
    const { error } = await this.supabase
      .from(this.subcategoriasTable)
      .update(cambios)
      .eq('id', id);

    if (error) throw error;
  }

  async eliminarSubcategoria(id: number): Promise<void> {
    const { error } = await this.supabase
      .from(this.subcategoriasTable)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
