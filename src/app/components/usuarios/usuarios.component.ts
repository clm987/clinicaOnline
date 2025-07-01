import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

import { SupabaseDbService } from '../../services/supabase-db.service';
import { CredencialesService } from '../../services/credenciales.service';
import { MensajeComponent } from '../mensaje/mensaje.component';
import { FiltroPipe } from '../../pipes/filtro.pipe';
import { CapitalizarPipe } from '../../pipes/capitalizar.pipe';
import { EstadoUsuarioPipe } from '../../pipes/estado-usuario.pipe';


@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MensajeComponent, FiltroPipe, CapitalizarPipe, EstadoUsuarioPipe],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  registroForm!: FormGroup;

  mensajeVisible = false;
  mensajeTexto = '';
  mensajeTipo: 'success' | 'error' | 'warning' | 'info' = 'info';

  perfilSeleccionado: 'paciente' | 'especialista' | 'admin' | null = null;
  especialidades: string[] = [];
  agregarEspecialidadManualmente = false;

  imagenPaciente1: File | null = null;
  imagenPaciente2: File | null = null;
  imagenEspecialista: File | null = null;
  imagenAdmin: File | null = null;
  pacientes: any[] = [];
  loadingUsuarios: boolean = true;

  constructor(
    private supabaseDb: SupabaseDbService,
    private credencialesService: CredencialesService,
    private fb: FormBuilder,
    private router: Router
  ) { }

  async ngOnInit() {
    this.obtenerUsuarios();
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$')]],
      edad: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required]],
      obraSocial: [''],
      especialidad: [''],
      nuevaEspecialidad: [''],
      agregarEspecialidadManualmente: [false]
    });
    try {
      this.especialidades = await this.supabaseDb.obtenerEspecialidades();
    } catch {
      this.mostrarMensaje('Error al cargar especialidades', 'error');
    }
  }

  async obtenerUsuarios() {
    this.loadingUsuarios = true;
    try {
      this.usuarios = await this.supabaseDb.obtenerTodosLosUsuarios();
      this.pacientes = this.usuarios.filter(u => u.perfil === 'paciente');
      this.loadingUsuarios = false;
    } catch {
      this.mostrarMensaje('Error al cargar usuarios', 'error');
    }
  }
  async imprimirTurnosPaciente(paciente: any) {
    try {
      const turnos = await this.supabaseDb.obtenerTurnosDePaciente(paciente.user_auth_id);
      if (!turnos.length) {
        this.mostrarMensaje('El paciente no tiene turnos registrados.', 'warning');
        return;
      }

      const rows = turnos.map(t => ({
        Especialista: t.nombre_especialista,
        Especialidad: t.especialidad,
        Fecha: new Date(t.fecha_hora).toLocaleDateString('es-ES'),
        Hora: new Date(t.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        Estado: t.estado
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Turnos');
      const nombreArchivo = `turnos_${paciente.apellido}_${paciente.nombre}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);
    } catch {
      this.mostrarMensaje('Error al generar el reporte', 'error');
    }
  }

  seleccionarPerfil(perfil: 'paciente' | 'especialista' | 'admin') {
    this.perfilSeleccionado = perfil;
    this.registroForm.reset();
    this.agregarEspecialidadManualmente = false;
    this.imagenPaciente1 = this.imagenPaciente2 = this.imagenEspecialista = this.imagenAdmin = null;
  }

  seleccionarArchivoPaciente1(e: any) { this.imagenPaciente1 = e.target.files[0]; }
  seleccionarArchivoPaciente2(e: any) { this.imagenPaciente2 = e.target.files[0]; }
  seleccionarArchivoEspecialista(e: any) { this.imagenEspecialista = e.target.files[0]; }
  seleccionarArchivoAdmin(e: any) { this.imagenAdmin = e.target.files[0]; }

  async crearUsuario() {
    try {
      if (this.registroForm.invalid || !this.perfilSeleccionado) {
        this.registroForm.markAllAsTouched();
        throw new Error('Complete todos los campos requeridos.');
      }
      const f = this.registroForm.value;
      const user = await this.credencialesService.registrarUsuario(f.email, f.contrasena);

      let avatarUrl = '';
      let imagenExtra1 = '';
      const extra: any = {};

      if (this.perfilSeleccionado === 'paciente') {
        if (!this.imagenPaciente1 || !this.imagenPaciente2) throw new Error('Debe subir ambas imágenes del paciente.');
        avatarUrl = await this.credencialesService.subirAvatar(this.imagenPaciente1);
        imagenExtra1 = await this.credencialesService.subirAvatar(this.imagenPaciente2);
        extra.obra_social = f.obraSocial;
        extra.imagen_extra_1 = imagenExtra1;
      }

      if (this.perfilSeleccionado === 'especialista') {
        if (!this.imagenEspecialista) throw new Error('Debe subir una imagen de perfil.');
        avatarUrl = await this.credencialesService.subirAvatar(this.imagenEspecialista);
        extra.especialidad = f.agregarEspecialidadManualmente && f.nuevaEspecialidad ? f.nuevaEspecialidad : f.especialidad;
        if (f.agregarEspecialidadManualmente && f.nuevaEspecialidad) await this.supabaseDb.agregarEspecialidad(f.nuevaEspecialidad);
      }

      if (this.perfilSeleccionado === 'admin') {
        if (!this.imagenAdmin) throw new Error('Debe subir una imagen de perfil.');
        avatarUrl = await this.credencialesService.subirAvatar(this.imagenAdmin);
      }

      await this.credencialesService.guardarDatosUsuario(
        user, f.nombre, f.apellido, +f.edad, f.dni, this.perfilSeleccionado, avatarUrl, extra
      );

      this.mostrarMensaje('Usuario creado con éxito', 'success');
      this.registroForm.reset();
      this.perfilSeleccionado = null;
      this.obtenerUsuarios();
    } catch (e: any) {
      this.mostrarMensaje(e.message || 'Error al crear el usuario', 'error');
    }
  }

  async alternarHabilitacion(user: any) {
    try {
      await this.supabaseDb.actualizarEstadoEspecialista(user.user_auth_id, !user.habilitado);
      this.mostrarMensaje('Estado actualizado correctamente', 'success');
      this.obtenerUsuarios();
    } catch {
      this.mostrarMensaje('Error al actualizar estado', 'error');
    }
  }

  descargarExcel() {
    if (!this.usuarios.length) {
      this.mostrarMensaje('No hay usuarios para exportar', 'warning');
      return;
    }
    const rows = this.usuarios.map(u => ({
      Nombre: u.nombre,
      Apellido: u.apellido,
      Perfil: u.perfil,
      Email: u.email,
      Estado: u.perfil === 'especialista' ? (u.habilitado ? 'Habilitado' : 'Inhabilitado') : ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'usuarios-clinica.xlsx');
  }

  verPerfil(user: any) {
    if (user.perfil === 'admin') return;
    this.router.navigate(['/mi-perfil', user.user_auth_id]);
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error' | 'warning' | 'info') {
    this.mensajeTexto = texto;
    this.mensajeTipo = tipo;
    this.mensajeVisible = true;
    setTimeout(() => this.mensajeVisible = false, 4000);
  }

  cerrarSesion() {
    this.credencialesService.logout();
    window.location.href = '/home';
  }
}
