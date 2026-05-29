export type TipoReto = 'bienvenida' | 'permanente' | 'evento';

export interface PickReto {
  reto_id?: string;
  titulo: string;
  descripcion?: string | null;
  tipo_reto: TipoReto;
  meta: number;
  tipo_accion: string;
  periodo_dias?: number | null;
  dia_reinicio?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  activo?: boolean;
  created_at?: string;
  icono?: string | null;
}

export interface RetoProgreso {
  id: string;
  usuario_id: string;
  progreso: number;
  completado: boolean;
  fecha_inicio: string | null;
  fecha_completado: string | null;
  usuario_nombre: string;
  usuario_apellido: string;
  usuario_email: string;
  usuario_avatar: string | null;
}
