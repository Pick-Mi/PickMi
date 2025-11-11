export interface ReviewUsuario {
  nombre: string;
  apellido: string;
  avatar_url?: string | null;
}

export interface ReviewComercio {
  id: string;
  nombre: string;
}

export interface PickReview {
  id: string;
  comentario: string;
  calificacion: number;
  fecha_comentario: string;
  estatus: 'activo' | 'inactivo';
  comercio: ReviewComercio;
  usuario: ReviewUsuario;
}
