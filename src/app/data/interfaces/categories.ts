export interface PickCategoria {
  id?: number;
  nombre: string;
  fecha_creacion?: string;
  creado_por?: number | null;
  fecha_actualizacion?: string | null;
  actualizado_por?: number | null;
  tipo_comercio_id?: number | null;
  icono?: string | null;
}

export interface PickSubcategoria {
  id?: number;
  categoria_id: number;
  nombre: string;
  estado?: boolean;
  usuario_creacion?: number | null;
  fecha_creacion?: string;
}
