// ============================================================
// RUTAS DE LA APLICACIÓN (app.routes.ts)
// ------------------------------------------------------------
// El router de Angular usa este archivo para saber qué
// componente mostrar en cada URL.
//
// Estructura:
//   - /login  → LoginPage (sin protección)
//   - /tabs   → TabsPage (protegida por authGuard)
//   - ''      → redirige a /tabs (y el guard redirige a /login
//               si no hay sesión)
// ============================================================

import type { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

  // Ruta vacía: cuando la app arranca, va a /tabs.
  // Si no hay sesión, el authGuard redirige a /login.
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },

  // Ruta de login (pública, sin guard).
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },

  // Rutas de las pestañas, protegidas por authGuard.
  // "canActivate: [authGuard]" hace que el guard se ejecute
  // antes de activar cualquier ruta hija de /tabs.
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'tab1',
        loadComponent: () =>
          import('./tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'tab2',
        loadComponent: () =>
          import('./tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('./tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: '',
        redirectTo: 'tab1',
        pathMatch: 'full',
      },
    ],
  },

  // Cualquier otra ruta → login.
  { path: '**', redirectTo: 'login' },
];
