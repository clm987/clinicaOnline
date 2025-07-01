import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CredencialesService } from '../../services/credenciales.service';
import { SupabaseDbService } from '../../services/supabase-db.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private credencialesService = inject(CredencialesService);
  private router = inject(Router);
  private auth = inject(CredencialesService);

  usuario: User | null = null;
  perfil: string | null = null;
  botones: { texto: string; imagen: string; ruta: string }[] = [];

  async ngOnInit() {
    this.usuario = await this.credencialesService.getUsuarioActualAsync();

    if (this.usuario) {
      this.perfil = await this.credencialesService.getPerfilActual();
      this.cargarBotones();
    }
  }

  logout() {
    this.credencialesService.logout();
    this.usuario = null;
    this.botones = [];
  }

  private cargarBotones() {
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
          { texto: 'Administrar Turnos', imagen: 'assets/img/botonTurnos.png', ruta: '/turnos/admin' },
          { texto: 'Administrar Usuarios', imagen: 'assets/img/botonUsuarios.png', ruta: '/usuarios' },
          { texto: 'Estadísticas', imagen: 'assets/img/botonEstadisticas.png', ruta: '/estadisticas' }
        ];
        break;

      default:
        this.botones = [];
    }
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }
  async cerrarSesion() {
    await this.auth.logout();
    window.location.href = '/home';
  }
}
