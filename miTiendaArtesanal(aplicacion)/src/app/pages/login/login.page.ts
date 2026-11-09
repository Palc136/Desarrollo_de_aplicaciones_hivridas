// ============================================================
// PÁGINA DE LOGIN / REGISTRO (LoginPage)
// ------------------------------------------------------------
// Una sola pantalla con dos modos controlados por ion-segment:
//   - "login"    → formulario email + contraseña
//   - "register" → formulario email + rol + contraseña
//
// En modo registro, el selector de rol solo permite
// "comprador" o "vendedor"; el admin no es seleccionable.
// ============================================================

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel,
  IonItem, IonInput, IonButton, IonSpinner,
  IonText, IonIcon, IonNote,
} from '@ionic/angular';
import type { SegmentCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logInOutline, personAddOutline, alertCircleOutline } from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';



// Tipo que restringe el modo actual.
type Mode = 'login' | 'register';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSegment, IonSegmentButton, IonLabel,
    IonItem, IonInput, IonButton, IonSpinner,
    IonText, IonIcon, IonNote,
  ],
})
export class LoginPage {

  // ----------------------------------------------------------
  // ESTADO DEL FORMULARIO
  // ----------------------------------------------------------
  mode: Mode = 'login';        // modo actual (login/registro)

  email = '';                  // email (ambos modos)
  password = '';               // contraseña (ambos modos)
  role: 'comprador' | 'vendedor' = 'comprador'; // solo en registro

  loading = false;             // spinner mientras se procesa
  errorMsg = '';               // mensaje de error
  successMsg = '';             // mensaje de éxito

  // Dependencias inyectadas.
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({ logInOutline, personAddOutline, alertCircleOutline });
  }

  // ----------------------------------------------------------
  // CAMBIAR MODO (segmento)
  // ----------------------------------------------------------
  // Cuando el usuario toca "Ingresar" o "Crear cuenta",
  // limpiamos los mensajes para evitar confusión.
  onModeChange(event: SegmentCustomEvent): void {
    const value = event.detail.value;

    if (value === 'login' || value === 'register') {
      this.mode = value;
      this.errorMsg = '';
      this.successMsg = '';
    }
    // Si llega otro valor, se ignora (no debería pasar, pero
    // así TypeScript queda contento y el código es defensivo).
  }

  // ----------------------------------------------------------
  // CAMBIO DE ROL (comprador ↔ vendedor)
  // ----------------------------------------------------------
  // Mismo patrón que arriba: se recive el evento y se valida
  // que sea uno de los valores permitidos.
  onRoleChange(event: SegmentCustomEvent): void {
    const value = event.detail.value;

    if (value === 'comprador' || value === 'vendedor') {
      this.role = value;
    }
  }

  // ----------------------------------------------------------
  // BOTÓN PRINCIPAL (Ingresar o Crear cuenta)
  // ----------------------------------------------------------
  async onSubmit(): Promise<void> {
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = true;

    try {
      if (this.mode === 'login') {
        await this.doLogin();
      } else {
        await this.doRegister();
      }
    } catch (err: any) {
      this.errorMsg = err.message || 'Ocurrió un error';
    } finally {
      this.loading = false;
    }
  }

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------
  private async doLogin(): Promise<void> {
    await this.authService.login(this.email, this.password);
    // "replaceUrl" evita volver al login con el botón "atrás".
    await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
  }

  // ----------------------------------------------------------
  // REGISTRO
  // ----------------------------------------------------------
  // Crea la cuenta y luego hace login automático.
  private async doRegister(): Promise<void> {
    await this.authService.register(this.email, this.password, this.role);
    // Tras registrar, autenticamos al usuario automáticamente
    // para que no tenga que volver a escribir sus datos.
    await this.authService.login(this.email, this.password);
    await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
  }
}