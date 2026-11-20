// ============================================================
// GESTIÓN DE CUENTAS (Admin - placeholder con logout)
// ------------------------------------------------------------
// Por ahora solo muestra "En construcción" y un botón de
// logout en el header. En la siguiente fase se llenará con
// la lista de cuentas y las acciones de suspender/eliminar.
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
  selector: 'app-cuentas',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Gestión de Cuentas</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="logout()">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>🚧 En construcción (eliminar/suspender cuentas)</p>
    </ion-content>
  `,
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon],
})
export class CuentasPage {

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