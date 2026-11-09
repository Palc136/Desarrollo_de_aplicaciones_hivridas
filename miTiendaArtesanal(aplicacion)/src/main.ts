import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
// --- PWA Elements ---
// "defineCustomElements" es una FUNCIÓN que registra los
// componentes web de PWA Elements (como el modal de la cámara).
// Es necesario para que, en la web, el plugin de la cámara
// muestre una interfaz de cámara en lugar de un selector de archivos.
import { defineCustomElements } from '@ionic/pwa-elements/loader';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';

// Llamamos a la función ANTES de arrancar la aplicación.
// "window" es el objeto global del navegador; los componentes
// personalizados se registran en él.
defineCustomElements(window);

// bootstrapApplication inicializa la app usando AppComponent como raíz.
bootstrapApplication(AppComponent, {
  // providers: lista de servicios/estrategias globales.
  providers: [
    // Estrategia de reutilización de rutas de Ionic.
    // Permite que las páginas mantengan su estado al navegar
    // (por ejemplo, no perder la posición del scroll).
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // provideIonicAngular() registra los providers internos de Ionic
    // (necesario en proyectos Standalone con Ionic 9+).
    provideIonicAngular(),

    // Configuración del router de Angular:
    //   - withPreloading(PreloadAllModules): precarga todas las
    //     páginas en segundo plano para navegaciones más rápidas.
    //   - withComponentInputBinding(): permite recibir parámetros
    //     de ruta como @Input() en los componentes.
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding()
    ),

    // Configura HttpClient con el interceptor de autenticación.
    // A partir de aquí, TODAS las peticiones HTTP pasarán
    // automáticamente por authInterceptor.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
});
