export interface PickComercioConTipoYUbicacion {
  id: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
  website: string;
  latitud: number;
  longitud: number;
  tipo_comercio_id: number;
  usuario_id: string;
  fecha_registro: string;
  estatus: string;
  total_reviews: number;
  promedio_calificacion: number;
  fecha_creacion: string;
  creado_por: number;
  fecha_actualizacion: string | null;
  actualizado_por: string | null;
  logo_url: string | null;
  municipio: number;
  banner_url: string | null;
  url_facebook: string;
  url_twitter: string;
  url_instagram: string;
  url_tiktok: string;
  url_youtube: string;
  url_whatsapp: string;
  departamento: number;
  posee_local?: boolean;
  pet_friendly?: boolean;
  tipo_entrega: 'envio' | 'local' | 'ambos';
  tiempo_entrega_valor?: number;
  tiempo_entrega_unidad?: string;

  // Relaciones
  pick_tipo_comercio: {
    nombre: string;
  };

  pick_municipios: {
    nombre: string;
    pick_departamentos: {
      nombre: string;
    };
  };
}
