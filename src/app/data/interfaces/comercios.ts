export interface PickComercio {
  id?: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  website?: string;
  posee_local?: boolean;
  pet_friendly?: boolean;
  latitud?: number;
  longitud?: number;
  departamento?: string;
  municipio?: string;
  tipo_entrega?: string;
  tiempo_entrega_valor?: number;
  tiempo_entrega_unidad?: string;
  tipo_comercio_id: number;
  usuario_id?: string;
  fecha_registro?: string;
  estatus?: 'activo' | 'inactivo' | 'pausado';
  total_reviews?: number;
  promedio_calificacion?: number;
  fecha_creacion?: string;
  creado_por?: number;
  fecha_actualizacion?: string;
  actualizado_por?: number;
  logo_url?: string;
  banner_url?: string;
  url_facebook?: string;
  url_twitter?: string;
  url_instagram?: string;
  url_tiktok?: string;
  url_youtube?: string;
  url_whatsapp?: string;
}

export interface PickTipoComercio {
  id: number;
  nombre: string;
  fecha_creacion?: string;
  creado_por?: number;
  fecha_actualizacion?: string;
  actualizado_por?: number;
}

export interface PickDepartamentos {
  id: number;
  nombre: string;
  idPais: number;
  iso31662: string;
}

export interface PickMunicipios {
  id: number;
  id_departamento: number;
  nombre: string;
}
