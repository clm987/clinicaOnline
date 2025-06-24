import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CredencialesService } from '../../services/credenciales.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private credencialesService = inject(CredencialesService);

  usuario = this.credencialesService.getUsuarioActual();
  perfil: string | null = null;

  botones: { texto: string; imagen: string; ruta: string }[] = [];
  logout() {
    this.credencialesService.logout();
    this.usuario = null;
  }

  async ngOnInit() {
    if (this.usuario) {
      this.perfil = await this.credencialesService.getPerfilActual();
      this.cargarBotones();
    }
  }

  cargarBotones() {
    switch (this.perfil) {
      case 'paciente':
        this.botones = [
          { texto: 'Mis turnos', imagen: 'assets/img/botonTurnos.png', ruta: '/turnos/paciente' },
          { texto: 'Mi perfil', imagen: 'assets/img/botonUsuarios.png', ruta: '/mi-perfil' }
        ];
        break;

      case 'especialista':
        this.botones = [
          { texto: 'Turnos', imagen: 'assets/img/botonTurnos.png', ruta: '/turnos/especialista' },
          { texto: 'Mi perfil', imagen: 'assets/img/botonUsuarios.png', ruta: '/mi-perfil' }
        ];
        break;

      case 'admin':
        this.botones = [
          { texto: 'Administrar Turnos', imagen: 'assets/img/botonTurnos.png', ruta: '/admin-turnos' },
          { texto: 'Administrar Usuarios', imagen: 'assets/img/botonUsuarios.png', ruta: '/usuarios' },
          { texto: 'Estadísticas y Reportes', imagen: 'assets/img/botonEstadisticas.png', ruta: '/estadisticas' }
        ];
        break;

      default:
        this.botones = [];
    }
  }
}
