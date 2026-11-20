import { Component } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, list, cash } from 'ionicons/icons';

@Component({
  selector: 'app-vendedor-tabs',
  templateUrl: 'tabs.page.html',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class VendedorTabsPage {
  constructor() {
    addIcons({ addCircle, list, cash });
  }
}