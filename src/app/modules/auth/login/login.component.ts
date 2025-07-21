import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import * as sweetAlert from '../../../data/utils/alerts';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  async onLogin() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    const { error } = await this.authService.login(email, password);

    if (error) {
      sweetAlert.alertError(error || 'Error al iniciar sesión');
      return;
    }

    // Esperamos a que se cargue el usuario actual
    const usuario = this.authService.currentUsuario;

    if (!usuario) {
      sweetAlert.alertError('No se pudo cargar la información del usuario');
      return;
    }

    if (usuario.estatus?.toLowerCase() === 'pendiente') {
      this.router.navigate(['/auth/complete']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

}
