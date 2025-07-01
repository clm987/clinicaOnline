import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { CredencialesService } from '../../services/credenciales.service';
import { SupabaseDbService } from '../../services/supabase-db.service';
import { MensajeComponent } from '../mensaje/mensaje.component';
import { BotonesRedondosDirective } from '../../directivas/botones-redondos.directive';



@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MensajeComponent,
    BotonesRedondosDirective
  ],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.css']
})
export class MiPerfilComponent implements OnInit {
  private auth = inject(CredencialesService);
  private db = inject(SupabaseDbService);
  private route = inject(ActivatedRoute);

  usuario = signal<any | null>(null);
  logueado = signal<any | null>(null);
  perfil = signal<string | null>(null);
  mensaje = signal<{ texto: string; tipo: 'success' | 'error' | 'info' } | null>(null);

  especialidades = signal<string[]>([]);
  pacientes = signal<any[]>([]);
  pacienteSeleccionado = signal<any | null>(null);
  historiaSeleccionada = signal<any | null>(null);
  turnosPaciente = signal<any[]>([]);

  pacienteId: string | null = null;

  busquedaEspecialista: string = '';
  turnosEncontrados = signal<any[]>([]);

  dias = [
    { nombre: 'lunes', dow: 1, sel: false },
    { nombre: 'martes', dow: 2, sel: false },
    { nombre: 'miércoles', dow: 3, sel: false },
    { nombre: 'jueves', dow: 4, sel: false },
    { nombre: 'viernes', dow: 5, sel: false },
    { nombre: 'sábado', dow: 6, sel: false }
  ];
  especialidadSeleccionada = '';
  horarioInicio = '';
  horarioFin = '';
  fechaInicio = '';
  fechaFin = '';

  async ngOnInit() {
    const uAuth = await this.auth.getUsuarioActualAsync();
    if (!uAuth) return;

    const datosLog = await this.db.obtenerUsuarioActual(uAuth.id);
    this.logueado.set(datosLog);
    this.perfil.set(datosLog.perfil);

    this.pacienteId = this.route.snapshot.paramMap.get('id') ?? datosLog.user_auth_id;
    if (!this.pacienteId) return;
    const datosPaciente = await this.db.obtenerUsuarioActual(this.pacienteId);
    this.usuario.set(datosPaciente);

    if (datosLog.perfil === 'especialista') {
      this.especialidades.set(datosLog.especialidades || []);
      await this.cargarPacientes(datosLog.user_auth_id);
    }
  }

  async cargarPacientes(especialistaId: string) {
    this.pacientes.set(await this.db.obtenerPacientesAtendidos(especialistaId));
  }

  async seleccionarPaciente(p: any) {
    this.pacienteSeleccionado.set(p);
    await this.cargarDetallePaciente(p.user_auth_id);
  }

  async cargarDetallePaciente(pacienteAuthId: string) {
    const historia = await this.db.obtenerHistoriaClinica(pacienteAuthId);
    this.historiaSeleccionada.set(historia);
    const turnos = await this.db.obtenerTurnosPacienteEspecialista(
      pacienteAuthId,
      this.logueado()?.user_auth_id
    );
    this.turnosPaciente.set(turnos.filter(t => t.estado === 'realizado'));
  }

  async buscarTurnos() {
    const termino = this.busquedaEspecialista.trim().toLowerCase();
    this.turnosEncontrados.set([]);

    if (!termino || !this.pacienteId) {
      return;
    }

    try {
      const usuarios = await this.db.obtenerTodosLosUsuarios();
      const especialista = usuarios.find(
        (u: any) =>
          u.perfil === 'especialista' &&
          `${u.nombre} ${u.apellido}`.toLowerCase().includes(termino)
      );

      if (!especialista) {
        this.mensaje.set({ texto: 'Especialista no encontrado.', tipo: 'info' });
        return;
      }
      const todos = await this.db.obtenerTurnosPacienteEspecialista(
        this.pacienteId,
        especialista.user_auth_id
      );
      const realizados = todos.filter((t: any) => t.estado === 'realizado');

      if (!realizados.length) {
        this.mensaje.set({
          texto: 'No se encontraron turnos realizados con este especialista.',
          tipo: 'info'
        });
      }
      this.turnosEncontrados.set(realizados);
    } catch {
      this.mensaje.set({ texto: 'Error al buscar turnos.', tipo: 'error' });
    }
  }

  async imprimirTurnos() {
    const lista = this.turnosEncontrados();
    if (!lista.length) {
      this.mensaje.set({ texto: 'No hay turnos para imprimir.', tipo: 'info' });
      return;
    }
    const doc = new jsPDF('p', 'pt', 'a4');
    const logoData = await this.base64Image('assets/img/logoClinica.png');
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(logoData, 'PNG', (pageWidth - 60) / 2, 20, 60, 60);
    doc.setFontSize(16);
    doc.text('Turnos por Especialista', pageWidth / 2, 100, { align: 'center' });
    autoTable(doc, {
      startY: 120,
      head: [['Especialista', 'Especialidad', 'Fecha', 'Hora', 'Comentario especialista']],
      body: lista.map(t => [
        `${t.nombre_especialista}`,
        t.especialidad,
        new Date(t.fecha_hora).toLocaleDateString('es-ES'),
        new Date(t.fecha_hora).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        t.comentario_especialista || ''
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] },
      styles: { fontSize: 10 }
    });
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.text(
      `Fecha de descarga: ${new Date().toLocaleDateString('es-ES')}`,
      40,
      pageHeight - 20
    );

    doc.save('turnos_especialista.pdf');
  }


  private parseLocalDate(str: string) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  private fmtDate(d: Date) {
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  async descargarHistoriaClinica() {
    const p = this.usuario();
    if (!p) return;

    const historia = await this.db.obtenerHistoriaClinica(p.user_auth_id);
    const turnos = (await this.db.obtenerTurnosPacienteEspecialista(p.user_auth_id))
      .filter((t: any) => t.estado === 'realizado');

    const doc = new jsPDF();
    const logoData = await this.base64Image('assets/img/logoClinica.png');
    const w = doc.internal.pageSize.getWidth();
    doc.addImage(logoData, 'PNG', (w - 40) / 2, 10, 40, 40);

    let y = 55;
    doc.setFontSize(14);
    doc.text('Información del paciente', 20, y);
    y += 8;
    doc.setFontSize(11);
    const info = [
      `Nombre: ${p.nombre} ${p.apellido}`,
      `Altura: ${historia?.altura || '-'}`,
      `Peso: ${historia?.peso || '-'}`,
      `Temperatura: ${historia?.temperatura || '-'}`,
      `Presión: ${historia?.presion || '-'}`
    ];
    info.forEach(t => { doc.text(t, 20, y); y += 6; });
    if (historia?.datos_extra)
      Object.entries(historia.datos_extra).forEach(([k, v]) => { doc.text(`${k}: ${v}`, 20, y); y += 6; });

    y += 4;
    doc.setFontSize(14);
    doc.text('Atenciones recibidas', 20, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Especialidad', 'Comentario']],
      body: turnos.map((t: any) => [
        new Date(t.fecha_hora).toLocaleDateString('es-ES'),
        t.especialidad,
        t.comentario_especialista || ''
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }
    });

    doc.setFontSize(10);
    doc.text(`Generado en: ${new Date().toLocaleDateString('es-ES')}`, 20, doc.internal.pageSize.getHeight() - 15);
    doc.save(`historia_clinica_${p.apellido}_${p.nombre}.pdf`);
  }

  private async base64Image(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>(r => {
      const fr = new FileReader();
      fr.onloadend = () => r(fr.result as string);
      fr.readAsDataURL(blob);
    });
  }

  async guardarDisponibilidad() {
    if (!this.especialidadSeleccionada || !this.horarioInicio || !this.horarioFin || !this.fechaInicio || !this.fechaFin) {
      this.mensaje.set({ texto: 'Complete todos los campos.', tipo: 'error' });
      return;
    }
    const inicio = this.parseLocalDate(this.fechaInicio);
    const fin = this.parseLocalDate(this.fechaFin);
    if (inicio > fin) {
      this.mensaje.set({ texto: 'Fecha inicio debe ser anterior a fecha fin.', tipo: 'error' });
      return;
    }
    const ds = this.dias.filter(d => d.sel);
    if (!ds.length) {
      this.mensaje.set({ texto: 'Seleccione al menos un día.', tipo: 'error' });
      return;
    }
    const regs = [];
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      if (ds.find(x => x.dow === d.getDay()))
        regs.push({
          especialista_id: this.logueado()?.user_auth_id,
          fecha: this.fmtDate(d),
          horario_inicio: this.horarioInicio,
          horario_fin: this.horarioFin,
          dias_semana: ds.map(x => x.nombre)
        });
    }
    for (const r of regs) await this.db.guardarDisponibilidad(r);
    this.mensaje.set({ texto: 'Disponibilidades guardadas.', tipo: 'success' });
    this.resetFormularioHorarios();
  }

  resetFormularioHorarios() {
    this.horarioInicio = this.horarioFin = this.fechaInicio = this.fechaFin = this.especialidadSeleccionada = '';
    this.dias.forEach(d => d.sel = false);
  }

  async cerrarSesion() {
    await this.auth.logout();
    window.location.href = '/home';
  }
}
