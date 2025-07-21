export interface PickCategoria {
  id: number;
  nombre: string;
  icono?: string;
  tipo_comercio_id?: number;
}

export interface PickSubcategoria {
  id: number;
  categoria_id: number;
  nombre: string;
}
