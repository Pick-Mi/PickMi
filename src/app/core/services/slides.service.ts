import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { PickSlide } from '../../data/interfaces/slides';

@Injectable({ providedIn: 'root' })
export class SlidesService {
  private readonly table = 'pick_slides';
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = this.authService.getSupabaseClient();
  }

  async obtenerSlides(): Promise<PickSlide[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .order('position', { ascending: true });

    if (error) throw error;
    return data as PickSlide[];
  }

  async obtenerSlidesPorTarget(targetPage: string): Promise<PickSlide[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('target_page', targetPage)
      .order('position', { ascending: true });

    if (error) throw error;
    return data as PickSlide[];
  }

  async obtenerSlidePorId(id: string): Promise<PickSlide | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as PickSlide;
  }

  async crearSlide(slide: Omit<PickSlide, 'id' | 'created_at' | 'updated_at'>): Promise<PickSlide> {
    const payload = {
      ...slide,
      position: slide.position ?? 0,
      is_active: slide.is_active ?? true,
    };

    const { data, error } = await this.supabase
      .from(this.table)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as PickSlide;
  }

  async actualizarSlide(id: string, slide: Partial<PickSlide>): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update(slide)
      .eq('id', id);

    if (error) throw error;
  }

  async eliminarSlide(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async obtenerSlidesActivos(targetPage?: string): Promise<PickSlide[]> {
    let query = this.supabase
      .from(this.table)
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (targetPage) {
      query = query.eq('target_page', targetPage);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as PickSlide[];
  }

  async obtenerSlidesActivosPorPagina(targetPage: string): Promise<PickSlide[]> {
    return this.obtenerSlidesActivos(targetPage);
  }
}
