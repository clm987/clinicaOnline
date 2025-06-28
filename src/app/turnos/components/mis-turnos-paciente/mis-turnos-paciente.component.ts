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
  horariosDisponibles = signal<{ horario: string; fecha: string }[]>([]);
  mensaje = signal<{ texto: string; tipo: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  especialistaSeleccionado: any = null;
  nombreEspecialistaSeleccionado = '';
  especialidadSeleccionada: string | null = null;
  horarioSeleccionado: { horario: string; fecha: string } | null = null;

  usuarioActual: any = null;

  async ngOnInit() {
    this.usuarioActual = await this.credencialesService.getUsuarioActualAsync();
    if (this.usuarioActual) await this.actualizarTurnos();

    const todasEspecialidades = await this.dbService.obtenerEspecialidades();
    this.especialidades.set(todasEspecialidades.slice(0, 10));
  }

  seleccionarEspecialidad(especialidad: string) {
    this.especialidadSeleccionada = especialidad;
    this.horariosDisponibles.set([]);
    this.especialistasFiltrados.set([]);
    this.horarioSeleccionado = null;
    this.mensaje.set(null);
    this.filtrarEspecialistas();
  }

  async seleccionarEspecialista(especialista: any) {
    this.especialistaSeleccionado = especialista;
    this.nombreEspecialistaSeleccionado = `${especialista.nombre} ${especialista.apellido}`;
    this.horarioSeleccionado = null;
    this.horariosDisponibles.set([]);

    const hoy = new Date().toISOString().substring(0, 10);
    const horarios = await this.dbService.obtenerHorariosDisponibles(especialista.user_auth_id, hoy);

    if (!horarios || horarios.length === 0) {
      this.mensaje.set(null);
      setTimeout(() => {
        this.mensaje.set({
          texto: 'No hay horarios disponibles para hoy con este especialista.',
          tipo: 'warning'
        });
      });
      return;
    }

    this.mensaje.set(null);
    this.horariosDisponibles.set(horarios);
  }

  seleccionarHorario(horario: { horario: string; fecha: string }) {
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

    this.mensaje.set({
      texto: 'Turno solicitado con éxito.',
      tipo: 'success'
    });

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
    if (!turno.motivo_cancelacion || turno.motivo_cancelacion.trim() === '') {
      this.mensaje.set(null);
      setTimeout(() => {
        this.mensaje.set({
          texto: 'Por favor, ingrese un motivo para cancelar el turno.',
          tipo: 'error'
        });
      });
      return;
    }

    await this.dbService.cancelarTurno(turno.id, turno.motivo_cancelacion);
    await this.actualizarTurnos();

    this.mensaje.set({
      texto: 'El turno fue cancelado correctamente.',
      tipo: 'success'
    });
  }

  async calificarTurno(turno: any) {
    if (!turno.comentario_paciente || turno.comentario_paciente.trim() === '') {
      this.mensaje.set(null);
      setTimeout(() => {
        this.mensaje.set({
          texto: 'Por favor, ingrese un comentario para calificar la atención.',
          tipo: 'error'
        });
      });
      return;
    }

    await this.dbService.guardarCalificacion(turno.id, turno.comentario_paciente);
    await this.actualizarTurnos();

    this.mensaje.set({
      texto: 'Gracias por calificar la atención.',
      tipo: 'success'
    });
  }

  verResena(turno: any) {
    this.mensaje.set(null);
    setTimeout(() => {
      this.mensaje.set({
        texto: `Reseña del especialista:\n\n${turno.comentario_especialista}`,
        tipo: 'info'
      });
    });
  }

  completarEncuesta(turno: any) {
    this.mensaje.set(null);
    setTimeout(() => {
      this.mensaje.set({
        texto: 'Funcionalidad para completar encuesta pendiente de implementar.',
        tipo: 'info'
      });
    });
  }

  private async actualizarTurnos() {
    if (!this.usuarioActual) return;
    const todosTurnos = await this.dbService.obtenerTurnosPorUsuario(this.usuarioActual.id, 'paciente');
    const procesados = todosTurnos.map(t => ({
      ...t,
      fecha_turno: new Date(t.fecha_hora),
      hora_turno: new Date(t.fecha_hora).toTimeString().substring(0, 5)
    }));
    this.turnos.set(procesados);
  }

  private async filtrarEspecialistas() {
    const usuarios = await this.dbService.obtenerTodosLosUsuarios();
    const filtrados = usuarios.filter(
      u => u.perfil === 'especialista' && Array.isArray(u.especialidades) && u.especialidades.includes(this.especialidadSeleccionada)
    );
    this.especialistasFiltrados.set(filtrados);
  }
}
