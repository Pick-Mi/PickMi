export type TipoReto = 'bienvenida' | 'permanente' | 'evento';

export interface PickReto {
  reto_id?: string;
  titulo: string;
  descripcion?: string | null;
  tipo_reto: TipoReto;
  meta: number;
  tipo_accion: string;
  periodo_dias?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  activo?: boolean;
  created_at?: string;
  icono?: string | null;
}
