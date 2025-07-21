import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { DashboardComponent } from '../../layouts/dashboard/dashboard.component';
import { CleanComponent } from '../../layouts/clean/clean.component';
import { HomeComponent } from './home/home.component';
import { MenusComponent } from './menus/menus.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { PreviewComponent } from './preview/preview.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { StoresComponent } from './stores/stores.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { StoresListComponent } from './stores-list/stores-list.component';
import { ScheduleListComponent } from './schedule-list/schedule-list.component';
import { ReviewsListComponent } from './reviews-list/reviews-list.component';
import { GalleryComponent } from './gallery/gallery.component';
import { GalleryListComponent } from './gallery-list/gallery-list.component';
import { MenusListComponent } from './menus-list/menus-list.component';

export const mainRoutes: Routes = [
  { path: '', 
    component: DashboardComponent,
    canActivateChild: [AuthGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'stores/:id', component: StoresComponent },
      { path: 'stores-list', component: StoresListComponent },
      { path: 'menus/:id', component: MenusComponent },
      { path: 'menus-list', component: MenusListComponent },
      { path: 'schedule/:id', component: ScheduleComponent },
      { path: 'schedule-list', component: ScheduleListComponent },
      { path: 'reviews/:id', component: ReviewsComponent },
      { path: 'reviews-list', component: ReviewsListComponent },
      { path: 'gallery/:id', component: GalleryComponent },
      { path: 'gallery-list', component: GalleryListComponent },
    ] 
  },
  {
    path: 'preview',
    component: CleanComponent,
    children: [
      { path: 'stores/:id', component: PreviewComponent }
    ]
  }
];
