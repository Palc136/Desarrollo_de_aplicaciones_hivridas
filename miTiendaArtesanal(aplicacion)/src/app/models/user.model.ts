// ============================================================
// MODELOS DE USUARIO Y RESPUESTA DE LOGIN
// ------------------------------------------------------------
// Una "interface" en TypeScript es un CONTRATO: define la
// forma (propiedades y tipos) que debe tener un objeto.
// No genera código en JavaScript: solo sirve para que el
// compilador valide que los objetos cumplen esa forma.
// ============================================================

// "export" permite que otros archivos importen esta interface.
export interface User {
  // ID único del usuario. Opcional porque un usuario recién
  // registrado aún no lo tiene (lo genera el backend real).
  id?: string;

  // Correo electrónico: se usa como credencial de login.
  email: string;

  // Rol del usuario en el marketplace. Solo permite estos
  // tres valores: si escribes otro, TypeScript marca error.
  role: 'comprador' | 'vendedor' | 'administrador';

  // Nombre visible del usuario (opcional).
  name?: string;
}

// Forma de la respuesta del endpoint POST /login del backend.
// El mock imitará exactamente esta estructura.
export interface LoginResponse {
  // Token JWT firmado (en el mock, la firma será falsa pero
  // la estructura será la de un JWT real).
  token: string;

  // Datos del usuario autenticado.
  user: User;
}