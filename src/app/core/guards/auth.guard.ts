import { Injectable } from '@angular/core';
import { CanActivateChild, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TipoUsuario } from '../../data/interfaces/usuarios';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivateChild {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivateChild(): Promise<boolean | UrlTree> {
    // Intentar refrescar usuario en caso de que no este cargado
    if (!this.auth.currentUsuario) {
      await this.auth.refreshUsuario();
    }

    const usuario = this.auth.currentUsuario;

    // Si no hay usuario, redirige al login
    if (!usuario) {
      return this.router.parseUrl('/auth/login');
    }

    // Si el usuario esta pendiente, redirige a completar perfil
    if (usuario.estatus === 'pendiente') {
      return this.router.parseUrl('/auth/complete');
    }

    // Solo permitir administradores
    if (usuario.tipo_usuario !== TipoUsuario.ADMIN) {
      await this.auth.logout();
      return this.router.parseUrl('/auth/login');
    }

    // Usuario valido y activo, permite acceso
    return true;
  }
}
