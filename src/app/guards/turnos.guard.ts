import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CredencialesService } from '../services/credenciales.service';

@Injectable({
  providedIn: 'root'
})
export class TurnosGuard implements CanActivate {

  constructor(private credenciales: CredencialesService, private router: Router) { }

  async canActivate(): Promise<boolean> {
    const perfil = await this.credenciales.getPerfilActual();

    if (perfil === 'paciente') {
      this.router.navigate(['/mis-turnos/paciente']);
    } else if (perfil === 'especialista') {
      this.router.navigate(['/mis-turnos/especialista']);
    } else {
      this.router.navigate(['/home']);
    }

    return false;
  }
}
