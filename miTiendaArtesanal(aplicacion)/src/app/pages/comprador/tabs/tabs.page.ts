// ============================================================
// TABS DEL COMPRADOR (CompradorTabsPage)
// ------------------------------------------------------------
// Shell con 3 pestañas: Perfil, Productos, Carrito.
// Las páginas hijas se cargan de forma lazy por el router.
// ============================================================

import { Component } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { person, storefront, cart } from 'ionicons/icons';

@Component({
  selector: 'app-comprador-tabs',
  templateUrl: 'tabs.page.html',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class CompradorTabsPage {
  constructor() {
    // Registramos los íconos de las 3 tabs.
    addIcons({ person, storefront, cart });
  }
}