import { Routes } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component';
import { EmptyComponent } from '../../layouts/empty/empty.component';
import { ProfileComponent } from '../main/profile/profile.component';
import { CleanComponent } from '../../layouts/clean/clean.component';

export const authRoutes: Routes = [
  {
    path: '',
    component: EmptyComponent,
    children: [
      { path: 'login', component: LoginComponent }
    ]
  }
];

