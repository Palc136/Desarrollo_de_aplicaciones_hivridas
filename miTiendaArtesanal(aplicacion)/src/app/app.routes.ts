// ============================================================
// RUTAS DE LA APLICACIÓN (app.routes.ts)
// ------------------------------------------------------------
// Cada rol tiene su propio grupo de tabs, protegido por
// authGuard (verifica que haya token). El login decide a
// qué grupo redirigir según el rol del usuario.
//
// Jerarquía:
//   /login                 → LoginPage (pública)
//   /comprador/tabs/*      → CompradorTabsPage (protegida)
//   /vendedor/tabs/*       → VendedorTabsPage  (protegida)
//   /admin/tabs/*          → AdminTabsPage     (protegida)
// ============================================================

import type { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

  // Ruta raíz: redirige a login. Si el usuario ya está
  // autenticado, el guard del login (opcional) puede
  // enviarlo a su rol. Por ahora, siempre pasa por login.
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ──────────────────────────────────────────────────────────
  // LOGIN (pública)
  // ──────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },

  // ──────────────────────────────────────────────────────────
  // COMPRADOR
  // ──────────────────────────────────────────────────────────
  {
    path: 'comprador/tabs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/comprador/tabs/tabs.page').then((m) => m.CompradorTabsPage),
    children: [
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/comprador/tabs/perfil/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/comprador/tabs/productos/productos.page').then((m) => m.ProductosPage),
      },
      {
        path: 'carrito',
        loadComponent: () =>
          import('./pages/comprador/tabs/carrito/carrito.page').then((m) => m.CarritoPage),
      },
      {
        path: '',
        redirectTo: 'perfil',
        pathMatch: 'full',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // VENDEDOR
  // ──────────────────────────────────────────────────────────
  {
    path: 'vendedor/tabs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/vendedor/tabs/tabs.page').then((m) => m.VendedorTabsPage),
    children: [
      {
        path: 'publicar',
        loadComponent: () =>
          import('./pages/vendedor/tabs/publicar/publicar.page').then((m) => m.PublicarPage),
      },
      {
        path: 'mis-productos',
        loadComponent: () =>
          import('./pages/vendedor/tabs/mis_productos/mis_productos.page').then((m) => m.MisProductosPage),
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./pages/vendedor/tabs/ventas/ventas.page').then((m) => m.VentasPage),
      },
      {
        path: '',
        redirectTo: 'publicar',
        pathMatch: 'full',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // ADMIN
  // ──────────────────────────────────────────────────────────
  {
    path: 'admin/tabs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/admin/tabs/tabs.page').then((m) => m.AdminTabsPage),
    children: [
      {
        path: 'cuentas',
        loadComponent: () =>
          import('./pages/admin/tabs/cuentas/cuentas.page').then((m) => m.CuentasPage),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/admin/tabs/productos/productos.page').then((m) => m.ProductosAdminPage),
      },
      {
        path: '',
        redirectTo: 'cuentas',
        pathMatch: 'full',
      },
    ],
  },

  // Cualquier otra ruta → login.
  { path: '**', redirectTo: 'login' },
];