import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { StoresService } from '../../../core/services/stores.service';
import { Router, RouterModule } from '@angular/router';
import { PickComercio } from '../../../data/interfaces/comercios';
import { AuthService } from '../../../core/services/auth.service';
import { ResponsiveService } from '../../../core/services/responsive.service';
import { PickUsuario } from '../../../data/interfaces/usuarios';
import Swal from 'sweetalert2';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-stores-list',
  standalone: true,
  imports: [CommonModule, NgxDatatableModule, RouterModule],
  templateUrl: './stores-list.component.html',
})
export class StoresListComponent implements OnInit {
  rows: PickComercio[] = [];
  usuario!: PickUsuario | null;
  loading = true;
  isMobile = false;

  constructor(private storesService: StoresService, 
              private authService: AuthService, 
              private router: Router, 
              private loaderService: LoaderService,
              private responsiveService: ResponsiveService) {}

  async ngOnInit(): Promise<void> {

    this.responsiveService.isMobile$.subscribe(value => {
      this.isMobile = value;
    });

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

  onCreate() {
    this.router.navigate(['/stores/0']);
  }

  onEdit(store: PickComercio) {
    this.router.navigate(['/stores/', store.id]);
  }

  onPreview(store: PickComercio) {
    this.router.navigate(['/preview/stores/', store.id]);
  }

  onDelete(store: PickComercio) {
    if (store.id === undefined) {
      return;
    }
    Swal.fire('Seguro que desea eliminar este comercio?')
      .then(async (result) => {
        if (result.isConfirmed) {
          const { error } = await this.storesService.eliminarComercio(store.id!);
          if (error) {
            Swal.fire('Error al eliminar el registro');
          } else {
            Swal.fire('Registro eliminado correctamente');
            if (!this.usuario) {
              return;
            }
            this.getComercios(this.usuario.id!);
          }
        }
      });
  }
     
}
