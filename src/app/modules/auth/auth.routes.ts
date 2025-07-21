import { Routes } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component';
import { RegisterComponent } from '../auth/register/register.component';
import { EmptyComponent } from '../../layouts/empty/empty.component';
import { ProfileComponent } from '../main/profile/profile.component';
import { CleanComponent } from '../../layouts/clean/clean.component';

export const authRoutes: Routes = [
  {
    path: '',
    component: EmptyComponent,
    children: [
      { path: 'register', component: RegisterComponent },
      { path: 'login', component: LoginComponent }
    ]
  },
  {
    path: 'complete',
    component: CleanComponent,
    children: [
      { path: '', component: ProfileComponent }
    ]
  }
];

