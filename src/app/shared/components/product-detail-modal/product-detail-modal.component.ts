import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { PickProductos } from '../../../data/interfaces/productos';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './product-detail-modal.component.html',
  styleUrl: './product-detail-modal.component.scss'
})
export class ProductDetailModalComponent {
  @Input() product: PickProductos | null = null;
  @Input() visible = false;
  @Input() hasPrev = false;
  @Input() hasNext = false;
  @Output() closed = new EventEmitter<void>();
  @Output() prevClicked = new EventEmitter<void>();
  @Output() nextClicked = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.visible) this.closed.emit();
  }

  onClose(): void {
    this.closed.emit();
  }

  get hasPromotion(): boolean {
    return !!(this.product?.en_promocion && this.product?.valor_promocion);
  }

  get promoLabel(): string {
    if (!this.hasPromotion || !this.product) return '';
    if (this.product.tipo_promocion === 'porcentaje') return `-${this.product.valor_promocion}%`;
    if (this.product.tipo_promocion === 'cantidad') return `-$${this.product.valor_promocion}`;
    return '';
  }

  get displayPrice(): number | null {
    if (!this.product) return null;
    if (!this.hasPromotion) return this.product.precio;
    if (this.product.tipo_promocion === 'porcentaje') {
      return this.product.precio - (this.product.precio * this.product.valor_promocion / 100);
    }
    if (this.product.tipo_promocion === 'cantidad') {
      return this.product.precio - this.product.valor_promocion;
    }
    return this.product.precio;
  }
}
