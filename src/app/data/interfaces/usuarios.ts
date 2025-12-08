export interface PickUsuario {
    id?: string;
    nombre: string;
    apellido: string;
    email: string;
    estatus: string;
    password?: string | null;
    tipo_usuario: TipoUsuario;
    telefono?: string | null;
    fecha_registro?: string | null;
    fecha_creacion?: string | null;
    creado_por?: number | null;
    fecha_actualizacion?: string | null;
    actualizado_por?: number | null;
    avatar_url?: string | null;
    en_periodo_prueba?: boolean;
}

export interface PropietarioListado extends PickUsuario {
    propietario_id: string;
    onboarding_status?: string | null;
    plan_solicitado_id?: string | null;
    plan_solicitado_at?: string | null;
    plan_id?: string | null;
}

export interface PlanResumen {
    id: string;
    nombre: string;
    slug: string;
    descripcion?: string | null;
}

export interface ComercioResumen {
    id: string;
    nombre: string;
    estatus?: string | null;
    tipo_entrega?: string | null;
}

export interface PropietarioDetalle extends PropietarioListado {
    plan?: PlanResumen | null;
    plan_solicitado?: PlanResumen | null;
    comercios?: ComercioResumen[];
}

export enum TipoUsuario {
    CLIENTE = 'cliente',
    PROPIETARIO = 'propietario',
    ADMIN = 'admin'
}

export interface ActividadUsuario {
  tipo: 'favorito' | 'calificacion' | 'comentario';
  usuarioNombre: string;
  comercioNombre: string;
  calificacion?: number;
  comentario?: string;
  fecha: string;
}

export interface UsuariosFiltro {
  estatus?: string;
  tipo_usuario?: string;
  search?: string;
}
