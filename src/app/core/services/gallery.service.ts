import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';
import { AuthService } from './auth.service';
import { PickGallery } from '../../data/interfaces/galeria';

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
        this.supabase = this.authService.getSupabaseClient();
  }

  async compressImage(file: File): Promise<File> {
    return await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    });
  }

  async uploadImage(file: File, comercioId: string, index: number): Promise<string | null> {
    const fileName = `image_${Date.now()}_${index}.jpg`;
    const filePath = `galerias/${comercioId}/${fileName}`;

    const { error } = await this.supabase.storage
      .from('gallery-business')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error(`❌ Error al subir imagen:`, error);
      return null;
    }

    const { data } = this.supabase.storage
      .from('gallery-business')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async saveImageMetadata(gallery: PickGallery): Promise<PickGallery | null> {
    const { data, error } = await this.supabase
      .from('pick_imagenes_comercios')
      .insert(gallery)
      .select()
      .single();

    if (error) {
      console.error('❌ Error guardando metadatos:', error);
      return null;
    }

    return data as PickGallery;
  }

  async getImages(comercioId: string): Promise<PickGallery[]> {
    const { data, error } = await this.supabase
      .from('pick_imagenes_comercios')
      .select('*')
      .eq('comercio_id', comercioId)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo imágenes:', error);
      return [];
    }

    return data as PickGallery[];
  }

  async deleteImage(id: string, url: string): Promise<boolean> {
    // 1. Eliminar de la base de datos
    const { error: dbError } = await this.supabase
      .from('pick_imagenes_comercios')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('❌ Error eliminando registro de DB:', dbError);
      return false;
    }

    // 2. Eliminar del Storage
    try {
      const urlObj = new URL(url);
      const bucketPrefix = '/storage/v1/object/public/gallery-business/';
      const fullPath = decodeURIComponent(urlObj.pathname);

      if (!fullPath.startsWith(bucketPrefix)) {
        console.error('❌ No se pudo determinar el path del archivo a borrar.');
        return false;
      }

      const relativePath = fullPath.replace(bucketPrefix, '');

      const { error: storageError } = await this.supabase.storage
        .from('gallery-business')
        .remove([relativePath]);
        
      if (storageError) {
        console.error('❌ Error eliminando archivo del Storage:', storageError);
      }
    } catch (e) {
      console.error('❌ Error al procesar la URL del archivo:', e);
    }

    return true;
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