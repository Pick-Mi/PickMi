import { NgIf, CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PickUsuario } from '../../../data/interfaces/usuarios';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  styleUrls: ['./sidebar.component.scss'],
  standalone: true
})
export class SidebarComponent implements OnInit, OnDestroy {
  usuario: PickUsuario | null = null;
  private sub!: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get avatar(): string {
    if (this.usuario?.avatar_url) {
      return this.usuario.avatar_url;
    }
    return 'assets/img/usuario.png';
  }

  isStoresActive(): boolean {
    return this.router.url.startsWith('/stores');
  }

  isScheduleActive(): boolean {
    return this.router.url.startsWith('/schedule');
  }

  isReviewsActive(): boolean {
    return this.router.url.startsWith('/reviews');
  }

  isMenusActive(): boolean {
    return this.router.url.startsWith('/menus');
  }

  isGalleryActive(): boolean {
    return this.router.url.startsWith('/gallery');
  }

  isMessagesActive(): boolean {
    return this.router.url.startsWith('/messages');
  }
}
