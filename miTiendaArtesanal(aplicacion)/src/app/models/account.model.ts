// ============================================================
// MODELO DE CUENTA (para gestión del admin)
// ------------------------------------------------------------
// El admin necesita ver TODAS las cuentas registradas,
// incluyendo su estado actual, para poder suspenderlas o
// eliminarlas. Este modelo representa esa vista.
//
// IMPORTANTE: la contraseña NO se incluye aquí por seguridad.
// El authService sigue guardándola internamente, pero el
// admin NUNCA ve contraseñas.
// ============================================================

export interface AccountInfo {
  email: string;
  name: string;
  role: 'comprador' | 'vendedor' | 'administrador';
  status: 'active' | 'suspended' | 'deleted';

  // Fecha de registro (ISO 8601).
  registeredAt: string;

  // Solo para vendedores: cantidad de productos publicados.
  productsCount?: number;

  // Solo para compradores: cantidad de compras realizadas.
  purchasesCount?: number;
}