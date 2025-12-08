import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { PropietarioDetalle } from '../../../data/interfaces/usuarios';

@Component({
  selector: 'app-owners-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './owners-details.component.html',
  styleUrl: './owners-details.component.scss'
})
export class OwnersDetailsComponent implements OnInit {
  propietario: PropietarioDetalle | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService
  ) {}

  async ngOnInit(): Promise<void> {
    const propietarioId = this.route.snapshot.paramMap.get('id');
    if (!propietarioId) {
      this.error = 'Propietario no encontrado';
      return;
    }
    await this.cargarPropietario(propietarioId);
  }

  async cargarPropietario(propietarioId: string): Promise<void> {
    this.loading = true;
    this.error = null;
    const { data, error } = await this.profileService.obtenerDetallePropietario(propietarioId);
    if (error || !data) {
      this.error = error ?? 'No se pudo cargar el propietario';
      this.propietario = null;
    } else {
      this.propietario = data;
    }
    this.loading = false;
  }

  regresar(): void {
    this.router.navigate(['/owners-list']);
  }
}
