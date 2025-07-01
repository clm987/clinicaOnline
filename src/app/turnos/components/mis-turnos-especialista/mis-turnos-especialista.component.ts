import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseDbService } from '../../../services/supabase-db.service';
import { CredencialesService } from '../../../services/credenciales.service';
import { Turno, Especialidad } from '../../../models/interfaces-turnos';

@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: false,
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos-especialista.component.css']
})
export class MisTurnosEspecialistaComponent implements OnInit {
  private db = inject(SupabaseDbService);
  private auth = inject(CredencialesService);
  private fb = inject(FormBuilder);

  turnos = signal<Turno[]>([]);
  especialidades = signal<Especialidad[]>([]);
  filtro = signal<{ filtroEspecialidad: string; filtroPaciente: string }>({ filtroEspecialidad: '', filtroPaciente: '' });

  comentario = signal<{ [id: string]: string }>({});
  usuarioActual: any = null;

  modalVisible = signal(false);
  turnoSeleccionado: Turno | null = null;
  mensajeModal = signal('');
  historiaForm!: FormGroup;
  mensaje = signal<{ texto: string; tipo: 'success' | 'error' | 'warning' | 'info' } | null>(null);



  async ngOnInit() {
    this.usuarioActual = await this.auth.getUsuarioActualAsync();
    this.historiaForm = this.fb.group({
      altura: ['', Validators.required],
      peso: ['', Validators.required],
      temperatura: ['', Validators.required],
      presion: ['', Validators.required],
      clave1: ['', Validators.required],
      valor1: ['', Validators.required],
      clave2: ['', Validators.required],
      valor2: ['', Validators.required],
      clave3: ['', Validators.required],
      valor3: ['', Validators.required]
    });
    await this.cargarDatos();
  }

  async cargarDatos() {
    if (!this.usuarioActual) return;
    if ((await this.auth.getPerfilActual()) !== 'especialista') return;

    const [todosTurnos, misDatos, todasEsp] = await Promise.all([
      this.db.obtenerTurnosPorUsuario(this.usuarioActual.id, 'especialista'),
      this.db.obtenerUsuarioActual(this.usuarioActual.id),
      this.db.obtenerEspecialidadesConImagen()
    ]);

    const procesados = todosTurnos.map(t => ({
      ...t,
      fecha_turno: new Date(t.fecha_hora),
      hora_turno: new Date(t.fecha_hora).toTimeString().substring(0, 5)
    }));

    this.turnos.set(procesados);

    const propias = (misDatos.especialidades || []) as string[];
    const conImagen = todasEsp.filter(e => propias.includes(e.nombre));
    this.especialidades.set(conImagen);
  }

  cumpleFiltro = (t: Turno) => {
    const f = this.filtro();
    const okEsp = !f.filtroEspecialidad || t.especialidad === f.filtroEspecialidad;
    const okPac =
      !f.filtroPaciente ||
      t.nombre_paciente!.toLowerCase().includes(f.filtroPaciente.toLowerCase()) ||
      t.apellido_paciente!.toLowerCase().includes(f.filtroPaciente.toLowerCase());
    return okEsp && okPac;
  };

  puedeCancelar = (t: Turno) => !['aceptado', 'realizado', 'rechazado', 'cancelado'].includes(t.estado!);
  puedeRechazar = (t: Turno) => !['aceptado', 'realizado', 'cancelado'].includes(t.estado!);
  puedeAceptar = (t: Turno) => !['realizado', 'cancelado', 'rechazado'].includes(t.estado!);
  puedeFinalizar = (t: Turno) => t.estado === 'aceptado';
  puedeVerResena = (t: Turno) => t.estado === 'realizado' && !!t.comentario_especialista;
  verResena(t: Turno) {
    this.mensaje.set(null);
    setTimeout(() => {
      this.mensaje.set({
        texto: `Reseña del especialista:\n\n${t.comentario_especialista}`,
        tipo: 'info'
      });
    });
  }


  async cancelarTurno(t: Turno) { const txt = this.comentario()[t.id!]; if (!txt) return; await this.db.cancelarTurno(t.id!, txt); await this.cargarDatos(); }
  async rechazarTurno(t: Turno) { const txt = this.comentario()[t.id!]; if (!txt) return; await this.db.rechazarTurno(t.id!, txt); await this.cargarDatos(); }
  async aceptarTurno(t: Turno) { await this.db.aceptarTurno(t.id!); await this.cargarDatos(); }

  mostrarModalFinalizar(t: Turno) { this.turnoSeleccionado = t; this.modalVisible.set(true); this.historiaForm.reset(); this.mensajeModal.set(''); }
  cerrarModal() { this.modalVisible.set(false); this.turnoSeleccionado = null; }

  async guardarHistoria() {
    if (!this.turnoSeleccionado) return;
    if (this.historiaForm.invalid) { this.mensajeModal.set('Complete todos los campos.'); return; }
    const f = this.historiaForm.value;
    const datosExtra: any = {
      [f.clave1]: f.valor1,
      [f.clave2]: f.valor2,
      [f.clave3]: f.valor3
    };
    const historia = {
      paciente_id: this.turnoSeleccionado.paciente_id,
      altura: f.altura,
      peso: f.peso,
      temperatura: f.temperatura,
      presion: f.presion,
      datos_extra: datosExtra
    };
    try {
      await this.db.guardarHistoriaClinica(historia);
      const txt = this.comentario()[this.turnoSeleccionado.id!] || '';
      await this.db.finalizarTurno(this.turnoSeleccionado.id!, txt);
      this.cerrarModal();
      await this.cargarDatos();
    } catch { this.mensajeModal.set('Error al guardar la historia clínica.'); }
  }

  actualizarComentario(id: string, txt: string) { this.comentario.set({ ...this.comentario(), [id]: txt }); }
  actualizarFiltroEspecialidad(v: string) { this.filtro.set({ ...this.filtro(), filtroEspecialidad: v }); }
  actualizarFiltroPaciente(v: string) { this.filtro.set({ ...this.filtro(), filtroPaciente: v }); }

  async cerrarSesion() {
    await this.auth.logout();
    window.location.href = '/home';
  }
}
