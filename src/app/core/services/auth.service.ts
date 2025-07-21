import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PickUsuario, TipoUsuario } from '../../data/interfaces/usuarios';
import { PlataformasPickmi } from '../../data/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private supabase: SupabaseClient;
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  private usuarioSubject = new BehaviorSubject<PickUsuario | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.init();
  }

  private async init() {
    try {
      const session = await this.safeGetSession();
      if (session) {
        this.sessionSubject.next(session);
        await this.loadUsuario(session.user.email || '');
      }
    } catch (err) {
      console.warn('Error inicializando sesión:', err);
    }
  }

  get usuario$() {
    return this.usuarioSubject.asObservable();
  }

  get currentUsuario(): PickUsuario | null {
    return this.usuarioSubject.value;
  }

  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }

  get session$() {
    return this.sessionSubject.asObservable();
  }

  get currentUser(): User | null {
    return this.sessionSubject.value?.user || null;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (!error) {
      this.sessionSubject.next(null);
      this.usuarioSubject.next(null);
    }
    return { error };
  }

  async login(email: string, password: string): Promise<{ session: Session | null; error: string | null }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return { session: null, error: error?.message || 'Error al iniciar sesión' };
    }

    this.sessionSubject.next(data.session);
    await this.loadUsuario(email);

    return { session: data.session, error: null };
  }

  async register(email: string, password: string): Promise<{ error: string | null }> {
    const { data: existingUser } = await this.supabase
      .from('pick_usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return { error: 'El correo ya está registrado.' };
    }

    const { data: userSignUp, error: signUpError } = await this.supabase.auth.signUp({ email, password });
    if (signUpError) {
      return { error: signUpError.message };
    }

    if (!userSignUp.user) {
      return { error: 'No se pudo obtener el usuario después del registro.' };
    }

    const { error: insertError } = await this.supabase.from('pick_usuarios').insert({
      id: userSignUp.user.id,
      email,
      tipo_usuario: TipoUsuario.PROPIETARIO,
      fecha_registro: new Date().toISOString(),
      fecha_creacion: new Date().toISOString(),
      creado_por: PlataformasPickmi.BUSINESS,
      estatus: 'pendiente',
    });

    if (insertError) {
      return { error: insertError.message };
    }

    this.sessionSubject.next(userSignUp.session);
    await this.loadUsuario(email);

    return { error: null };
  }


  private async loadUsuario(email: string) {
    const { data, error } = await this.supabase
      .from('pick_usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle<PickUsuario>();

    if (data) {
      this.usuarioSubject.next(data);
    } else {
      console.warn('Usuario no encontrado', error);
      this.usuarioSubject.next(null);
    }
  }

  async refreshUsuario(): Promise<void> {
    const email = this.sessionSubject.value?.user?.email;
    if (!email) {
      console.warn('No se pudo refrescar el usuario: sesión inválida');
      return;
    }
    await this.loadUsuario(email);
  }

  private async safeGetSession(retries = 3): Promise<Session | null> {
    try {
      const { data } = await this.supabase.auth.getSession();
      return data.session || null;
    } catch (error: any) {
      if (error.name === 'NavigatorLockAcquireTimeoutError' && retries > 0) {
        await new Promise(res => setTimeout(res, 300));
        return this.safeGetSession(retries - 1);
      }
      throw error;
    }
  }
}
