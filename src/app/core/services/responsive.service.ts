import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResponsiveService {
  private mobileSubject = new BehaviorSubject<boolean>(window.innerWidth < 768);
  isMobile$ = this.mobileSubject.asObservable();

  constructor(private ngZone: NgZone) {
    this.checkScreenSize();

    fromEvent(window, 'resize').subscribe(() => {
      this.ngZone.run(() => this.checkScreenSize());
    });
  }

  private checkScreenSize(): void {
    const isMobile = window.innerWidth < 768;
    this.mobileSubject.next(isMobile);
  }
}
