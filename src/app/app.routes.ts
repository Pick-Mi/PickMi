import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadChildren: () => import('./modules/main/main.routes').then(m => m.mainRoutes) },
    { path: 'auth', loadChildren: () => import('./modules/auth/auth.routes').then(m => m.authRoutes) },
    { path: '**', redirectTo: '', pathMatch: 'full' }
];
