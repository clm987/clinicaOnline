import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CredencialesService } from '../../services/credenciales.service';
import { SupabaseDbService } from '../../services/supabase-db.service';
import { FiltroPipe } from '../../pipes/filtro.pipe';
import { MensajeComponent } from '../../components/mensaje/mensaje.component';
import { CaptchaDirective } from '../../directivas/captcha.directive';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FiltroPipe, MensajeComponent, FormsModule, CaptchaDirective],
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

    try {
      this.especialidades = await this.dbService.obtenerEspecialidades();
    } catch (error) {
      console.error('Error cargando especialidades:', error);
    }
    this.generarCaptcha();
  }

  seleccionarPerfil(tipo: 'paciente' | 'especialista') {
    this.perfilSeleccionado = tipo;
    //  this.mensaje = '';
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

  async registrar() {
    try {
      if (this.registroForm.invalid || !this.perfilSeleccionado) {
        this.registroForm.markAllAsTouched();
        throw new Error('Complete todos los campos requeridos.');
      }

      const form = this.registroForm.value;
      const user = await this.credencialesService.registrarUsuario(form.email, form.contrasena);
      console.log('contraseña: ', form.contrasena);
      let avatarUrl = '';
      let imagenExtra1 = '';

      if (this.perfilSeleccionado === 'paciente') {
        if (!this.imagenPaciente1 || !this.imagenPaciente2) throw new Error('Debe subir las 2 imágenes');
        avatarUrl = await this.credencialesService.subirAvatar(this.imagenPaciente1);
        imagenExtra1 = await this.credencialesService.subirAvatar(this.imagenPaciente2);
      } else {
        if (!this.imagenEspecialista) throw new Error('Debe subir una imagen');
        avatarUrl = await this.credencialesService.subirAvatar(this.imagenEspecialista);

        if (this.agregarEspecialidadManualmente && form.nuevaEspecialidad) {
          await this.dbService.agregarEspecialidad(form.nuevaEspecialidad);
        }
      }

      const extra: any = {};
      if (this.perfilSeleccionado === 'paciente') {
        extra.obra_social = form.obraSocial;
        extra.imagen_extra_1 = imagenExtra1;
      } else {
        extra.especialidad = this.agregarEspecialidadManualmente ? form.nuevaEspecialidad : form.especialidad;
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

      this.mensajeTexto = 'Registro exitoso. Por favor, verifique su email.';
      this.mensajeTipo = 'success';
      this.mensajeVisible = true;
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.mensajeTexto = error.message || 'Ocurrió un error';
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
