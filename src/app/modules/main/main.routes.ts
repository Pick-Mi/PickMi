import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { DashboardComponent } from '../../layouts/dashboard/dashboard.component';
import { CleanComponent } from '../../layouts/clean/clean.component';
import { HomeComponent } from './home/home.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { PreviewComponent } from './preview/preview.component';
import { StoresComponent } from './stores/stores.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { StoresListComponent } from './stores-list/stores-list.component';
import { ConfigurationsComponent } from './configurations/configurations.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { SlidesMaintenanceComponent } from './slides-maintenance/slides-maintenance.component';
import { BusinessTypeComponent } from './business-type/business-type.component';
import { CategoryComponent } from './category/category.component';
import { UsersListComponent } from './users-list/users-list.component';
import { OwnersListComponent } from './owners-list/owners-list.component';
import { ReportsComponent } from './reports/reports.component';
import { PromotionsComponent } from './promotions/promotions.component';
import { PromotionsListComponent } from './promotions-list/promotions-list.component';
import { OwnersDetailsComponent } from './owners-details/owners-details.component';
import { PlansComponent } from './plans/plans.component';
import { MessagesComponent } from './messages/messages.component';

export const mainRoutes: Routes = [
  { path: '', 
    component: DashboardComponent,
    canActivateChild: [AuthGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'stores/:id', component: StoresComponent },
      { path: 'stores-list', component: StoresListComponent },
      { path: 'users-list', component: UsersListComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'owners-list', component: OwnersListComponent },
      { path: 'owners/:id', component: OwnersDetailsComponent },
      { path: 'reviews', component: ReviewsComponent },
      { path: 'configurations', component: ConfigurationsComponent },
      { path: 'configurations/maintenance', component: MaintenanceComponent },
      { path: 'configurations/slides/:target', component: SlidesMaintenanceComponent },
      { path: 'configurations/business-type', component: BusinessTypeComponent },
      { path: 'configurations/plans', component: PlansComponent },
      { path: 'configurations/category', component: CategoryComponent },
      { path: 'configurations/promotions', component: PromotionsComponent },
      { path: 'configurations/promotions/list', component: PromotionsListComponent },
      { path: 'messages', component: MessagesComponent },
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
