// src/app/models/interfaces-turnos.ts
export interface Turno {
    id?: string;
    fecha_hora: string; // ISO format
    paciente_id: string;
    especialista_id: string;
    especialidad: string;
    estado?: 'solicitado' | 'aceptado' | 'cancelado' | 'rechazado' | 'realizado';
    comentario_paciente?: string;
    comentario_especialista?: string;
    calificacion_paciente?: string;
    encuesta_id?: string;
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
    fecha: string; // 'YYYY-MM-DD'
    horario_inicio: string; // 'HH:mm'
    horario_fin: string;    // 'HH:mm'
    dias_semana: string[];  // ['Lunes', 'Martes', ...]
}

export interface HorariosDisponibles {
    fecha: string;
    horarios: string[]; // Ej: ['09:00', '09:30', ...]
}
