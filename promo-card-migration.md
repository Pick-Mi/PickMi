# Migración: PromoCardComponent → Sitio principal

Guía para integrar el componente `PromoCardComponent` en el sitio público de Pickmi.

---

## Archivos a copiar

| Origen (pickmi-admin) | Destino (sitio principal) |
|---|---|
| `src/app/shared/components/promo-card/promo-card.component.ts` | `src/app/shared/components/promo-card/promo-card.component.ts` |
| `src/app/shared/components/promo-card/promo-card.component.html` | `src/app/shared/components/promo-card/promo-card.component.html` |
| `src/app/shared/components/promo-card/promo-card.component.scss` | `src/app/shared/components/promo-card/promo-card.component.scss` |
| `src/app/data/interfaces/promotions.ts` | `src/app/data/interfaces/promotions.ts` (fusionar si ya existe) |

---

## Interfaz requerida

```typescript
export type TipoPromocion = 'descuento' | 'regalo' | '2x1' | 'bundle';

export interface PickPromocion {
  id?: string;
  comercio_id: string;
  titulo: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  precio_original: number;
  precio_promocion: number;
  porcentaje_descuento?: number | null;
  codigo_promocion?: string | null;
  estatus?: string | null;
  tipo_promocion?: TipoPromocion | null;
  item_regalo?: string | null;
}
```

---

## Uso básico

```html
<app-promo-card
  [promo]="promocion"
  [comercioNombre]="'Nombre del comercio'">
</app-promo-card>
```

| Input | Tipo | Descripción |
|---|---|---|
| `promo` | `PickPromocion` | Objeto de la promoción (requerido) |
| `comercioNombre` | `string` | Nombre del comercio a mostrar (requerido) |

---

## Integración con ngx-owl-carousel-o

```html
<owl-carousel-o [options]="carouselOptions">
  <ng-container *ngFor="let promo of promociones">
    <ng-template carouselSlide>
      <app-promo-card
        [promo]="promo"
        [comercioNombre]="getNombreComercio(promo.comercio_id)">
      </app-promo-card>
    </ng-template>
  </ng-container>
</owl-carousel-o>
```

```typescript
import { PromoCardComponent } from '../shared/components/promo-card/promo-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, CarouselModule, PromoCardComponent],
  ...
})
```

---

## Diseño del card

### Dimensiones
- **Alto fijo**: `220px`
- **Imagen**: `220px` ancho × `220px` alto (cuadrada), pegada al borde derecho sin gaps
- **Padding**: `1.25rem 1.5rem`
- `object-fit: cover` garantiza que la imagen siempre llene su contenedor sin deformarse

### Sin imagen
Muestra un ícono decorativo semitransparente en el fondo. No requiere manejo especial.

### Distribución del contenido
`justify-content: space-between` distribuye:
- **Arriba**: tipo pill + nombre del comercio, título, descripción, precio
- **Abajo**: código con botón copiar, contador de expiración

---

## Comportamiento

### Colores por tipo
| Tipo | Gradiente |
|---|---|
| `descuento` | Coral rojo `#d96b64 → #b84b45` |
| `regalo` | Morado `#8577d4 → #6555bc` |
| `2x1` | Teal `#3aaa9c → #27877a` |
| `bundle` | Ámbar `#e09455 → #c07030` |
| `null` / sin tipo | Azul `#6880b8 → #4a62a0` |

### Precio por tipo
| Tipo | Muestra |
|---|---|
| `descuento` | Precio promo + original tachado |
| `bundle` | Precio promo + original tachado |
| `regalo` | Precio original + artículo de regalo |
| `2x1` | Precio original + badge "2×1" |

### Contador de expiración
`setInterval` de 1 segundo iniciado en `ngOnInit`, cancelado en `ngOnDestroy`. Formato: `Xd Xh Xm Xs`. Al expirar muestra "Expirada" y detiene el contador.

### Código de promoción
Botón solo con ícono (`fa-copy` → `fa-check` por 2 segundos). Usa `navigator.clipboard.writeText()`. **Requiere HTTPS en producción.**

---

## SQL requerido

```sql
ALTER TABLE public.pick_promociones
ADD COLUMN IF NOT EXISTS tipo_promocion varchar(30) DEFAULT 'descuento';

ALTER TABLE public.pick_promociones
ADD COLUMN IF NOT EXISTS item_regalo text NULL;
```

---

## Compatibilidad con promociones existentes

Las promociones sin `tipo_promocion` (`null`) usan el color azul por defecto. No es necesario migrar datos existentes.

---

## Responsividad

| Ancho | Comportamiento |
|---|---|
| > 480px | Card 220px alto, imagen 220×220px cuadrada |
| ≤ 480px | Imagen reducida a 140px ancho |
| ≤ 360px | Imagen oculta, contenido a ancho completo |
