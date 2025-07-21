export interface PickGallery {
  id?: string;
  comercio_id: string;
  url_imagen: string;
  descripcion?: string;
  fecha_subida?: string;        // ISO timestamp string
  fecha_creacion?: string;      // ISO timestamp string
  creado_por?: number;
  fecha_actualizacion?: string; // ISO timestamp string
  actualizado_por?: number;
}
