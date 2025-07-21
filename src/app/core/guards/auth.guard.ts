import { Injectable } from '@angular/core';
import { CanActivateChild, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivateChild {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivateChild(): Promise<boolean | UrlTree> {
    // 1. Intentar refrescar usuario en caso de que no esté cargado
    if (!this.auth.currentUsuario) {
      await this.auth.refreshUsuario();
    }

    const usuario = this.auth.currentUsuario;

    // 2. Si no hay usuario, redirige al login
    if (!usuario) {
      return this.router.parseUrl('/auth/login');
    }

    // 3. Si el usuario está pendiente, redirige a completar perfil
    if (usuario.estatus === 'pendiente') {
      return this.router.parseUrl('/auth/complete');
    }

    // 4. Usuario válido y activo, permite acceso
    return true;
  }
}
