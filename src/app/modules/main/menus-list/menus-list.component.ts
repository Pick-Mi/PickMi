import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoaderService } from '../../../core/services/loader.service';
import { StoresService } from '../../../core/services/stores.service';
import { PickComercio } from '../../../data/interfaces/comercios';
import { PickUsuario } from '../../../data/interfaces/usuarios';
import { CommonModule } from '@angular/common';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-menus-list',
  imports: [CommonModule, NgxDatatableModule, RouterModule],
  templateUrl: './menus-list.component.html',
  styleUrl: './menus-list.component.scss'
})
export class MenusListComponent implements OnInit {
  rows: PickComercio[] = [];
  usuario!: PickUsuario | null;
  loading = true;

  constructor(private storesService: StoresService, private authService: AuthService, private router: Router, private loaderService: LoaderService,) {}

  async ngOnInit(): Promise<void> {
    this.usuario = this.authService.currentUsuario;

    if (!this.usuario) {
      return;
    }

    this.loaderService.show();
    await this.getComercios(this.usuario.id!);
    this.loading = false;
    this.loaderService.hide();
  }

  async getComercios(id: string) {
    const { comercios, error } = await this.storesService.obtenerComerciosPorUsuario(id);
    if (!error && comercios) {
      this.rows = comercios;
    }    
  }

  onEdit(store: PickComercio) {
    this.router.navigate(['/menus/', store.id]);
  }
}
