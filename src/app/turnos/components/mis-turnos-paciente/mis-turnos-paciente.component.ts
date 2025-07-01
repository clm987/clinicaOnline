import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseDbService } from '../../../services/supabase-db.service';
import { CredencialesService } from '../../../services/credenciales.service';
import { Turno, Especialidad, EspecialistaCard } from '../../../models/interfaces-turnos';

@Component({
  selector: 'app-mis-turnos-paciente',
  standalone: false,
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.css']
})
export class MisTurnosPacienteComponent implements OnInit {
  private dbService = inject(SupabaseDbService);
  private credencialesService = inject(CredencialesService);
  private fb = inject(FormBuilder);

  turnos = signal<Turno[]>([]);
  especialidades = signal<Especialidad[]>([]);
  especialistasFiltrados = signal<EspecialistaCard[]>([]);
  fechasDisponibles = signal<string[]>([]);
  horariosDisponibles = signal<{ horario: string; fecha: string }[]>([]);
  horariosPorDia = signal<{ fecha: string; dia: string; horas: string[] }[]>([]);
  mensaje = signal<{ texto: string; tipo: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  especialistaSeleccionado: any = null;
  nombreEspecialistaSeleccionado = '';
  especialidadSeleccionada: string | null = null;
  horarioSeleccionado: { horario: string; fecha: string } | null = null;
  fechaSeleccionada: string | null = null;
  loadingFechas = false;

  encuestaModalVisible = signal(false);
  encuestaForm!: FormGroup;
  turnoEncuesta: Turno | null = null;
  cargandoEncuesta = false;
  mensajeEncuesta = '';

  readonly opciones12 = ['Muy buena', 'Buena', 'Mala', 'Muy mala'];
  readonly opciones3 = ['Sí', 'Puede ser', 'No'];

  usuarioActual: any = null;
  diasES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  async ngOnInit() {
    this.usuarioActual = await this.credencialesService.getUsuarioActualAsync();
    if (this.usuarioActual) await this.actualizarTurnos();

    const espConImagen = await this.dbService.obtenerEspecialidadesConImagen();
    this.especialidades.set(espConImagen.slice(0, 10));

    this.encuestaForm = this.fb.group({
      r1: ['', Validators.required],
      r2: ['', Validators.required],
      r3: ['', Validators.required]
    });
  }

  seleccionarEspecialidad(e: string) {
    this.especialidadSeleccionada = e;
    this.resetHorarios();
    this.filtrarEspecialistas();
  }

  async seleccionarEspecialista(est: EspecialistaCard) {
    this.especialistaSeleccionado = est;
    this.nombreEspecialistaSeleccionado = `${est.nombre} ${est.apellido}`;
    this.resetHorarios();
    this.loadingFechas = true;
    const fechas = await this.dbService.obtenerFechasDisponibles(est.user_auth_id, 14);
    this.loadingFechas = false;
    if (!fechas.length) {
      this.mensaje.set({ texto: 'El especialista no tiene horarios disponibles en los próximos 15 días.', tipo: 'warning' });
      return;
    }
    this.fechasDisponibles.set(fechas);
  }

  async seleccionarFecha(fecha: string) {
    this.fechaSeleccionada = fecha;
    const horarios = await this.dbService.obtenerHorariosDisponibles(this.especialistaSeleccionado!.user_auth_id, fecha);
    this.horariosDisponibles.set(horarios || []);
  }

  horasParaFecha(): string[] {
    const f = this.fechaSeleccionada;
    return this.horariosDisponibles().filter(h => h.fecha === f).map(h => h.horario);
  }

  seleccionarHorario(h: { horario: string; fecha: string }) { this.horarioSeleccionado = h; }

  async confirmarTurno() {
    if (!this.usuarioActual || !this.especialistaSeleccionado || !this.horarioSeleccionado) return;
    const fechaHora = `${this.horarioSeleccionado.fecha}T${this.horarioSeleccionado.horario}`;
    const nuevoTurno: Turno = {
      paciente_id: this.usuarioActual.id,
      especialista_id: this.especialistaSeleccionado.user_auth_id,
      especialidad: this.especialidadSeleccionada!,
      fecha_hora: fechaHora,
      estado: 'solicitado'
    };
    await this.dbService.solicitarTurno(nuevoTurno);
    await this.actualizarTurnos();
    this.mensaje.set({ texto: 'Turno solicitado con éxito.', tipo: 'success' });
    this.cancelarSeleccion();
  }

  async cancelarTurno(t: any) {
    if (!t.motivo_cancelacion?.trim()) {
      this.mensaje.set({ texto: 'Por favor, ingrese un motivo para cancelar el turno.', tipo: 'error' });
      return;
    }
    await this.dbService.cancelarTurno(t.id, t.motivo_cancelacion);
    await this.actualizarTurnos();
    this.mensaje.set({ texto: 'El turno fue cancelado correctamente.', tipo: 'success' });
  }

  async calificarTurno(t: any) {
    if (!t.comentario_paciente?.trim()) {
      this.resetMensaje();
      this.mensaje.set({ texto: 'Por favor, ingrese un comentario para calificar la atención.', tipo: 'error' });
      return;
    }
    await this.dbService.guardarCalificacion(t.id, t.comentario_paciente);
    await this.actualizarTurnos();
    this.resetMensaje();
    this.mensaje.set({ texto: 'Gracias por calificar la atención.', tipo: 'success' });
  }
  private resetMensaje(): void {
    this.mensaje.set(null);
  }

  verResena(t: Turno) {
    this.mensaje.set(null);
    setTimeout(() => {
      this.mensaje.set({
        texto: `Reseña del especialista:\n\n${t.comentario_especialista}`,
        tipo: 'info'
      });
    });
  }

  abrirEncuesta(t: Turno) {
    this.turnoEncuesta = t;
    this.encuestaForm.reset();
    this.mensajeEncuesta = '';
    this.encuestaModalVisible.set(true);
  }

  cancelarEncuesta() { this.encuestaModalVisible.set(false); }

  async enviarEncuesta() {
    if (!this.turnoEncuesta) return;
    if (this.encuestaForm.invalid) return;
    this.cargandoEncuesta = true;
    this.mensajeEncuesta = '';
    try {
      await this.dbService.crearEncuesta({
        turno_id: this.turnoEncuesta.id!,
        respuesta1: this.encuestaForm.value.r1!,
        respuesta2: this.encuestaForm.value.r2!,
        respuesta3: this.encuestaForm.value.r3!
      });
      this.turnoEncuesta.completadaEncuesta = true;
      this.mensajeEncuesta = 'Encuesta enviada ✔';
      this.encuestaModalVisible.set(false);
    } catch {
      this.mensajeEncuesta = 'Error al guardar la encuesta.';
    } finally {
      this.cargandoEncuesta = false;
    }
  }

  private async actualizarTurnos() {
    if (!this.usuarioActual) return;
    const todos = await this.dbService.obtenerTurnosPorUsuario(this.usuarioActual.id, 'paciente');
    const proc = todos.map(t => ({
      ...t,
      fecha_turno: new Date(t.fecha_hora),
      hora_turno: new Date(t.fecha_hora).toTimeString().substring(0, 5),
      completadaEncuesta: !!t.encuesta_id
    }));
    this.turnos.set(proc);
  }

  private async filtrarEspecialistas() {
    if (!this.especialidadSeleccionada) return;
    const lista = await this.dbService.obtenerEspecialistasPorEspecialidad(this.especialidadSeleccionada);
    this.especialistasFiltrados.set(lista);
  }

  cancelarSeleccion() {
    this.resetHorarios();
    this.especialidadSeleccionada = null;
    this.especialistaSeleccionado = null;
    this.nombreEspecialistaSeleccionado = '';
  }

  private resetHorarios() {
    this.horariosDisponibles.set([]);
    this.fechasDisponibles.set([]);
    this.horariosPorDia.set([]);
    this.horarioSeleccionado = null;
  }

  formatearHora(h: string): string {
    const [hh, mm] = h.split(':'); let hr = +hh;
    const suf = hr >= 12 ? 'pm' : 'am'; hr = hr % 12; if (hr === 0) hr = 12;
    return `${hr.toString().padStart(2, '0')}:${mm} ${suf}`;
  }

  async cerrarSesion() {
    await this.credencialesService.logout();
    window.location.href = '/home';
  }
}
