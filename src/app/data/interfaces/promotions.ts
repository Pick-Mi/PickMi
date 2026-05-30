export type TipoPromocion = 'descuento' | 'regalo' | '2x1' | 'bundle';

export interface PickPromocion {
  id?: string;
  comercio_id: string;
  titulo: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  precio_original: number;
  precio_promocion: number;
  porcentaje_descuento?: number | null;
  codigo_promocion?: string | null;
  estatus?: string | null;
  tipo_promocion?: TipoPromocion | null;
  item_regalo?: string | null;
  fecha_creacion?: string;
  creado_por?: number | null;
  fecha_actualizacion?: string;
  actualizado_por?: number | null;
}
