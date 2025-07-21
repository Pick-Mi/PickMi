export interface PickProductos {
  id?: string;
  comercio_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  destacado: boolean;
  en_promocion: boolean;
  tipo_promocion: string;
  valor_promocion: number;
  descripcion_promocion: string;
  fecha_inicio_promo: string;
  fecha_fin_promo: string;
  url_imagen: string;
  fecha_creacion?: string; // ISO string (ej: '2025-06-11T15:30:00Z')
  creado_por?: number | null;
  fecha_actualizacion?: string | null;
  actualizado_por?: number | null;
}
