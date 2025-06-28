import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Turno, Encuesta, Disponibilidad } from '../models/interfaces-turnos';

@Injectable({
  providedIn: 'root'
})
export class SupabaseDbService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.apiUrl, environment.publicAnonKey);
  }

  // Usuarios
  async obtenerUsuarioActual(userAuthId: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('user_auth_id', userAuthId)
      .single();

    if (error) throw error;
    return data;
  }

  async obtenerTodosLosUsuarios() {
    const { data, error } = await this.supabase.from('usuarios').select('*');
    if (error) throw error;
    return data;
  }

  async actualizarEstadoEspecialista(userAuthId: string, habilitado: boolean) {
    const { error } = await this.supabase
      .from('usuarios')
      .update({ habilitado })
      .eq('user_auth_id', userAuthId);
    if (error) throw error;
  }

  async registrarLoginUsuario(userAuthId: string, email: string): Promise<void> {
    const { error } = await this.supabase
      .from('logins')
      .insert([{ user_auth_id: userAuthId, email, fecha_login: new Date().toISOString() }]);
    if (error) throw error;
  }

  async agregarEspecialidad(nombre: string) {
    const { error } = await this.supabase.from('especialidades').insert([{ nombre }]);
    if (error) throw error;
  }

  async obtenerEspecialidades(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('especialidades')
      .select('nombre')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data.map((esp: { nombre: string }) => esp.nombre);
  }

  getCliente(): SupabaseClient {
    return this.supabase;
  }

  // Turnos
  async solicitarTurno(turno: Turno) {
    console.log("turno en el service", turno);
    const { error } = await this.supabase.from('turnos').insert(turno);
    if (error) throw error;
  }

  async cancelarTurno(turnoId: string, motivo: string) {
    const { error } = await this.supabase
      .from('turnos')
      .update({ estado: 'cancelado', motivo_cancelacion: motivo })
      .eq('id', turnoId);
    if (error) throw error;
  }

  async rechazarTurno(turnoId: string, motivo: string) {
    const { error } = await this.supabase
      .from('turnos')
      .update({ estado: 'rechazado', motivo_rechazo: motivo })
      .eq('id', turnoId);
    if (error) throw error;
  }

  async aceptarTurno(turnoId: string) {
    const { error } = await this.supabase
      .from('turnos')
      .update({ estado: 'aceptado' })
      .eq('id', turnoId);
    if (error) throw error;
  }

  async finalizarTurno(turnoId: string, comentario: string) {
    const { error } = await this.supabase
      .from('turnos')
      .update({ estado: 'realizado', comentario_especialista: comentario })
      .eq('id', turnoId);
    if (error) throw error;
  }

  async guardarCalificacion(turnoId: string, comentario: string) {
    const { error } = await this.supabase
      .from('turnos')
      .update({ calificacion_paciente: comentario })
      .eq('id', turnoId);
    if (error) throw error;
  }

  async obtenerTurnosPorUsuario(usuarioId: string, tipo: 'paciente' | 'especialista') {
    const columna = tipo === 'paciente' ? 'paciente_id' : 'especialista_id';
    const { data, error } = await this.supabase
      .from('vista_turnos_con_nombres')
      .select('*')
      .eq(columna, usuarioId);
    if (error) throw error;
    return data;
  }

  // Encuestas
  async crearEncuesta(encuesta: Encuesta) {
    const { data, error } = await this.supabase.from('encuestas').insert(encuesta).select().single();
    if (error) throw error;
    return data; // devuelve el id para asociarlo al turno
  }

  async obtenerEncuestaPorTurno(turnoId: string) {
    const { data, error } = await this.supabase
      .from('encuestas')
      .select('*')
      .eq('turno_id', turnoId)
      .single();
    if (error) throw error;
    return data;
  }

  // Disponibilidad
  async guardarDisponibilidad(disponibilidad: Disponibilidad) {
    const { error } = await this.supabase.from('disponibilidades').insert(disponibilidad);
    if (error) throw error;
  }

  async obtenerDisponibilidadPorEspecialista(especialistaId: string): Promise<Disponibilidad[]> {
    const { data, error } = await this.supabase
      .from('disponibilidades')
      .select('*')
      .eq('especialista_id', especialistaId);
    if (error) throw error;
    return data;
  }

  async obtenerHorariosDisponibles(especialistaId: string, fecha: string) {
    const { data, error } = await this.supabase
      .rpc('buscar_horarios_disponibles', {
        especialista_id_input: especialistaId,
        fecha_input: fecha
      });
    console.log("data del metodo buscar horarios", data);
    if (error) throw error;
    return data;
  }
}
