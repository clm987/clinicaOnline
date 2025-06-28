import { Component, OnInit, inject, signal } from '@angular/core';
import { SupabaseDbService } from '../../../services/supabase-db.service';
import { CredencialesService } from '../../../services/credenciales.service';
import { Turno } from '../../../models/interfaces-turnos';

@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: false,
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos-especialista.component.css']
})
export class MisTurnosEspecialistaComponent implements OnInit {
  private db = inject(SupabaseDbService);
  private auth = inject(CredencialesService);

  turnos = signal<Turno[]>([]);
  especialidades = signal<string[]>([]);
  filtro = signal<{ filtroEspecialidad: string; filtroPaciente: string }>({
    filtroEspecialidad: '',
    filtroPaciente: ''
  });

  comentario = signal<{ [turnoId: string]: string }>({});
  usuarioActual: any = null;

  async ngOnInit() {
    this.usuarioActual = await this.auth.getUsuarioActualAsync();
    await this.cargarDatos();
  }

  async cargarDatos() {
    if (!this.usuarioActual) return;

    const perfil = await this.auth.getPerfilActual();
    if (perfil !== 'especialista') return;

    const [todosTurnos, misEspecialidades] = await Promise.all([
      this.db.obtenerTurnosPorUsuario(this.usuarioActual.id, 'especialista'),
      this.db.obtenerUsuarioActual(this.usuarioActual.id)
    ]);

    const procesados = todosTurnos.map(t => ({
      ...t,
      fecha_turno: new Date(t.fecha_hora),
      hora_turno: new Date(t.fecha_hora).toTimeString().substring(0, 5)
    }));

    this.turnos.set(procesados);
    this.especialidades.set(misEspecialidades.especialidades || []);
  }

  cumpleFiltro = (turno: Turno): boolean => {
    const f = this.filtro();
    const coincideEspecialidad =
      !f.filtroEspecialidad || turno.especialidad === f.filtroEspecialidad;

    const coincidePaciente =
      !f.filtroPaciente ||
      (turno.nombre_paciente!.toLowerCase().includes(f.filtroPaciente.toLowerCase()) ||
        turno.apellido_paciente!.toLowerCase().includes(f.filtroPaciente.toLowerCase()));

    return coincideEspecialidad && coincidePaciente;
  };

  puedeCancelar(t: Turno): boolean {
    return !['aceptado', 'realizado', 'rechazado'].includes(t.estado!);
  }

  puedeRechazar(t: Turno): boolean {
    return !['aceptado', 'realizado', 'cancelado'].includes(t.estado!);
  }

  puedeAceptar(t: Turno): boolean {
    return !['realizado', 'cancelado', 'rechazado'].includes(t.estado!);
  }

  puedeFinalizar(t: Turno): boolean {
    return t.estado === 'aceptado';
  }

  puedeVerResena(t: Turno): boolean {
    return !!t.comentario_especialista;
  }

  async cancelarTurno(turno: Turno) {
    const texto = this.comentario()[turno.id!];
    if (!texto) return;
    await this.db.cancelarTurno(turno.id!, texto);
    await this.cargarDatos();
  }

  async rechazarTurno(turno: Turno) {
    const texto = this.comentario()[turno.id!];
    if (!texto) return;
    await this.db.rechazarTurno(turno.id!, texto);
    await this.cargarDatos();
  }

  async aceptarTurno(turno: Turno) {
    await this.db.aceptarTurno(turno.id!);
    await this.cargarDatos();
  }

  async finalizarTurno(turno: Turno) {
    const texto = this.comentario()[turno.id!];
    if (!texto) return;
    await this.db.finalizarTurno(turno.id!, texto);
    await this.cargarDatos();
  }

  actualizarComentario(turnoId: string, texto: string) {
    this.comentario.set({ ...this.comentario(), [turnoId]: texto });
  }

  actualizarFiltroEspecialidad(valor: string) {
    this.filtro.set({
      ...this.filtro(),
      filtroEspecialidad: valor
    });
  }

  actualizarFiltroPaciente(valor: string) {
    this.filtro.set({
      ...this.filtro(),
      filtroPaciente: valor
    });
  }
}
