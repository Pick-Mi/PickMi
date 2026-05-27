import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigurationsService } from '../../../core/services/configurations.service';
import { PickConfiguracionGlobal } from '../../../data/interfaces/configurations';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { ToggleSwitchComponent } from '../../../shared/components/toggle-switch/toggle-switch.component';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, ToggleSwitchComponent],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit {
  mantenimientoConfig?: PickConfiguracionGlobal;
  loading = false;
  saving = false;

  constructor(private configurationsService: ConfigurationsService) {}

  async ngOnInit() {
    await this.cargarConfiguracion();
  }

  async cargarConfiguracion() {
    this.loading = true;
    try {
      this.mantenimientoConfig = (await this.configurationsService.obtenerConfiguracionPorParametro('MANTENIMIENTO')) ?? undefined;
    } finally {
      this.loading = false;
    }
  }

  async toggleMantenimiento() {
    if (!this.mantenimientoConfig?.id) {
      return;
    }

    this.saving = true;
    try {
      const nuevoEstado = !this.mantenimientoConfig.activo;
      await this.configurationsService.actualizarConfiguracion(this.mantenimientoConfig.id, {
        activo: nuevoEstado
      });
      this.mantenimientoConfig = {
        ...this.mantenimientoConfig,
        activo: nuevoEstado
      };
    } finally {
      this.saving = false;
    }
  }
}
