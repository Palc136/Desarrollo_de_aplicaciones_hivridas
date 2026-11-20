// ============================================================
// SERVICIO DE AUTENTICACIÓN (AuthService)
// ------------------------------------------------------------
// CAMBIOS respecto a la versión anterior:
//   - StoredUser ahora incluye `status` y `registeredAt`.
//   - login() rechaza cuentas suspendidas o eliminadas.
//   - register() guarda la fecha de registro.
//   - Nuevo método getAllRegisteredUsers() para que el
//     AccountService (admin) pueda listar y gestionar.
// ============================================================

import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import type { LoginResponse, User } from '../models/user.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REGISTERED_KEY = 'registered_users';

const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = '123456';

// Estructura interna de un usuario registrado.
// Incluye password (en backend real sería hash) y metadatos
// que el admin necesita ver: status y fecha de registro.
export interface StoredUser {
  email: string;
  password: string;
  role: User['role'];
  name: string;

  // Estado de la cuenta:
  //   'active'    → puede iniciar sesión.
  //   'suspended' → bloqueada temporalmente por el admin.
  //   'deleted'   → eliminada lógicamente (registro conservado).
  status: 'active' | 'suspended' | 'deleted';

  // Fecha ISO 8601 del registro (para mostrar al admin).
  registeredAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  // ----------------------------------------------------------
  // REGISTRO
  // ----------------------------------------------------------
  async register(
    email: string,
    password: string,
    role: 'comprador' | 'vendedor'
  ): Promise<User> {

    // Validaciones básicas.
    if (!email.includes('@')) throw new Error('El correo no es válido');
    if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

    // El admin es reservado.
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Este correo está reservado. Usa otro.');
    }

    const users = await this.getAllRegisteredUsers();

    // Correo ya registrado (activo, suspendido o eliminado).
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Ya existe una cuenta con este correo');
    }

    // Creamos el usuario con status 'active' y fecha actual.
    const newUser: StoredUser = {
      email: email.toLowerCase(),
      password,
      role,
      name: email.split('@')[0],
      status: 'active',
      registeredAt: new Date().toISOString(),
    };

    users.push(newUser);
    await this.persistUsers(users);

    return { email: newUser.email, role: newUser.role, name: newUser.name };
  }

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------
  async login(email: string, password: string): Promise<LoginResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    // Latencia simulada.
    await new Promise((r) => setTimeout(r, 600));

    let matched: StoredUser | null = null;

    // Admin predefinido.
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      matched = {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'administrador',
        name: 'Administrador',
        status: 'active',
        registeredAt: new Date().toISOString(),
      };
    }

    // Buscar en registrados.
    if (!matched) {
      const users = await this.getAllRegisteredUsers();
      matched = users.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
      ) || null;
    }

    if (!matched) throw new Error('Correo o contraseña incorrectos');

    // ⚠️ NUEVO: bloquear cuentas suspendidas o eliminadas.
    if (matched.status === 'suspended') {
      throw new Error('Tu cuenta está suspendida. Contacta al administrador.');
    }
    if (matched.status === 'deleted') {
      throw new Error('Esta cuenta fue eliminada.');
    }

    // Construir User público (sin password, sin status interno).
    const user: User = {
      id: 'user_' + Date.now(),
      email: matched.email,
      role: matched.role,
      name: matched.name,
    };

    const token = this.generateMockJwt(user);
    await Promise.all([
      Preferences.set({ key: TOKEN_KEY, value: token }),
      Preferences.set({ key: USER_KEY, value: JSON.stringify(user) }),
    ]);

    return { token, user };
  }

  // ----------------------------------------------------------
  // GENERADOR DE JWT (igual que antes)
  // ----------------------------------------------------------
  private generateMockJwt(user: User): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = { sub: user.email, role: user.role, iat: now, exp: now + 3600 };
    const b64url = (obj: object): string =>
      btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${b64url(header)}.${b64url(payload)}.mock_signature`;
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  /**
   * Devuelve TODOS los usuarios registrados (con password).
   * ⚠️ SOLO para uso interno (AccountService del admin).
   * En backend real, este método NO existiría en el cliente:
   * el servidor devolvería solo los datos públicos.
   */
  async getAllRegisteredUsers(): Promise<StoredUser[]> {
    const { value } = await Preferences.get({ key: REGISTERED_KEY });
    return value ? (JSON.parse(value) as StoredUser[]) : [];
  }

  /**
   * Persiste la lista de usuarios (uso interno del AccountService).
   */
  async persistUsers(users: StoredUser[]): Promise<void> {
    await Preferences.set({
      key: REGISTERED_KEY,
      value: JSON.stringify(users),
    });
  }

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  }

  async getUser(): Promise<User | null> {
    const { value } = await Preferences.get({ key: USER_KEY });
    return value ? (JSON.parse(value) as User) : null;
  }

  async isAuthenticated(): Promise<boolean> {
    return !!(await this.getToken());
  }

  async logout(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: TOKEN_KEY }),
      Preferences.remove({ key: USER_KEY }),
    ]);
  }
}