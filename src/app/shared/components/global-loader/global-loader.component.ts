import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
    selector: 'app-global-loader',
    standalone: true,
    imports: [CommonModule, NgIf],
    templateUrl: './global-loader.component.html',
    styleUrl: './global-loader.component.scss'
})
export class GlobalLoaderComponent {
  constructor(public loaderService: LoaderService) {}
}
