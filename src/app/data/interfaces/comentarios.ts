export interface PickComentarios {
  id?: string;
  usuario_id: string;
  comercio_id: string;
  comentario: string;
  calificacion: number; // de 1 a 5
  fecha_comentario: string; // ISO string (ej: '2025-06-11T15:30:00Z')
  estatus: 'activo' | 'inactivo' | string; // por defecto 'activo', pero puedes usar string si hay más estados
  fecha_creacion?: string;
  creado_por?: number | null;
  fecha_actualizacion?: string | null;
  actualizado_por?: number | null;
}
