import { Injectable } from "@angular/core";
import { SupabaseClient } from "@supabase/supabase-js";
import { PickProductos } from "../../data/interfaces/productos";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: 'root' })
export class MenusService {
  
    private supabase: SupabaseClient;
    private bucket = 'products-business';

    constructor(private authService: AuthService) {
        this.supabase = this.authService.getSupabaseClient();
    }

  async subirImagenProducto(comercioId: string, file: File): Promise<string> {
    const filePath = `comercio-${comercioId}/${file.name}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    const { data } = await this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async guardarProducto(producto: Partial<PickProductos>): Promise<void> {
    const { error } = await this.supabase
      .from('pick_productos')
      .insert(producto);

    if (error) throw error;
  }

  async actualizarProducto(id: string, producto: Partial<PickProductos>): Promise<void> {
    const { error } = await this.supabase
      .from('pick_productos')
      .update(producto)
      .eq('id', id);

    if (error) throw error;
  }

  async eliminarProducto(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('pick_productos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async obtenerProductosPorComercio(comercioId: string): Promise<PickProductos[]> {
    const { data, error } = await this.supabase
      .from('pick_productos')
      .select('*')
      .eq('comercio_id', comercioId)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data as PickProductos[];
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
