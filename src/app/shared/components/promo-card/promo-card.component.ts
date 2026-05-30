import { Component, Input, OnChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PickPromocion } from '../../../data/interfaces/promotions';

const TIPO_THEMES: Record<string, { gradient: string; icon: string }> = {
  descuento: { gradient: 'linear-gradient(135deg,#d96b64 0%,#b84b45 100%)', icon: 'fa-tag' },
  regalo:    { gradient: 'linear-gradient(135deg,#8577d4 0%,#6555bc 100%)', icon: 'fa-gift' },
  '2x1':     { gradient: 'linear-gradient(135deg,#3aaa9c 0%,#27877a 100%)', icon: 'fa-certificate' },
  bundle:    { gradient: 'linear-gradient(135deg,#e09455 0%,#c07030 100%)', icon: 'fa-boxes-stacked' },
  default:   { gradient: 'linear-gradient(135deg,#6880b8 0%,#4a62a0 100%)', icon: 'fa-ticket' },
};

@Component({
  selector: 'app-promo-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promo-card.component.html',
  styleUrls: ['./promo-card.component.scss']
})
export class PromoCardComponent implements OnChanges, OnInit, OnDestroy {
  @Input() promo!: PickPromocion;
  @Input() comercioNombre = '';

  theme = TIPO_THEMES['default'];
  countdownText = '';
  isExpired = false;
  codeCopied = false;

  private intervalId?: ReturnType<typeof setInterval>;

  ngOnChanges(): void {
    const tipo = this.promo?.tipo_promocion ?? 'default';
    this.theme = TIPO_THEMES[tipo] ?? TIPO_THEMES['default'];
    this.updateCountdown();
  }

  ngOnInit(): void {
    this.updateCountdown();
    this.intervalId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private updateCountdown(): void {
    if (!this.promo?.fecha_fin) { this.countdownText = '—'; return; }
    const diff = new Date(this.promo.fecha_fin).getTime() - Date.now();
    if (diff <= 0) {
      this.isExpired = true;
      this.countdownText = 'Expirada';
      if (this.intervalId) clearInterval(this.intervalId);
      return;
    }
    this.isExpired = false;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    this.countdownText = `${d}d ${h}h ${m}m ${s}s`;
  }

  async copyCode(): Promise<void> {
    if (!this.promo?.codigo_promocion) return;
    try {
      await navigator.clipboard.writeText(this.promo.codigo_promocion);
      this.codeCopied = true;
      setTimeout(() => (this.codeCopied = false), 2000);
    } catch { /* no clipboard access */ }
  }

  get tipoLabel(): string {
    const map: Record<string, string> = {
      descuento: 'Descuento', regalo: 'Regalo', '2x1': '2×1', bundle: 'Bundle'
    };
    return map[this.promo?.tipo_promocion ?? ''] ?? 'Promoción';
  }

  get showPrecioPromo(): boolean {
    const t = this.promo?.tipo_promocion;
    return t === 'descuento' || t === 'bundle';
  }
}
