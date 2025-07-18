import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { Router } from '@angular/router';

import { CredencialesService } from '../../services/credenciales.service';
import { SupabaseDbService } from '../../services/supabase-db.service';

import { FiltroPipe } from '../../pipes/filtro.pipe';
import { MensajeComponent } from '../../components/mensaje/mensaje.component';
import { CaptchaDirective } from '../../directivas/captcha.directive';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FiltroPipe,
    MensajeComponent,
    CaptchaDirective
  ],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private dbService = inject(SupabaseDbService);
  private credencialesService = inject(CredencialesService);
  private router = inject(Router);

  mensajeTexto = '';
  mensajeTipo: 'success' | 'error' = 'success';
  mensajeVisible = false;

  captchaPregunta = '';
  captchaResultado = '';

  registroForm!: FormGroup;

  perfilSeleccionado: 'paciente' | 'especialista' | null = null;
  especialidades: string[] = [];
  especialidadesSeleccionadas: string[] = [];

  agregarEspecialidadManualmente = false;

  imagenPaciente1: File | null = null;
  imagenPaciente2: File | null = null;
  imagenEspecialista: File | null = null;

  async ngOnInit() {
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
      agregarEspecialidadManualmente: [false],
      captcha: ['', Validators.required]
    });

    this.especialidades = await this.dbService.obtenerEspecialidades();
    this.generarCaptcha();
  }

  seleccionarPerfil(tipo: 'paciente' | 'especialista') {
    this.perfilSeleccionado = tipo;
  }

  seleccionarArchivoPaciente1(e: any) {
    this.imagenPaciente1 = e.target.files[0];
  }
  seleccionarArchivoPaciente2(e: any) {
    this.imagenPaciente2 = e.target.files[0];
  }
  seleccionarArchivoEspecialista(e: any) {
    this.imagenEspecialista = e.target.files[0];
  }

  agregarEspecialidad(item: string) {
    const nombre = item.trim();
    if (!nombre || this.especialidadesSeleccionadas.includes(nombre)) return;
    this.especialidadesSeleccionadas.push(nombre);
    this.registroForm.get('especialidad')?.setValue('');
  }

  eliminarEspecialidad(nombre: string) {
    this.especialidadesSeleccionadas = this.especialidadesSeleccionadas.filter(e => e !== nombre);
  }

  async registrar() {
    try {
      if (this.registroForm.invalid || !this.perfilSeleccionado) {
        this.registroForm.markAllAsTouched();
        throw new Error('Complete todos los campos requeridos.');
      }

      const f = this.registroForm.value;
      const user = await this.credencialesService.registrarUsuario(f.email, f.contrasena);

      let avatarUrl = '';
      let imagenExtra1 = '';

      if (this.perfilSeleccionado === 'paciente') {
        if (!this.imagenPaciente1 || !this.imagenPaciente2) throw new Error('Debe subir las 2 imágenes');
        avatarUrl = await this.credencialesService.subirAvatar(this.imagenPaciente1);
        imagenExtra1 = await this.credencialesService.subirAvatar(this.imagenPaciente2);
      } else {
        if (!this.imagenEspecialista) throw new Error('Debe subir una imagen');
        avatarUrl = await this.credencialesService.subirAvatar(this.imagenEspecialista);

        if (this.agregarEspecialidadManualmente && f.nuevaEspecialidad) {
          await this.dbService.agregarEspecialidad(f.nuevaEspecialidad);
          this.agregarEspecialidad(f.nuevaEspecialidad);
        }
      }

      const extra: any = {};
      if (this.perfilSeleccionado === 'paciente') {
        extra.obra_social = f.obraSocial;
        extra.imagen_extra_1 = imagenExtra1;
      } else {
        if (!this.especialidadesSeleccionadas.length) {
          throw new Error('Debe seleccionar al menos una especialidad');
        }
        extra.especialidades = this.especialidadesSeleccionadas;
      }

      await this.credencialesService.guardarDatosUsuario(
        user,
        f.nombre,
        f.apellido,
        +f.edad,
        f.dni,
        this.perfilSeleccionado,
        avatarUrl,
        extra
      );

      this.mensajeTexto = 'Registro exitoso. Por favor, verifique su email.';
      this.mensajeTipo = 'success';
      this.mensajeVisible = true;
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.mensajeTexto = e.message || 'Ocurrió un error';
      this.mensajeTipo = 'error';
      this.mensajeVisible = true;
    }
  }

  cancelar() {
    this.router.navigate(['/home']);
  }

  generarCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    this.captchaPregunta = `¿Cuánto es ${a} + ${b}?`;
    this.captchaResultado = (a + b).toString();
  }
}
