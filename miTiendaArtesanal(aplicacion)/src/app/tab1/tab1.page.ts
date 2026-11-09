// ============================================================
// PÁGINA DE GALERÍA DE FOTOS (Tab1Page)
// ------------------------------------------------------------
// Una "página" en Ionic es un componente de Angular que ocupa
// toda la pantalla y se asocia a una ruta (en este caso, la
// pestaña "Tab1"). Su trabajo es triple:
//
//   1. MOSTRAR la interfaz (delegando el HTML a tab1.page.html).
//   2. GESTIONAR el estado de la vista (qué fotos hay, cuáles
//      se están cargando, etc.).
//   3. RESPONDER a los eventos del usuario (tocar un botón,
//      deslizar, etc.) llamando a los servicios adecuados.
//
// La lógica pesada (cámara, archivos, persistencia) NO vive
// aquí: vive en PhotoService. Este componente solo la invoca.
// ============================================================
// ------------------------------------------------------------
// IMPORTS: traer al archivo las herramientas que necesitamos.
// ------------------------------------------------------------
// En TypeScript/JavaScript, "import" le dice al motor: "trae
// esta pieza desde este archivo/módulo y hazla disponible aquí
// con este nombre". Sin imports, este archivo no conocería ni
// Angular, ni Ionic, ni nuestros servicios.
// --- Angular core ---
// "Component" es una FUNCIÓN-DECORADOR que transforma una clase
// normal en un componente Angular. Gracias a ella, Angular sabe
// que esta clase tiene una vista HTML, estilos y un selector.
//-------------------------------------------------------------------------
//// "inject" es una FUNCIÓN que pide a Angular una instancia de
// un servicio (o cualquier dependencia registrada). Es la forma
// moderna (Angular 17+) de obtener dependencias sin usar el
// constructor. Angular crea UNA sola instancia de cada servicio
// y la reutiliza en toda la app (patrón Singleton).
import { Component,inject,ChangeDetectorRef } from '@angular/core';
// "OnInit" es una INTERFAZ (un contrato). Al implementarla,
// Angular nos obliga a escribir el método ngOnInit(), que se
// ejecutará UNA VEZ cuando el componente termine de crearse.
// Es el lugar típico para cargar datos iniciales.
import type {OnInit} from '@angular/core';
import { Router } from '@angular/router';
// --- Ionic ---ionic serve
// Cada "IonXxx" es un COMPONENTE de la librería Ionic (una
// etiqueta HTML con estilos y comportamiento propios). Al
// importarlos y registrarlos en el array "imports" del
// @Component, Angular sabe qué hacer cuando encuentra, por
// ejemplo, <ion-card> en el HTML.
//
//   ion-header   → barra superior fija
//   ion-toolbar  → contenedor interno de la barra
//   ion-title    → título de la barra
//   ion-content  → área de contenido con scroll
//   ion-grid     → sistema de cuadrícula responsiva
//   ion-row      → fila dentro de la cuadrícula
//   ion-col      → columna dentro de la fila
//   ion-card     → tarjeta visual con sombra y bordes
//   ion-fab      → contenedor de botón flotante (FAB)
//   ion-fab-button → botón flotante en sí
//   ion-icon     → muestra un ícono de Ionicons
//   ion-button   → botón estándar de Ionic
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButton,
  IonButtons,
} from '@ionic/angular';
// --- Iconos (ionicons) ---
// "addIcons" es una FUNCIÓN que registra íconos en el "registro
// global" de Ionicons. A partir de Ionic 7, los íconos NO se
// cargan automáticamente: hay que registrarlos explícitamente
// para que <ion-icon name="..."> sepa qué SVG mostrar.
import { addIcons } from 'ionicons';
// "camera" y "trash" son los íconos concretos (objetos SVG)
// que vamos a usar en la galería. Se registran con addIcons.
import { camera, trash, logOutOutline, personCircleOutline  } from 'ionicons/icons';

// --- Servicios propios ---
// PhotoService es la CLASE que encapsula toda la lógica de
// cámara y almacenamiento (abrir cámara, guardar archivo,
// persistir lista, cargar fotos, eliminar). Al inyectarla en
// este componente, podemos llamar a sus métodos como si fueran
// propios.
import type { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { PhotoService } from '../services/photo.service';


// ------------------------------------------------------------
// DECORADOR @Component
// ------------------------------------------------------------
// Un "decorador" es una función que "envuelve" a una clase y
// le añade metadatos. @Component le dice a Angular: "esta clase
// no es una clase cualquiera: es un componente con estas
// características". Sin el decorador, Angular no la reconocería.
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonGrid, IonRow, IonCol, IonCard,
    IonFab, IonFabButton, IonIcon, IonButton,
    IonButtons,
  ],
})
export class Tab1Page implements OnInit {

  // Servicio de fotos (ya lo conoces).
  public photoService = inject(PhotoService);

  // Servicio de autenticación para obtener usuario y hacer logout.
  public authService = inject(AuthService);

  // Detector de cambios (para refrescar la vista cuando la
  // cámara actualiza la lista de fotos fuera de la zona de Angular).
  private cdr = inject(ChangeDetectorRef);

  // Router para redirigir al login tras el logout.
  private router = inject(Router);

  // Usuario autenticado (se llena en ngOnInit).
  public currentUser: User | null = null;

  constructor() {
    // Registramos todos los íconos que usa el HTML.
    addIcons({ camera, trash, logOutOutline, personCircleOutline });
  }

  async ngOnInit(): Promise<void> {
    // Cargamos las fotos guardadas.
    await this.photoService.loadSaved();

    // Cargamos el usuario autenticado desde Preferences.
    this.currentUser = await this.authService.getUser();

    // Forzamos un refresco por si Angular no detectó los cambios.
    this.cdr.detectChanges();
  }

  async addPhotoToGallery(): Promise<void> {
    await this.photoService.addNewToGallery();
    this.cdr.detectChanges();
  }

  async removePhoto(filepath: string): Promise<void> {
    await this.photoService.deletePhoto(filepath);
    this.cdr.detectChanges();
  }

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------
  // Elimina el token y el usuario del almacenamiento, y
  // redirige al login. El authGuard bloqueará /tabs.
  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}