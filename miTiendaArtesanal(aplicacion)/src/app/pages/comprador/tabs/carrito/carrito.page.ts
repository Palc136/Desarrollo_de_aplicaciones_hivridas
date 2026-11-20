// ============================================================
// CARRITO DEL COMPRADOR (placeholder con logout)
// ------------------------------------------------------------
// En la siguiente fase se llenará con:
//   - Lista de items del carrito (CartService).
//   - Controles de cantidad (+ / −).
//   - Botón "Finalizar compra".
//   - Registro de ventas al confirmar (SaleService).
// ============================================================

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-carrito',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mi Carrito</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="logout()">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>🚧 En construcción (carrito del comprador)</p>
    </ion-content>
  `,
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon],
})
export class CarritoPage {

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({ logOutOutline });
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}