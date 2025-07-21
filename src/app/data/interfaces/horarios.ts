export interface PickHorarios {
  id?: string;
  comercio_id: string;
  dia_semana: number; // 0 (domingo) a 6 (sábado)
  hora_apertura: string | null; // formato HH:mm:ss
  hora_cierre: string | null;   // formato HH:mm:ss
  cerrado: boolean;
  fecha_creacion?: string; // ISO 8601 (ej. "2025-06-11T15:30:00Z")
  creado_por?: number | null;
  fecha_actualizacion?: string | null;
  actualizado_por?: number | null;
}
