# pickmi-admin

Panel de administración de la plataforma Pickmi. Permite gestionar propietarios, comercios, clientes, reseñas, planes, retos y configuraciones generales desde una interfaz unificada.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Angular 17+ (standalone components) |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Estilos | SCSS con CSS custom properties (`var(--pm-*)`) |
| Iconos | FontAwesome 6 Solid |
| Alertas | SweetAlert2 (wrapper en `src/app/data/utils/alerts.ts`) |
| Formularios | Angular Reactive Forms |

---

## Arquitectura

```
src/app/
├── core/
│   ├── guards/         # AuthGuard
│   └── services/       # Todos los servicios de datos
├── data/
│   ├── interfaces/     # Tipos TypeScript
│   ├── constants/      # Constantes globales (PlataformasPickmi, etc.)
│   └── utils/          # alerts.ts
├── layouts/
│   ├── dashboard/      # Layout principal con sidebar + navbar
│   └── clean/          # Layout sin chrome (preview)
├── modules/
│   ├── auth/           # Login
│   └── main/           # Todas las vistas autenticadas
└── shared/
    └── components/     # back-button, toggle-switch, product-detail-modal
```

### Layouts

- **DashboardComponent** — layout con sidebar y navbar. Todas las rutas autenticadas son hijos de este layout.
- **CleanComponent** — sin sidebar ni navbar. Usado por `/preview/stores/:id`.

---

## Rutas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | HomeComponent | Dashboard con métricas |
| `/owners-list` | OwnersListComponent | Listado de propietarios |
| `/owners/:id` | OwnersDetailsComponent | Detalle de propietario |
| `/stores-list` | StoresListComponent | Listado de comercios |
| `/users-list` | UsersListComponent | Clientes de la plataforma |
| `/reviews` | ReviewsComponent | Moderación de reseñas |
| `/reports` | ReportsComponent | Reportes y métricas |
| `/messages` | MessagesComponent | Mensajes internos |
| `/configurations` | ConfigurationsComponent | Hub de configuraciones |
| `/configurations/plans` | PlansComponent | Gestión de planes |
| `/configurations/retos` | RetosComponent | Gestión de retos/gamificación |
| `/configurations/retos/:id` | RetoDetailComponent | Ranking y progreso de usuarios en un reto |
| `/configurations/category` | CategoryComponent | Categorías y subcategorías |
| `/configurations/business-type` | BusinessTypeComponent | Tipos de negocio |
| `/configurations/promotions/list` | PromotionsListComponent | Promociones |
| `/configurations/maintenance` | MaintenanceComponent | Modo mantenimiento |
| `/configurations/slides/:target` | SlidesMaintenanceComponent | Carruseles (home / business) |
| `/preview/stores/:id` | PreviewComponent | Vista previa de un comercio |

---

## Módulos principales

### Propietarios
- **owners-list** — tabla con paginación (10/pág), tabs (Todos / En trial / Verificación), búsqueda.
- **owners-details** — perfil con header card, stats, card de plan y card de locales del propietario.

### Comercios
- **stores-list** — tabla con stats, filtro por tipo y estatus, acción de preview.
- **stores** — edición completa del comercio (usado desde la app de propietarios).
- **preview** — vista pública del comercio (layout limpio).

### Clientes
- **users-list** — tabla de usuarios con `tipo_usuario = 'cliente'`, búsqueda y filtro de estatus.

### Reseñas
- **reviews** — moderación con filtros (estatus, calificación, búsqueda), sort pills, toggle activo/inactivo, eliminación.

### Retos (Gamificación)
- **retos** — CRUD de retos con tres tipos:
  - `bienvenida` — se asignan al registrarse, sin fechas ni periodo.
  - `permanente` — recurrentes, tienen `periodo_dias` y `dia_reinicio` (0=Lunes … 6=Domingo) para sincronizar el reinicio de todos los usuarios el mismo día.
  - `evento` — programados, tienen `fecha_inicio` y `fecha_fin`.
- Acciones disponibles: `reseñas`, `favoritos`, `calificar`, `visitas`, `compartidos`.
- **reto-detail** — vista de detalle en `/configurations/retos/:id`. Muestra 4 stat cards (participantes, completados, en progreso, tasa), tabla de ranking ordenada por completado → fecha → progreso. Botón "Asignar a todos los clientes" visible solo cuando no hay participantes (fallback manual si el trigger no se ejecutó).

### Categorías
- **category** — layout master-detail en dos columnas: panel izquierdo lista categorías clicables con resaltado activo, panel derecho gestiona subcategorías de la categoría seleccionada. Formularios inline colapsables en ambos paneles.

### Planes
- **plans** — CRUD de planes de suscripción. Formulario colapsable con secciones: datos básicos, pricing, toggles (activo/default/trial default), límites (key-value dinámico) y features (key-bool dinámico). Cards en grid de 3 columnas, igual que retos.

### Configuraciones (catálogo)
- **business-type** — lista de tipos de negocio con formulario colapsable y filas clicables con toggle de estado.
- **promotions-list** — listado con 3 stat cards, filtros inline, tabla con thumbnail de imagen.
- **promotions** — formulario de nueva/editar promoción con upload de imagen (image-cropper) en columna izquierda y campos en grilla derecha.
- **slides-maintenance** — gestión de carruseles home/business. Upload 16:9 + campos a la derecha, lista de slides con thumbnail.
- **maintenance** — tarjeta única para activar/desactivar el modo mantenimiento del sitio. El icono y el badge cambian a ámbar cuando está activo.

### Mensajes
- **messages** — bandeja de mensajes internos con vista de detalle.

---

## Servicios (`src/app/core/services/`)

| Servicio | Responsabilidad |
|---|---|
| `AuthService` | Sesión Supabase, `getSupabaseClient()` |
| `LoaderService` | Loading global con `BehaviorSubject<boolean>` |
| `ProfileService` | Propietarios: listado, detalle, aprobar/rechazar plan |
| `StoresService` | Comercios: CRUD, categorías, subcategorías, logo |
| `ReviewsService` | Reseñas: listado paginado, estatus, eliminación |
| `PlansService` | Planes: listado y gestión |
| `RetosService` | Retos: CRUD, `obtenerProgresoReto` (ranking), `asignarRetoATodos` (fallback manual) |
| `CategoryService` | Categorías y subcategorías |
| `BusinessTypeService` | Tipos de negocio |
| `MessagesService` | Mensajes internos |
| `PromotionsService` | Promociones |
| `DashboardService` | Métricas del home |
| `PreviewService` | Datos de preview de comercio |
| `SlidesService` | Carruseles |
| `ConfigurationsService` | Configuraciones generales de la plataforma |

---

## Tablas Supabase relevantes

| Tabla | Descripción |
|---|---|
| `pick_usuarios` | Todos los usuarios (clientes, propietarios, admins) |
| `pick_propietarios` | Extensión de usuarios con datos de propietario y plan |
| `pick_comercios` | Comercios registrados |
| `pick_tipo_comercio` | Catálogo de tipos de negocio |
| `pick_categorias` | Categorías del catálogo |
| `pick_subcategorias` | Subcategorías vinculadas a categorías |
| `pick_comercio_categoria` | Relación N:M comercio ↔ categoría |
| `pick_comercio_subcategorias` | Relación N:M comercio ↔ subcategoría |
| `pick_reviews` | Reseñas de clientes sobre comercios |
| `pick_planes` | Definición de planes de suscripción |
| `pick_retos` | Retos de gamificación (`dia_reinicio int2` para permanentes) |
| `pick_retos_usuarios` | Progreso de usuarios en retos |
| `pick_compartidos` | Registro de veces que un usuario compartió un comercio |
| `pick_departamentos` | Catálogo de departamentos geográficos |
| `pick_municipios` | Catálogo de municipios |

---

## Sistema de diseño

### Variables CSS globales (`styles.scss`)
```css
--pm-text:        #1a1a28   /* texto principal */
--pm-text-muted:  #6c6c84   /* texto secundario */
--pm-accent:      oklch(0.58 0.13 285)  /* morado principal */
--pm-accent-soft: #ede9fe   /* fondo suave acento */
```

### Clases globales de utilidad
| Clase | Uso |
|---|---|
| `.page-wrapper` | Contenedor raíz de cada vista (padding, max-width) |
| `.page-header` | Bloque de título + subtítulo de página |
| `.pm-card` | Card blanca con borde y sombra suave |
| `.pm-table` | Tabla estilizada |
| `.pm-empty` | Estado vacío centrado con icono y texto |
| `.pm-avatar` / `.pm-avatar--sm` | Avatar circular con imagen o iniciales |
| `.pm-badge` / `.pm-badge--success` / `--neutral` | Badges de estatus |
| `.btn--primary` / `--ghost` / `--outline-danger` | Botones |
| `.btn--sm` | Modificador de tamaño pequeño |

### Componentes compartidos (`src/app/shared/components/`)
- **BackButtonComponent** — `<app-back-button label="..." link="...">`. Usado en todas las vistas de detalle.
- **ToggleSwitchComponent** — toggle controlado por `formControlName`, acepta prop `color`.
- **ProductDetailModalComponent** — modal de detalle de producto.

### Convención de prefijos BEM por componente
| Componente | Prefijo |
|---|---|
| owners-list | `ol__` |
| owners-details | `od__` |
| stores-list | `sl__` |
| users-list | `ul__` |
| reviews | `rv__` |
| reports | `rpt__` |
| messages | `msg__` |
| category | `cat__` |
| retos | `rt__` |
| reto-detail | `rd__` |
| plans | `pl__` |
| business-type | `bt__` |
| promotions-list | `prl__` |
| promotions (form) | `pr__` |
| slides-maintenance | `sm__` |
| maintenance | `mn__` |
| configurations | `cfg__` |

### Reglas de estilo importantes
- **`font-weight` de botones es 500** — el mixin `_btn-base` en `styles.scss` usa `font-weight: 500`. No subir a 600+ en ningún botón ni badge sobre fondos de color, genera bordes borrosos por síntesis de negrita.
- Los avatares usan un sistema de color determinista: `AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length]`.
- Las fechas en tablas usan fuente monoespaciada (`'SF Mono', 'Fira Code', monospace`).
- Los joins de Supabase con FK no declaradas en el schema se resuelven con queries paralelas + mapeo en memoria.
