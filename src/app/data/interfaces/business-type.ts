export interface BusinessType {
  id?: number;
  nombre: string;
  fecha_creacion?: string;
  creado_por?: number | null;
  fecha_actualizacion?: string | null;
  actualizado_por?: number | null;
  icono?: string | null;
  estado?: boolean;
}
