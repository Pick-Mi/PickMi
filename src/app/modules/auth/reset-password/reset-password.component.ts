import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import * as sweetAlert from '../../../data/utils/alerts';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {

  form: FormGroup;
  listo = false;
  cargando = false;
  showPassword = false;
  showConfirm = false;
  recoveryReady = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm: ['', Validators.required]
      },
      { validators: this.passwordsMatch }
    );
  }

  ngOnInit() {
    // Supabase dispara PASSWORD_RECOVERY al procesar el hash de la URL del email
    const supabase = this.authService.getSupabaseClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.recoveryReady = true;
      }
    });

    // Caso en que el hash ya fue procesado antes de que cargara el componente
    if (this.authService.currentUser) {
      this.recoveryReady = true;
    }
  }

  get password(): AbstractControl { return this.form.get('password')!; }
  get confirm(): AbstractControl { return this.form.get('confirm')!; }

  private passwordsMatch(group: AbstractControl) {
    const pass = group.get('password')?.value;
    const conf = group.get('confirm')?.value;
    return pass === conf ? null : { noCoinciden: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmVisibility(): void {
    this.showConfirm = !this.showConfirm;
  }

  async onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.cargando = true;
    const { error } = await this.authService.actualizarPassword(this.password.value);
    this.cargando = false;

    if (error) {
      sweetAlert.alertError('No se pudo actualizar la contraseña. El enlace puede haber expirado.');
    } else {
      this.listo = true;
      await this.authService.logout();
      setTimeout(() => this.router.navigateByUrl('/auth/login'), 3000);
    }
  }
}
