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
