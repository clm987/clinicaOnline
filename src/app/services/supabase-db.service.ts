import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseDbService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.apiUrl, environment.publicAnonKey);
  }

  async obtenerUsuarioActual(userAuthId: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('user_auth_id', userAuthId)
      .single();

    if (error) throw error;
    return data;
  }

  async obtenerTodosLosUsuarios() {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*');

    if (error) throw error;
    return data;
  }

  async actualizarEstadoEspecialista(userAuthId: string, habilitado: boolean) {
    const { error } = await this.supabase
      .from('usuarios')
      .update({ habilitado })
      .eq('user_auth_id', userAuthId);

    if (error) throw error;
  }

  async agregarEspecialidad(nombre: string) {
    const { error } = await this.supabase
      .from('especialidades')
      .insert([{ nombre }]);

    if (error) throw error;
  }

  getCliente(): SupabaseClient {
    return this.supabase;
  }

  async obtenerEspecialidades(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('especialidades')
      .select('nombre')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener especialidades:', error.message);
      throw new Error('No se pudieron cargar las especialidades.');
    }

    return data.map((esp: { nombre: string }) => esp.nombre);
  }

  async registrarLoginUsuario(userAuthId: string, email: string): Promise<void> {
    const { error } = await this.supabase
      .from('logins')
      .insert([
        {
          user_auth_id: userAuthId,
          email: email,
          fecha_login: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error registrando login:', error.message);
      throw new Error('No se pudo registrar el inicio de sesión.');
    }
  }

}
