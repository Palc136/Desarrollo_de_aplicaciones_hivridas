// ============================================================
// PERFIL DEL COMPRADOR (placeholder con logout)
// ------------------------------------------------------------
// Por ahora solo muestra "En construcción" y un botón de
// logout. En la siguiente fase se llenará con:
//   - Foto de perfil (cámara del dispositivo).
//   - Datos del usuario (nombre, email, rol).
//   - Botón de logout en el header.
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
  selector: 'app-perfil',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mi Perfil</ion-title>

        <!-- Botón de logout a la derecha del header -->
        <ion-buttons slot="end">
          <ion-button (click)="logout()">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p>🚧 En construcción (perfil del comprador)</p>
    </ion-content>
  `,
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon],
})
export class PerfilPage {

  // AuthService: para cerrar sesión.
  private authService = inject(AuthService);

  // Router: para redirigir al login tras el logout.
  private router = inject(Router);

  constructor() {
    // Registramos el ícono de logout para que <ion-icon> lo muestre.
    addIcons({ logOutOutline });
  }

  /**
   * Cierra la sesión actual y vuelve al login.
   * - authService.logout() borra el token y el usuario de Preferences.
   * - navigateByUrl redirige a /login.
   * - replaceUrl evita que el botón "atrás" regrese a esta página.
   */
  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}