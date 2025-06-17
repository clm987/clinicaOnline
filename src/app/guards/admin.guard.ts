import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseDbService } from '../services/supabase-db.service';
import { CredencialesService } from '../services/credenciales.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const credenciales = inject(CredencialesService);
  const db = inject(SupabaseDbService);
  const router = inject(Router);

  const userAuth = credenciales.getUsuarioActual();

  if (!userAuth) {
    router.navigate(['/home']);
    return false;
  }

  try {
    const usuarioDb = await db.obtenerUsuarioActual(userAuth.id);

    if (usuarioDb.perfil === 'admin') {
      return true;
    }
  } catch (error) {
    console.error('Error en adminGuard:', error);
  }

  router.navigate(['/home']);
  return false;
};
