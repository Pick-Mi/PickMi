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
import { GalleryComponent } from './gallery/gallery.component';
import { GalleryListComponent } from './gallery-list/gallery-list.component';
import { MenusListComponent } from './menus-list/menus-list.component';
import { ConfigurationsComponent } from './configurations/configurations.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { SlidesMaintenanceComponent } from './slides-maintenance/slides-maintenance.component';
import { BusinessTypeComponent } from './business-type/business-type.component';
import { CategoryComponent } from './category/category.component';
import { UsersListComponent } from './users-list/users-list.component';
import { OwnersListComponent } from './owners-list/owners-list.component';
import { ReportsComponent } from './reports/reports.component';

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
      { path: 'users-list', component: UsersListComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'owners-list', component: OwnersListComponent },
      { path: 'schedule/:id', component: ScheduleComponent },
      { path: 'schedule-list', component: ScheduleListComponent },
      { path: 'reviews', component: ReviewsComponent },
      { path: 'gallery/:id', component: GalleryComponent },
      { path: 'gallery-list', component: GalleryListComponent },
      { path: 'configurations', component: ConfigurationsComponent },
      { path: 'configurations/maintenance', component: MaintenanceComponent },
      { path: 'configurations/slides/:target', component: SlidesMaintenanceComponent },
      { path: 'configurations/business-type', component: BusinessTypeComponent },
      { path: 'configurations/category', component: CategoryComponent },
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
