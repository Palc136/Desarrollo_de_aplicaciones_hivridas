// ============================================================
// GUARD DE AUTENTICACIÓN (authGuard)
// ------------------------------------------------------------
// Un "guard" (guardián) es una función que Angular ejecuta
// ANTES de activar una ruta. Sirve para decidir si el usuario
// puede entrar o no.
//
// Este guard:
//   - Si el usuario tiene token → permite el acceso (true).
//   - Si NO tiene token → redirige a /login (UrlTree).
//
// Se aplica a la ruta /tabs para proteger toda la app.
// ============================================================

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';

import { AuthService } from '../services/auth.service';

// "CanActivateFn" es el TIPO de función de guard moderno
// (Angular 15+). Reemplaza a las clases que implementaban
// CanActivate.
export const authGuard: CanActivateFn = async () => {

  // inject() obtiene dependencias dentro de una función
  // (no podemos usar constructor porque no es una clase).
  const authService = inject(AuthService);
  const router = inject(Router);

  // Consultamos si hay token guardado.
  const isAuth = await authService.isAuthenticated();

  // Si está autenticado, permitimos la navegación.
  if (isAuth) return true;

  // Si no, devolvemos una UrlTree que redirige a /login.
  // Angular interpreta el UrlTree como "cancela la navegación
  // actual y ve a esta otra ruta".
  return router.createUrlTree(['/login']);
};