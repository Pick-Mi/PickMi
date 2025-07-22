export interface MensajeSolicitud {
  id: string;
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  fecha: string; // o Date si la conviertes en el servicio
  leido: boolean;
  usuario_id?: string | null;
  tipo_usuario?: string | null;
  avatar_url: string;
  tipo_origen: string;
}
