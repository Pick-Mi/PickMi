import { Routes } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component';
import { EmptyComponent } from '../../layouts/empty/empty.component';
import { ProfileComponent } from '../main/profile/profile.component';
import { CleanComponent } from '../../layouts/clean/clean.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const authRoutes: Routes = [
  {
    path: '',
    component: EmptyComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent }
    ]
  }
];

