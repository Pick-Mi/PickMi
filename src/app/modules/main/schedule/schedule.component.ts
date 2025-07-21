import { Component, OnInit } from '@angular/core';
import { PickHorarios } from '../../../data/interfaces/horarios';
import { ScheduleService } from '../../../core/services/schedule.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as sweetAlert from '../../../data/utils/alerts';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-schedule',
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent implements OnInit {
  comercioId!: string;
  nombreComercio = '';
  diasSemana: {
    dia_semana: number;
    nombre: string;
    hora_apertura: string | null;
    hora_cierre: string | null;
    cerrado: boolean;
  }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private horariosService: ScheduleService,
    private loaderService: LoaderService
  ) {}

  async ngOnInit() {
    this.loaderService.show();
    this.comercioId = this.route.snapshot.paramMap.get('id')!;
    this.nombreComercio = await this.horariosService.obtenerNombreComercio(this.comercioId);
    const existentes = await this.horariosService.obtenerHorarios(this.comercioId);

    if (existentes.length > 0) {
      this.diasSemana = existentes.map(h => ({
        dia_semana: h.dia_semana,
        nombre: this.getNombreDia(h.dia_semana),
        hora_apertura: h.hora_apertura,
        hora_cierre: h.hora_cierre,
        cerrado: h.cerrado,
      }));
    } else {
      this.diasSemana = Array.from({ length: 7 }, (_, i) => ({
        dia_semana: i,
        nombre: this.getNombreDia(i),
        hora_apertura: null,
        hora_cierre: null,
        cerrado: true,
      }));
    }
    this.loaderService.hide();
  }

  async guardar() {
  // Validación: no permitir horarios vacíos si el día no está cerrado
  for (const dia of this.diasSemana) {
    if (!dia.cerrado && (!dia.hora_apertura || !dia.hora_cierre)) {
      sweetAlert.alertError(`El día ${dia.nombre} debe tener hora de apertura y cierre o estar marcado como "Cerrado".`);
      return;
    }
  }

  const horarios: PickHorarios[] = this.diasSemana.map(d => ({
    comercio_id: this.comercioId,
    dia_semana: d.dia_semana,
    hora_apertura: d.cerrado ? null : d.hora_apertura,
    hora_cierre: d.cerrado ? null : d.hora_cierre,
    cerrado: d.cerrado,
  }));

  try {
    await this.horariosService.guardarHorarios(this.comercioId, horarios);
    sweetAlert.alertSuccess('Horarios guardados correctamente');
    this.router.navigate(['/schedule-list']);
  } catch (error) {
    console.error(error);
    sweetAlert.alertError('Ocurrió un error al guardar los horarios.');
  }
}


  private getNombreDia(index: number): string {
    return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][index];
  }

  onCancel() {
    this.router.navigate(['/schedule-list']);
  }
}
