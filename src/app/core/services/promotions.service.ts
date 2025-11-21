import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickPromocion } from '../../data/interfaces/promotions';

@Injectable({ providedIn: 'root' })
export class PromotionsService {
  private readonly table = 'pick_promociones';
  private readonly bucket = 'promotions';
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = this.authService.getSupabaseClient();
  }

  async listar(): Promise<PickPromocion[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data as PickPromocion[];
  }

  async crear(promocion: Partial<PickPromocion>): Promise<PickPromocion> {
    const { data, error } = await this.supabase
      .from(this.table)
      .insert(promocion)
      .select()
      .single();

    if (error) throw error;
    return data as PickPromocion;
  }

  async actualizar(id: string, cambios: Partial<PickPromocion>): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update(cambios)
      .eq('id', id);

    if (error) throw error;
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async subirImagen(comercioId: string, archivo: Blob): Promise<string> {
    const contentType = archivo.type || 'image/png';
    const extension = contentType.split('/')[1] || 'png';
    const filePath = `comercio-${comercioId}/promo-${Date.now()}.${extension}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, archivo, { upsert: true, cacheControl: '3600', contentType });

    if (uploadError) throw uploadError;

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }
}
