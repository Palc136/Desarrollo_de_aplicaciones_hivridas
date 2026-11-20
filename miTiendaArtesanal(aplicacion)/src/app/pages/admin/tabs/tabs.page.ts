import { Component } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { people, shield } from 'ionicons/icons';

@Component({
  selector: 'app-admin-tabs',
  templateUrl: 'tabs.page.html',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class AdminTabsPage {
  constructor() {
    addIcons({ people, shield });
  }
}