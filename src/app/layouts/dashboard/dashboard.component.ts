import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { GlobalLoaderComponent } from "../../shared/components/global-loader/global-loader.component";

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [NavbarComponent, SidebarComponent, RouterModule, GlobalLoaderComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
    
}
