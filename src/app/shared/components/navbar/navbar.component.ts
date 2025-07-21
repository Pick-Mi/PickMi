import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    imports: [RouterLink, CommonModule],
    standalone: true
})
export class NavbarComponent {

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    menuAbierto = false;

    toggleMenu() {
        this.menuAbierto = !this.menuAbierto;
    }

    async logout() {
        await this.authService.logout();
        this.router.navigate(['/auth/login']);
    }

}
