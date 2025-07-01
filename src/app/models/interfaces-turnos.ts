export interface Turno {
    id?: string;
    fecha_hora: string;
    paciente_id: string;
    especialista_id: string;
    especialidad: string;
    estado?: 'solicitado' | 'aceptado' | 'cancelado' | 'rechazado' | 'realizado';
    comentario_paciente?: string;
    comentario_especialista?: string;
    calificacion_paciente?: string;
    encuesta_id?: string;
    completadaEncuesta?: boolean;
    motivo_cancelacion?: string;
    motivo_rechazo?: string;
    nombre_especialista?: string;
    nombre_paciente?: string;
    apellido_paciente?: string;
    fecha_turno?: string;
    hora_turno?: string;
}

export interface Encuesta {
    id?: string;
    turno_id: string;
    respuesta1: string;
    respuesta2: string;
    respuesta3: string;
}

export interface Disponibilidad {
    id?: string;
    especialista_id: string;
    fecha: string;
    horario_inicio: string;
    horario_fin: string;
    dias_semana: string[];
}

export interface HorariosDisponibles {
    fecha: string;
    horarios: string[];
}

export interface Especialidad {
    nombre: string;
    imagen_url?: string;
}

export interface EspecialistaCard {
    user_auth_id: string;
    nombre: string;
    apellido: string;
    avatar_url?: string;
    especialidades: string[];
}
export interface Encuesta {
    turno_id: string;
    respuesta1: string;
    respuesta2: string;
    respuesta3: string;
}
