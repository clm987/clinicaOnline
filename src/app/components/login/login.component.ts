import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CredencialesService } from '../../services/credenciales.service';
import { SupabaseDbService } from '../../services/supabase-db.service';
import { MensajeComponent } from '../mensaje/mensaje.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MensajeComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  usuario: string = '';
  contrasena: string = '';
  mensajeVisible = false;
  mensajeTexto = '';
  mensajeTipo: 'success' | 'error' | 'warning' | 'info' = 'info';
  cargando: string | null = null;

  @Output() onLoginSuccess = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  constructor(
    private credencialesService: CredencialesService,
    private supabaseDb: SupabaseDbService,
    private router: Router
  ) { }

  async login() {
    try {
      if (!this.usuario || !this.contrasena) {
        this.mostrarMensaje('Debe ingresar el correo y la contraseña.', 'warning');
        return;
      }

      const usuarioAutenticado = await this.credencialesService.login(this.usuario, this.contrasena);

      if (!usuarioAutenticado.email) {
        throw new Error('El usuario no tiene un email válido');
      }

      await this.supabaseDb.registrarLoginUsuario(usuarioAutenticado.id, usuarioAutenticado.email);

      this.mostrarMensaje('Inicio de sesión exitoso', 'success');
      this.onLoginSuccess.emit(usuarioAutenticado);
      this.router.navigate(['/home']);
    } catch (error) {
      console.error(error);
      this.mostrarMensaje('Credenciales inválidas.', 'error');
    }
  }

  async loginRapido(email: string, imagenKey: string) {
    this.cargando = imagenKey;
    this.usuario = email;
    this.contrasena = '123456';

    try {
      await this.login();
    } finally {
      this.cargando = null;
    }
  }

  cancelar() {
    this.onCancel.emit();
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.mensajeTexto = texto;
    this.mensajeTipo = tipo;
    this.mensajeVisible = true;
    setTimeout(() => (this.mensajeVisible = false), 4000);
  }

  logout() {
    this.credencialesService.logout();
    this.router.navigate(['/home']);
  }
}
