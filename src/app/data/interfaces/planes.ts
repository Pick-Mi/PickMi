export interface PickPlan {
  id?: string;
  slug: string;
  nombre: string;
  descripcion?: string | null;
  precio_mensual: number;
  moneda: string;
  es_activo: boolean;
  limites?: Record<string, number> | null;
  features?: Record<string, boolean> | null;
  trial_dias: number;
  es_default: boolean;
  es_trial_default: boolean;
  created_at?: string;
  updated_at?: string;
}
