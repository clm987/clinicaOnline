import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseDbService } from '../../services/supabase-db.service';
import { CredencialesService } from '../../services/credenciales.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MensajeComponent } from '../mensaje/mensaje.component';
import { FiltroPipe } from '../../pipes/filtro.pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MensajeComponent, FiltroPipe],
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
    } catch (error) {
      this.mostrarMensaje('Error al cargar especialidades', 'error');
    }
  }

  async obtenerUsuarios() {
    try {
      this.usuarios = await this.supabaseDb.obtenerTodosLosUsuarios();
    } catch (error) {
      this.mostrarMensaje('Error al cargar usuarios', 'error');
    }
  }

  seleccionarPerfil(perfil: 'paciente' | 'especialista' | 'admin') {
    this.perfilSeleccionado = perfil;
    this.registroForm.reset();
    this.agregarEspecialidadManualmente = false;
    this.imagenPaciente1 = null;
    this.imagenPaciente2 = null;
    this.imagenEspecialista = null;
    this.imagenAdmin = null;
  }

  seleccionarArchivoPaciente1(event: any) {
    this.imagenPaciente1 = event.target.files[0];
  }

  seleccionarArchivoPaciente2(event: any) {
    this.imagenPaciente2 = event.target.files[0];
  }

  seleccionarArchivoEspecialista(event: any) {
    this.imagenEspecialista = event.target.files[0];
  }

  seleccionarArchivoAdmin(event: any) {
    this.imagenAdmin = event.target.files[0];
  }

  async crearUsuario() {
    try {
      if (this.registroForm.invalid || !this.perfilSeleccionado) {
        this.registroForm.markAllAsTouched();
        throw new Error('Complete todos los campos requeridos.');
      }

      const form = this.registroForm.value;
      const user = await this.credencialesService.registrarUsuario(form.email, form.contrasena);

      let avatarUrl = '';
      let imagenExtra1 = '';
      const extra: any = {};

      if (this.perfilSeleccionado === 'paciente') {
        if (!this.imagenPaciente1 || !this.imagenPaciente2) {
          throw new Error('Debe subir ambas imágenes del paciente.');
        }
        avatarUrl = await this.credencialesService.subirAvatar(this.imagenPaciente1);
        imagenExtra1 = await this.credencialesService.subirAvatar(this.imagenPaciente2);
        extra.obra_social = form.obraSocial;
        extra.imagen_extra_1 = imagenExtra1;
      }

      if (this.perfilSeleccionado === 'especialista') {
        if (!this.imagenEspecialista) throw new Error('Debe subir una imagen de perfil.');
        avatarUrl = await this.credencialesService.subirAvatar(this.imagenEspecialista);
        if (form.agregarEspecialidadManualmente && form.nuevaEspecialidad) {
          await this.supabaseDb.agregarEspecialidad(form.nuevaEspecialidad);
          extra.especialidad = form.nuevaEspecialidad;
        } else {
          extra.especialidad = form.especialidad;
        }
      }

      if (this.perfilSeleccionado === 'admin') {
        if (!this.imagenAdmin) throw new Error('Debe subir una imagen de perfil.');
        avatarUrl = await this.credencialesService.subirAvatar(this.imagenAdmin);
      }

      await this.credencialesService.guardarDatosUsuario(
        user,
        form.nombre,
        form.apellido,
        +form.edad,
        form.dni,
        this.perfilSeleccionado,
        avatarUrl,
        extra
      );

      this.mostrarMensaje('Usuario creado con éxito', 'success');
      this.registroForm.reset();
      this.perfilSeleccionado = null;
      this.obtenerUsuarios();
    } catch (error: any) {
      this.mostrarMensaje(error.message || 'Error al crear el usuario', 'error');
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

  mostrarMensaje(texto: string, tipo: 'success' | 'error' | 'warning' | 'info') {
    this.mensajeTexto = texto;
    this.mensajeTipo = tipo;
    this.mensajeVisible = true;
    setTimeout(() => this.mensajeVisible = false, 4000);
  }

  cerrarSesion() {
    this.credencialesService.logout();
    this.router.navigate(['/home']);
  }


}
