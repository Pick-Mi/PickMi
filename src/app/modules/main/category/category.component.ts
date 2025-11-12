import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { BusinessTypeService } from '../../../core/services/business-type.service';
import { PickCategoria, PickSubcategoria } from '../../../data/interfaces/categories';
import { BusinessType } from '../../../data/interfaces/business-type';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import * as sweetAlert from '../../../data/utils/alerts';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  categoryForm: FormGroup;
  subcategoryForm: FormGroup;

  businessTypes: BusinessType[] = [];
  categories: PickCategoria[] = [];
  subcategories: PickSubcategoria[] = [];

  loadingCategories = false;
  loadingSubcategories = false;
  savingCategory = false;
  savingSubcategory = false;

  editingCategoryId: number | null = null;
  editingSubcategoryId: number | null = null;
  selectedCategoryId: number | null = null;
  categoryPage = 1;
  readonly categoriesPerPage = 5;

  iconOptions = [
    'fa-mug-hot',
    'fa-apple-alt',
    'fa-hamburger',
    'fa-gift',
    'fa-spa',
    'fa-cookie-bite',
    'fa-paint-roller',
    'fa-tshirt',
    'fa-gem',
    'fa-dog',
    'fa-microchip',
    'fa-gamepad',
    'fa-person-hiking',
    'fa-champagne-glasses',
    'fa-spray-can-sparkles',
    'fa-seedling',
    'fa-shrimp',
    'fa-bowl-rice',
    'fa-earth-americas'
  ];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private businessTypeService: BusinessTypeService
  ) {
    this.categoryForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      tipo_comercio_id: [null, Validators.required],
      icono: [this.iconOptions[0], Validators.required]
    });

    this.subcategoryForm = this.fb.group({
      nombre: ['', Validators.required],
      estado: [true]
    });
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.cargarBusinessTypes(), this.cargarCategorias()]);
  }

  private async cargarBusinessTypes(): Promise<void> {
    try {
      this.businessTypes = await this.businessTypeService.obtenerTipos();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudieron cargar los tipos de negocio.');
    }
  }

  async cargarCategorias(): Promise<void> {
    this.loadingCategories = true;
    try {
      this.categories = await this.categoryService.obtenerCategorias();
      const totalPages = this.totalCategoryPages;
      if (this.categoryPage > totalPages) {
        this.categoryPage = totalPages;
      }
      if (this.categories.length) {
        const currentSelection = this.categories.find(c => c.id === this.selectedCategoryId);
        const firstVisible = this.paginatedCategories[0];
        const nextSelection = currentSelection ?? firstVisible;
        if (nextSelection) {
          await this.seleccionarCategoria(nextSelection.id!);
        }
      } else {
        this.selectedCategoryId = null;
        this.subcategories = [];
      }
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudieron cargar las categorías.');
    } finally {
      this.loadingCategories = false;
    }
  }

  async seleccionarCategoria(categoriaId: number | null): Promise<void> {
    this.selectedCategoryId = categoriaId;
    if (!categoriaId) {
      this.subcategories = [];
      return;
    }
    this.loadingSubcategories = true;
    try {
      this.subcategories = await this.categoryService.obtenerSubcategoriasPorCategoria(categoriaId);
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudieron cargar las subcategorías.');
    } finally {
      this.loadingSubcategories = false;
    }
  }

  editarCategoria(cat: PickCategoria): void {
    this.editingCategoryId = cat.id ?? null;
    this.categoryForm.setValue({
      nombre: cat.nombre,
      tipo_comercio_id: cat.tipo_comercio_id ?? null,
      icono: cat.icono || this.iconOptions[0]
    });
  }

  getBusinessTypeName(typeId?: number | null): string {
    if (!typeId) return '—';
    const tipo = this.businessTypes.find(t => t.id === typeId);
    return tipo?.nombre ?? '—';
  }

  cancelarCategoria(): void {
    this.editingCategoryId = null;
    this.categoryForm.reset({
      nombre: '',
      tipo_comercio_id: null,
      icono: this.iconOptions[0]
    });
  }

  async guardarCategoria(): Promise<void> {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    this.savingCategory = true;
    try {
      if (this.editingCategoryId) {
        await this.categoryService.actualizarCategoria(this.editingCategoryId, this.categoryForm.value);
        sweetAlert.alertSuccess('Categoría actualizada');
      } else {
        await this.categoryService.crearCategoria(this.categoryForm.value);
        sweetAlert.alertSuccess('Categoría creada');
      }
      await this.cargarCategorias();
      this.cancelarCategoria();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo guardar la categoría.');
    } finally {
      this.savingCategory = false;
    }
  }

  async eliminarCategoria(cat: PickCategoria): Promise<void> {
    if (!cat.id) return;
    const confirmed = confirm(`¿Eliminar la categoría "${cat.nombre}"?`);
    if (!confirmed) return;
    try {
      await this.categoryService.eliminarCategoria(cat.id);
      sweetAlert.alertSuccess('Categoría eliminada');
      if (this.selectedCategoryId === cat.id) {
        this.selectedCategoryId = null;
        this.subcategories = [];
      }
      await this.cargarCategorias();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo eliminar la categoría.');
    }
  }

  editarSubcategoria(sub: PickSubcategoria): void {
    this.editingSubcategoryId = sub.id ?? null;
    this.subcategoryForm.setValue({
      nombre: sub.nombre,
      estado: sub.estado ?? true
    });
  }

  cancelarSubcategoria(): void {
    this.editingSubcategoryId = null;
    this.subcategoryForm.reset({
      nombre: '',
      estado: true
    });
  }

  async guardarSubcategoria(): Promise<void> {
    if (!this.selectedCategoryId) {
      sweetAlert.alertWarning('Selecciona una categoría primero.');
      return;
    }
    if (this.subcategoryForm.invalid) {
      this.subcategoryForm.markAllAsTouched();
      return;
    }
    this.savingSubcategory = true;
    try {
      const payload = {
        categoria_id: this.selectedCategoryId,
        nombre: this.subcategoryForm.value.nombre,
        estado: this.subcategoryForm.value.estado
      };
      if (this.editingSubcategoryId) {
        await this.categoryService.actualizarSubcategoria(this.editingSubcategoryId, payload);
        sweetAlert.alertSuccess('Subcategoría actualizada');
      } else {
        await this.categoryService.crearSubcategoria(payload);
        sweetAlert.alertSuccess('Subcategoría creada');
      }
      await this.seleccionarCategoria(this.selectedCategoryId);
      this.cancelarSubcategoria();
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo guardar la subcategoría.');
    } finally {
      this.savingSubcategory = false;
    }
  }

  async eliminarSubcategoria(sub: PickSubcategoria): Promise<void> {
    if (!sub.id) return;
    const confirmed = confirm(`¿Eliminar la subcategoría "${sub.nombre}"?`);
    if (!confirmed || !this.selectedCategoryId) return;

    try {
      await this.categoryService.eliminarSubcategoria(sub.id);
      sweetAlert.alertSuccess('Subcategoría eliminada');
      await this.seleccionarCategoria(this.selectedCategoryId);
    } catch (error) {
      console.error(error);
      sweetAlert.alertError('No se pudo eliminar la subcategoría.');
    }
  }

  cambiarPaginaCategorias(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalCategoryPages) return;
    this.categoryPage = nuevaPagina;
    const firstVisible = this.paginatedCategories[0];
    if (firstVisible) {
      this.seleccionarCategoria(firstVisible.id || null);
    }
  }

  get paginatedCategories(): PickCategoria[] {
    const start = (this.categoryPage - 1) * this.categoriesPerPage;
    return this.categories.slice(start, start + this.categoriesPerPage);
  }

  get totalCategoryPages(): number {
    return Math.max(1, Math.ceil(this.categories.length / this.categoriesPerPage) || 1);
  }

  getSelectedCategoryName(): string {
    if (!this.selectedCategoryId) {
      return '';
    }
    const cat = this.categories.find(c => c.id === this.selectedCategoryId);
    return cat?.nombre ?? '';
  }
}
