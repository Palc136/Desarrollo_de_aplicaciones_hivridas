// ============================================================
// MODELO DE USUARIO
// ------------------------------------------------------------
// Ahora incluye:
//   - status: 'active' | 'suspended' (para que el admin pueda
//     suspender cuentas sin borrarlas definitivamente).
//   - sellerEmail en Product (para saber qué vendedor publicó).
// ============================================================

export interface User {
  id?: string;
  email: string;
  role: 'comprador' | 'vendedor' | 'administrador';
  name?: string;

  // Estado de la cuenta. Si está 'suspended', el login la
  // rechaza con un mensaje. Si está 'active', puede entrar.
  status?: 'active' | 'suspended';
}

export interface LoginResponse {
  token: string;
  user: User;
}