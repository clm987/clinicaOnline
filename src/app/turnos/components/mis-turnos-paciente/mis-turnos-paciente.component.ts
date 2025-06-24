import { Component, inject, OnInit, signal } from '@angular/core';
import { SupabaseDbService } from '../../../services/supabase-db.service';
import { CredencialesService } from '../../../services/credenciales.service';
import { Turno } from '../../../models/interfaces-turnos';

@Component({
  selector: 'app-mis-turnos-paciente',
  standalone: false,
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.css']
})
export class MisTurnosPacienteComponent implements OnInit {
  private dbService = inject(SupabaseDbService);
  private credencialesService = inject(CredencialesService);

  turnos = signal<Turno[]>([]);
  especialidades = signal<string[]>([]);
  especialistasFiltrados = signal<any[]>([]);
  horariosDisponibles = signal<{ horario: string, fecha: string }[]>([]);
  especialistaSeleccionado: any = null;
  nombreEspecialistaSeleccionado: string = '';
  especialidadSeleccionada: string | null = null;
  horarioSeleccionado: { horario: string, fecha: string } | null = null;

  usuarioActual: any = null;

  async ngOnInit() {
    const user = await this.credencialesService.getUsuarioActual();
    this.usuarioActual = user;
    if (user) {
      await this.actualizarTurnos();
    }
    const todasEspecialidades = await this.dbService.obtenerEspecialidades();
    this.especialidades.set(todasEspecialidades.slice(0, 10));
  }

  seleccionarEspecialidad(especialidad: string) {
    this.especialidadSeleccionada = especialidad;
    this.horariosDisponibles.set([]);
    this.especialistasFiltrados.set([]);
    this.horarioSeleccionado = null;
    this.filtrarEspecialistas();
  }

  async seleccionarEspecialista(especialista: any) {
    this.especialistaSeleccionado = especialista;
    this.nombreEspecialistaSeleccionado = `${especialista.nombre} ${especialista.apellido}`;
    this.horarioSeleccionado = null;
    const hoy = new Date().toISOString().split('T')[0];
    const horarios = await this.dbService.obtenerHorariosDisponibles(especialista.user_auth_id, hoy);
    this.horariosDisponibles.set(horarios);
  }

  seleccionarHorario(horario: { horario: string, fecha: string }) {
    this.horarioSeleccionado = horario;
  }

  async confirmarTurno() {
    if (!this.usuarioActual || !this.especialistaSeleccionado || !this.horarioSeleccionado) return;
    const fechaHoraCompleta = `${this.horarioSeleccionado.fecha}T${this.horarioSeleccionado.horario}`;
    const nuevoTurno: Turno = {
      paciente_id: this.usuarioActual.id,
      especialista_id: this.especialistaSeleccionado.user_auth_id,
      especialidad: this.especialidadSeleccionada!,
      fecha_hora: fechaHoraCompleta,
      estado: 'solicitado'
    };
    await this.dbService.solicitarTurno(nuevoTurno);
    await this.actualizarTurnos();
    this.cancelarSeleccion();
  }

  cancelarSeleccion() {
    this.horariosDisponibles.set([]);
    this.horarioSeleccionado = null;
    this.especialistasFiltrados.set([]);
    this.especialidadSeleccionada = null;
    this.especialistaSeleccionado = null;
    this.nombreEspecialistaSeleccionado = '';
  }

  async cancelarTurno(turno: any) {
    if (!turno.motivoCancelacionTemp) return;
    await this.dbService.cancelarTurno(turno.id, turno.motivoCancelacionTemp);
    await this.actualizarTurnos();
  }

  async calificarTurno(turno: any) {
    if (!turno.comentarioPacienteTemp) return;
    await this.dbService.guardarCalificacion(turno.id, turno.comentarioPacienteTemp);
    await this.actualizarTurnos();
  }

  verResena(turno: any) {
    alert(`Reseña del especialista:\n\n${turno.comentario_especialista}`);
  }

  completarEncuesta(turno: any) {
    alert('Funcionalidad para completar encuesta pendiente de implementar.');
  }

  private async actualizarTurnos() {
    const todosTurnos = await this.dbService.obtenerTurnosPorUsuario(this.usuarioActual.id, 'paciente');
    const procesados = todosTurnos.map(turno => ({
      ...turno,
      fecha_turno: new Date(turno.fecha_hora),
      hora_turno: new Date(turno.fecha_hora).toTimeString().substring(0, 5)
    }));
    this.turnos.set(procesados);
  }

  private async filtrarEspecialistas() {
    const usuarios = await this.dbService.obtenerTodosLosUsuarios();
    const filtrados = usuarios.filter(u =>
      u.perfil === 'especialista' &&
      Array.isArray(u.especialidades) &&
      u.especialidades.includes(this.especialidadSeleccionada)
    );
    this.especialistasFiltrados.set(filtrados);
  }
}
