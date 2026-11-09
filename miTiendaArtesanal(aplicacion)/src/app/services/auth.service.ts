// ============================================================
// SERVICIO DE AUTENTICACIÓN (AuthService)
// ------------------------------------------------------------
// Gestiona el registro, login y logout de usuarios.
//
// Como esta actividad no incluye un backend real, simulamos
// un "servidor" guardando los usuarios registrados en
// Preferences (almacenamiento local del dispositivo). Cuando
// tengas un backend real, solo hay que reemplazar los métodos
// login() y register() por llamadas HTTP; el resto del flujo
// (guardar token, interceptor, guard) no cambia.
//
// Reglas del mock:
//   - El admin (admin@test.com / 123456) siempre existe y
//     NO se puede registrar otro con ese correo.
//   - Cualquier otro correo puede registrarse como comprador
//     o vendedor.
//   - El login busca primero al admin; si no coincide, busca
//     en la lista de usuarios registrados.
// ============================================================

import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import type { LoginResponse, User } from '../models/user.model';

// Claves usadas en Preferences (evitan errores de tipeo).
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REGISTERED_KEY = 'registered_users';

// Admin predefinido: vive como constante en el código (en un
// backend real viviría en la base de datos del servidor).
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = '123456';

// Estructura interna de un usuario registrado en el mock.
// Incluye la contraseña (en un backend real NUNCA se guarda
// en texto plano: se guarda su hash con bcrypt/argon2).
interface StoredUser {
  email: string;
  password: string;
  role: User['role'];
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  // ----------------------------------------------------------
  // REGISTRO DE NUEVO USUARIO
  // ----------------------------------------------------------
  // Valida los datos y guarda al usuario en la lista local.
  // Devuelve el usuario creado (sin la contraseña).
  async register(
    email: string,
    password: string,
    role: 'comprador' | 'vendedor'
  ): Promise<User> {

    // 1) Validaciones básicas de formato.
    if (!email.includes('@')) {
      throw new Error('El correo no es válido');
    }
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // 2) El correo del admin está reservado: no se puede registrar.
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Este correo está reservado. Usa otro.');
    }

    // 3) Cargamos la lista de usuarios registrados actual.
    const users = await this.getRegisteredUsers();

    // 4) Verificamos que el correo no esté ya registrado.
    const exists = users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (exists) {
      throw new Error('Ya existe una cuenta con este correo');
    }

    // 5) Creamos el usuario y lo añadimos a la lista.
    const newUser: StoredUser = {
      email: email.toLowerCase(),
      password,                          // En backend real: hash, no plano
      role,
      name: email.split('@')[0],         // nombre = parte antes del @
    };
    users.push(newUser);

    // 6) Persistimos la lista actualizada en Preferences.
    await Preferences.set({
      key: REGISTERED_KEY,
      value: JSON.stringify(users),
    });

    // 7) Devolvemos el usuario SIN contraseña (buena práctica).
    return { email: newUser.email, role: newUser.role, name: newUser.name };
  }

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------
  // Busca al usuario en dos sitios:
  //   1. Admin predefinido (constante en el código).
  //   2. Lista de usuarios registrados en Preferences.
  // Si lo encuentra, genera un JWT y guarda la sesión.
  async login(email: string, password: string): Promise<LoginResponse> {

    // Normalizamos el email (minúsculas, sin espacios).
    const normalizedEmail = email.trim().toLowerCase();

    // Simulamos la latencia del servidor (mejor UX).
    await new Promise((r) => setTimeout(r, 600));

    // --- 1) ¿Es el admin predefinido? ---
    let matched: StoredUser | null = null;

    if (
      normalizedEmail === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      matched = {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'administrador',
        name: 'Administrador',
      };
    }

    // --- 2) Si no es admin, buscamos en los registrados ---
    if (!matched) {
      const users = await this.getRegisteredUsers();
      matched = users.find(
        (u) =>
          u.email.toLowerCase() === normalizedEmail &&
          u.password === password
      ) || null;
    }

    // --- 3) Si no se encontró, error genérico ---
    // (No revelamos si el email existe o no: buena práctica
    // de seguridad para evitar "enumeración de usuarios").
    if (!matched) {
      throw new Error('Correo o contraseña incorrectos');
    }

    // --- 4) Construimos el User público (sin password) ---
    const user: User = {
      id: 'user_' + Date.now(),
      email: matched.email,
      role: matched.role,
      name: matched.name,
    };

    // --- 5) Generamos el JWT y guardamos la sesión ---
    const token = this.generateMockJwt(user);
    await Promise.all([
      Preferences.set({ key: TOKEN_KEY, value: token }),
      Preferences.set({ key: USER_KEY, value: JSON.stringify(user) }),
    ]);

    return { token, user };
  }

  // ----------------------------------------------------------
  // GENERADOR DE JWT (mock)
  // ----------------------------------------------------------
  // Genera un JWT con estructura válida (header.payload.signature).
  // La firma es ficticia; en un backend real se firma con HMAC.
  private generateMockJwt(user: User): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.email,
      role: user.role,
      iat: now,           // emitido en
      exp: now + 3600,    // expira en 1 hora
    };

    // Codifica un objeto a Base64URL (seguro para URLs).
    const b64url = (obj: object): string =>
      btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${b64url(header)}.${b64url(payload)}.mock_signature`;
  }

  // ----------------------------------------------------------
  // HELPERS DE ALMACENAMIENTO
  // ----------------------------------------------------------
  private async getRegisteredUsers(): Promise<StoredUser[]> {
    const { value } = await Preferences.get({ key: REGISTERED_KEY });
    return value ? (JSON.parse(value) as StoredUser[]) : [];
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

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------
  // Elimina SOLO la sesión actual. Los usuarios registrados
  // (REGISTERED_KEY) se conservan para poder volver a entrar
  // con esas cuentas después.
  async logout(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: TOKEN_KEY }),
      Preferences.remove({ key: USER_KEY }),
    ]);
  }
}