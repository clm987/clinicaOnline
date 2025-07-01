import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CredencialesService } from '../../services/credenciales.service';
import { SupabaseDbService } from '../../services/supabase-db.service';
import { MensajeComponent } from '../mensaje/mensaje.component';
import { Turno } from '../../models/interfaces-turnos';
import { ActivatedRoute } from '@angular/router';



@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MensajeComponent],
  templateUrl: './historia-clinica.component.html',
  styleUrls: ['./historia-clinica.component.css']
})
export class HistoriaClinicaComponent implements OnInit {
  private auth = inject(CredencialesService);
  private db = inject(SupabaseDbService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  usuario = signal<any | null>(null);
  perfil = signal<string | null>(null);
  pacientes = signal<any[]>([]);
  pacienteSeleccionado = signal<any | null>(null);
  historia = signal<any | null>(null);      // ← nueva señal
  turnos = signal<Turno[]>([]);
  historiaForm!: FormGroup;
  mensaje = signal<{ texto: string; tipo: 'success' | 'error' | 'info' } | null>(null);

  pacienteRutaId: string | null = null;

  async ngOnInit() {
    const user = await this.auth.getUsuarioActualAsync();
    if (!user) return;
    const datos = await this.db.obtenerUsuarioActual(user.id);
    this.usuario.set(datos);
    this.perfil.set(datos.perfil);
    this.pacienteRutaId = this.route.snapshot.paramMap.get('id');
    await this.cargarPacientes();
    this.inicializarFormulario();
  }

  private async cargarPacientes() {

    if (this.pacienteRutaId) {
      const paciente = await this.db.obtenerUsuarioActual(this.pacienteRutaId);
      this.pacientes.set([paciente]);
      this.pacienteSeleccionado.set(paciente);
      await this.cargarInfoPaciente(this.pacienteRutaId);
      return;
    }

    if (this.perfil() === 'admin') {
      this.pacientes.set(await this.db.obtenerTodosLosUsuarios());
    } else if (this.perfil() === 'especialista') {
      const lista = await this.db.obtenerPacientesAtendidos(this.usuario()?.user_auth_id);
      this.pacientes.set(lista);
    } else {
      this.pacientes.set([this.usuario()]);
      this.pacienteSeleccionado.set(this.usuario());
      await this.cargarInfoPaciente(this.usuario()?.user_auth_id);
    }
  }

  async seleccionarPaciente(p: any) {
    this.pacienteSeleccionado.set(p);
    await this.cargarInfoPaciente(p.user_auth_id);
  }

  private async cargarInfoPaciente(pacienteId: string) {
    this.historia.set(await this.db.obtenerHistoriaClinica(pacienteId));
    const t = await this.db.obtenerTurnosPacienteEspecialista(
      pacienteId,
      this.perfil() === 'especialista' ? this.usuario()?.user_auth_id : undefined
    );
    this.turnos.set(t.filter(x => x.estado === 'realizado'));
  }

  private inicializarFormulario() {
    this.historiaForm = this.fb.group({
      altura: ['', Validators.required],
      peso: ['', Validators.required],
      temperatura: ['', Validators.required],
      presion: ['', Validators.required],
      dinamica1: ['', Validators.required],
      valor1: ['', Validators.required],
      dinamica2: ['', Validators.required],
      valor2: ['', Validators.required],
      dinamica3: ['', Validators.required],
      valor3: ['', Validators.required]
    });
  }

  async guardarHistoria() {
    if (!this.pacienteSeleccionado()) return;
    if (this.historiaForm.invalid) {
      this.mensaje.set({ texto: 'Complete todos los campos.', tipo: 'error' });
      return;
    }
    const d = this.historiaForm.value;
    const payload = {
      paciente_id: this.pacienteSeleccionado()?.user_auth_id,
      altura: d.altura,
      peso: d.peso,
      temperatura: d.temperatura,
      presion: d.presion,
      datos_extra: {
        [d.dinamica1]: d.valor1,
        [d.dinamica2]: d.valor2,
        [d.dinamica3]: d.valor3
      }
    };
    await this.db.guardarHistoriaClinica(payload);
    this.mensaje.set({ texto: 'Historia clínica guardada.', tipo: 'success' });
    this.historiaForm.reset();
    await this.cargarInfoPaciente(this.pacienteSeleccionado()?.user_auth_id);
  }

  verResena(t: Turno) {
    this.mensaje.set({
      texto: `Reseña:\n\n${t.comentario_especialista || 'Sin reseña disponible.'}`,
      tipo: 'info'
    });
  }
}
