import { Injectable } from '@angular/core';
import { SupabaseDbService } from './supabase-db.service';
import { SupabaseClient, User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class CredencialesService {
  private supabase: SupabaseClient;
  private usuarioActual: User | null = null;

  constructor(private dbService: SupabaseDbService) {
    this.supabase = dbService.getCliente();
    this.cargarUsuarioDesdeSesion();
  }


  private async cargarUsuarioDesdeSesion() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.usuarioActual = user || null;
  }


  async getUsuarioActualAsync(): Promise<User | null> {
    if (this.usuarioActual) return this.usuarioActual;
    const { data: { user } } = await this.supabase.auth.getUser();
    this.usuarioActual = user || null;
    return this.usuarioActual;
  }

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) throw new Error('Credenciales inválidas');

    const usuarioDb = await this.dbService.obtenerUsuarioActual(data.user.id);

    if (!data.user.email_confirmed_at)
      throw new Error('Debe verificar su email para ingresar.');

    if (usuarioDb.perfil === 'especialista' && !usuarioDb.habilitado)
      throw new Error('Su cuenta aún no fue habilitada por un administrador.');

    this.usuarioActual = data.user;
    return data.user;
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.usuarioActual = null;
  }

  getUsuarioActual(): User | null {
    return this.usuarioActual;
  }

  estaLogueado(): boolean {
    return this.usuarioActual !== null;
  }

  async registrarUsuario(email: string, contrasena: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signUp({ email, password: contrasena });
    if (error || !data.user) throw new Error('Error al registrar: ' + error?.message);
    return data.user;
  }

  async subirAvatar(archivo: File): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('avatars')
      .upload(`users/${Date.now()}_${archivo.name}`, archivo, {
        cacheControl: '3600',
        upsert: false
      });
    if (error || !data?.path) throw new Error('Error al subir imagen: ' + error?.message);
    const { data: url } = this.supabase.storage.from('avatars').getPublicUrl(data.path);
    return url.publicUrl;
  }

  async guardarDatosUsuario(
    usuario: User,
    nombre: string,
    apellido: string,
    edad: number,
    dni: string,
    perfil: 'paciente' | 'especialista' | 'admin',
    avatarUrl: string,
    extra: any = {}
  ): Promise<void> {
    const payload = {
      user_auth_id: usuario.id,
      email: usuario.email,
      nombre,
      apellido,
      edad,
      dni,
      perfil,
      avatar_url: avatarUrl,
      habilitado: perfil === 'especialista' ? false : true,
      ...extra
    };
    const { error } = await this.supabase.from('usuarios').insert(payload);
    if (error) throw new Error('Error al guardar datos: ' + error.message);
  }

  async getPerfilActual(): Promise<string | null> {
    const user = await this.getUsuarioActualAsync();
    if (!user) return null;
    const usuarioDb = await this.dbService.obtenerUsuarioActual(user.id);
    return usuarioDb.perfil || null;
  }
}
