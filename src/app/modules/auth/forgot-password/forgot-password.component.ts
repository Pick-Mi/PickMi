import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import * as sweetAlert from '../../../data/utils/alerts';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {

  form: FormGroup;
  enviado = false;
  cargando = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email(): AbstractControl {
    return this.form.get('email')!;
  }

  async onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.cargando = true;
    const { error } = await this.authService.solicitarRecuperacion(this.email.value);
    this.cargando = false;

    if (error) {
      sweetAlert.alertError('Ocurrió un error. Intenta de nuevo.');
    } else {
      this.enviado = true;
    }
  }
}
