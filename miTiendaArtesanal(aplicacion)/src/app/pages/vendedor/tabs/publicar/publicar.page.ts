// ============================================================
// PUBLICAR PRODUCTO (Vendedor)
// ------------------------------------------------------------
// Formulario que permite al vendedor crear un producto nuevo:
//   - Categoría (dropdown).
//   - Nombre, descripción, precio y stock.
//   - Foto del producto (cámara o galería del dispositivo).
//
// Al enviar, llama a ProductService.create() y el producto
// queda visible para TODOS los compradores en su catálogo.
//
// La foto NO se guarda en el array global del PhotoService
// (esa era para la galería personal). Se guarda el filepath
// dentro del producto como imageUrl.
// ============================================================

import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// Componentes de Ionic que usa la vista.
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon,
  IonList, IonListHeader, IonItem, IonLabel,
  IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonNote, IonToast, IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  logOutOutline, camera, images, checkmarkCircle,
} from 'ionicons/icons';

// Servicios y modelos.
import type { UserPhoto } from '../../../../models/photo.model';
import type { Product } from '../../../../models/product.model';
import type { User } from '../../../../models/user.model';
import { AuthService } from '../../../../services/auth.service';
import { PhotoService } from '../../../../services/photo.service';
import { ProductService } from '../../../../services/product.service';


@Component({
  selector: 'app-publicar',
  templateUrl: 'publicar.page.html',
  styleUrls: ['publicar.page.scss'],
  standalone: true,
  imports: [
    FormsModule,   // habilita [(ngModel)] en los inputs
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon,
    IonList, IonListHeader, IonItem, IonLabel,
    IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonNote, IonToast, IonSpinner,
  ],
})
export class PublicarPage {

  // ----------------------------------------------------------
  // DEPENDENCIAS
  // ----------------------------------------------------------
  private authService = inject(AuthService);
  private photoService = inject(PhotoService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // ----------------------------------------------------------
  // ESTADO DEL FORMULARIO
  // ----------------------------------------------------------
  // Todos los campos están enlazados a los inputs del HTML
  // mediante [(ngModel)]. Cuando el usuario escribe, estas
  // propiedades se actualizan automáticamente.

  category: Product['category'] = 'artesanía';
  name = '';
  description = '';
  price: number | null = null;
  stock: number | null = null;

  // Foto del producto (null si aún no se ha tomado).
  photo: UserPhoto | null = null;

  // ----------------------------------------------------------
  // ESTADOS DE UI
  // ----------------------------------------------------------
  loading = false;               // spinner mientras se publica
  toastOpen = false;
  toastMessage = '';
  toastColor: 'success' | 'danger' = 'success';

  // ----------------------------------------------------------
  // DATOS AUXILIARES
  // ----------------------------------------------------------
  // Categorías disponibles para el dropdown.
  // Deben coincidir con el tipo del modelo Product.
  categories: Product['category'][] = [
    'joyería',
    'textil',
    'artesanía',
    'alimentos',
    'cuidado personal',
  ];

  // Usuario vendedor actual (para asociar el producto a su email).
  private currentUser: User | null = null;

  constructor() {
    // Registramos los íconos que usa el HTML.
    addIcons({ logOutOutline, camera, images, checkmarkCircle });
  }

  /**
   * ionViewWillEnter se ejecuta CADA VEZ que el usuario entra
   * a la pestaña (no solo la primera). Es el lugar correcto
   * para recargar el usuario actual.
   */
  async ionViewWillEnter(): Promise<void> {
    this.currentUser = await this.authService.getUser();
    this.cdr.detectChanges();
  }

  // ----------------------------------------------------------
  // ACCIÓN: tomar foto con la cámara
  // ----------------------------------------------------------
  async takePhotoFromCamera(): Promise<void> {
    try {
      // captureForProduct('camera') abre la cámara, guarda el
      // archivo y devuelve el UserPhoto con filepath + webviewPath.
      this.photo = await this.photoService.captureForProduct('camera');
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error al capturar foto', e);
      this.showToast('No se pudo capturar la foto', 'danger');
    }
  }

  // ----------------------------------------------------------
  // ACCIÓN: elegir foto de la galería
  // ----------------------------------------------------------
  async takePhotoFromGallery(): Promise<void> {
    try {
      this.photo = await this.photoService.captureForProduct('gallery');
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error al elegir foto', e);
      this.showToast('No se pudo abrir la galería', 'danger');
    }
  }

  // ----------------------------------------------------------
  // ACCIÓN: publicar producto
  // ----------------------------------------------------------
  // Valida los campos, llama a ProductService.create() y
  // limpia el formulario.
  async onSubmit(): Promise<void> {
    // ── Validaciones ──
    if (!this.name.trim() || this.name.trim().length < 3) {
      this.showToast('El nombre debe tener al menos 3 caracteres', 'danger');
      return;
    }
    if (!this.description.trim() || this.description.trim().length < 10) {
      this.showToast('La descripción debe tener al menos 10 caracteres', 'danger');
      return;
    }
    if (!this.price || this.price <= 0) {
      this.showToast('El precio debe ser mayor a 0', 'danger');
      return;
    }
    if (this.stock === null || this.stock < 0) {
      this.showToast('El stock no puede ser negativo', 'danger');
      return;
    }
    if (!this.photo) {
      this.showToast('Debes tomar o elegir una foto del producto', 'danger');
      return;
    }
    if (!this.currentUser) {
      this.showToast('Sesión no válida. Vuelve a iniciar sesión.', 'danger');
      return;
    }

    this.loading = true;

    try {
      // ProductService.create() recibe los campos sin id ni status
      // (los genera el servicio) y persiste el producto.
      await this.productService.create({
        category: this.category,
        name: this.name.trim(),
        description: this.description.trim(),
        price: this.price,
        stock: this.stock,
        imageUrl: this.photo.filepath,         // guardamos el filepath
        sellerEmail: this.currentUser.email,   // asociado al vendedor
      });

      // Éxito: limpiar formulario y avisar.
      this.resetForm();
      this.showToast('Producto agregado a tu lista de ventas', 'success');

    } catch (e: any) {
      console.error('Error al publicar', e);
      this.showToast(e.message || 'Error al publicar el producto', 'danger');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  /** Vuelve todos los campos a su estado inicial. */
  private resetForm(): void {
    this.category = 'artesanía';
    this.name = '';
    this.description = '';
    this.price = null;
    this.stock = null;
    this.photo = null;
  }

  /** Muestra un toast con el mensaje indicado. */
  private showToast(message: string, color: 'success' | 'danger'): void {
    this.toastMessage = message;
    this.toastColor = color;
    this.toastOpen = true;
    this.cdr.detectChanges();
  }

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------
  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}