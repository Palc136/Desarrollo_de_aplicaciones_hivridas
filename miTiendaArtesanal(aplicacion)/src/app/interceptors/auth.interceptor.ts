// ============================================================
// INTERCEPTOR DE AUTENTICACIÓN
// ------------------------------------------------------------
// Un "interceptor" en Angular es una función que se ejecuta
// ANTES de que cualquier petición HTTP salga hacia el backend.
// Aquí aprovechamos ese momento para:
//   - Leer el token JWT guardado en Preferences.
//   - Si existe, clonar la petición y añadir la cabecera
//     "Authorization: Bearer <token>".
//   - Si no existe, dejar pasar la petición tal cual.
//
// Corresponde al requerimiento RF-02 (gestión de tokens de sesión).
// ============================================================

import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';

import { AuthService } from '../services/auth.service';



/**
 * Interceptor funcional (estilo moderno de Angular 15+).
 *
 * Recibe:
 *   - req: la petición HTTP original que el usuario quiere hacer.
 *   - next: la función que "continúa" el flujo hacia el servidor.
 *
 * Devuelve: un Observable con la respuesta del servidor.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() es la forma moderna de obtener dependencias dentro
  // de una función (en vez de usar constructor). En un interceptor
  // funcional es la única forma de acceder al AuthService.
  const authService = inject(AuthService);

  // from(...) convierte la Promise de getToken() en un Observable
  // para poder encadenarlo con el resto del flujo reactivo.
  return from(authService.getToken()).pipe(
    // switchMap permite esperar el token y luego continuar
    // con la petición HTTP ya modificada.
    switchMap((token) => {
      if (token) {
        // req.clone() es OBLIGATORIO porque las peticiones HTTP
        // en Angular son INMUTABLES: no se pueden modificar
        // directamente, hay que clonarlas.
        const cloned = req.clone({
          // Añadimos (o sobreescribimos) la cabecera Authorization
          // con el formato estándar "Bearer <token>".
          headers: req.headers.set('Authorization', `Bearer ${token}`),
        });
        // Enviamos la petición clonada al servidor.
        return next(cloned);
      }
      // Si no hay token, dejamos pasar la petición original
      // (por ejemplo, para endpoints públicos como /login).
      return next(req);
    })
  );
};