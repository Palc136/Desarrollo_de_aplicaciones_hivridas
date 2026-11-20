// ============================================================
// SERVICIO DE CUENTAS (AccountService)
// ------------------------------------------------------------
// Gestiona las cuentas y productos desde la perspectiva del
// ADMINISTRADOR. Sus operaciones:
//
//   - Listar todas las cuentas (con info derivada).
//   - Suspender / reactivar una cuenta.
//   - Eliminar una cuenta (lógicamente).
//   - Al eliminar un vendedor: también se eliminan sus
//     productos (para que no se muestren a los compradores).
//   - Listar productos por vendedor (para gestión admin).
//
// Trabaja sobre las MISMAS claves de Preferences que AuthService
// y ProductService para mantener la coherencia de datos.
// ============================================================

import { Injectable, inject } from '@angular/core';

import type { AccountInfo } from '../models/account.model';
import type { Product } from '../models/product.model';

import { AuthService } from './auth.service';
import type { StoredUser } from './auth.service';
import { ProductService } from './product.service';




@Injectable({ providedIn: 'root' })
export class AccountService {

  // Necesitamos leer y escribir usuarios (AuthService) y
  // eliminar productos de vendedores (ProductService).
  private authService = inject(AuthService);
  private productService = inject(ProductService);

  // ──────────────────────────────────────────────────────────
  // LISTAR CUENTAS
  // ──────────────────────────────────────────────────────────
  // Devuelve todas las cuentas con información derivada:
  //   - Para vendedores: cuántos productos publicó.
  //   - Para compradores: cuántas compras realizó.
  //
  // El admin usa esta lista en su pestaña "Cuentas".
  async getAllAccounts(): Promise<AccountInfo[]> {
    const users = await this.authService.getAllRegisteredUsers();

    const accounts: AccountInfo[] = [];

    for (const u of users) {
      // Base de la cuenta (común a todos).
      const info: AccountInfo = {
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        registeredAt: u.registeredAt,
      };

      // Info extra para vendedores: contar sus productos.
      if (u.role === 'vendedor') {
        const products = await this.productService.getBySeller(u.email);
        info.productsCount = products.length;
      }

      // Info extra para compradores: contar sus compras.
      // (Aquí solo contamos ventas donde aparece como buyerEmail).
      // Para simplificar, se deja como 0 por ahora; se puede
      // enriquecer después leyendo el SaleService.

      accounts.push(info);
    }

    // Ordenamos: primero vendedores, luego compradores, luego admin.
    const roleOrder = { vendedor: 0, comprador: 1, administrador: 2 };
    return accounts.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
  }

  // ──────────────────────────────────────────────────────────
  // SUSPENDER / REACTIVAR CUENTA
  // ──────────────────────────────────────────────────────────
  // El admin puede suspender una cuenta para que el usuario
  // no pueda iniciar sesión, sin eliminar sus datos.
  async setAccountStatus(
    email: string,
    status: 'active' | 'suspended'
  ): Promise<void> {
    const users = await this.authService.getAllRegisteredUsers();
    const target = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!target) return;

    target.status = status;
    await this.authService.persistUsers(users);
  }

  // ──────────────────────────────────────────────────────────
  // ELIMINAR CUENTA (lógicamente)
  // ──────────────────────────────────────────────────────────
  // No borramos el registro: cambiamos su status a 'deleted'.
  // Esto conserva el historial de ventas y compras para auditoría.
  //
  // Reglas de negocio (según el requerimiento):
  //   - Comprador eliminado: solo pierde el acceso. Sus compras
  //     quedan registradas en el SaleService (no se borran).
  //   - Vendedor eliminado: se eliminan TODOS sus productos
  //     para que los compradores no los vean ni los compren.
  async deleteAccount(email: string): Promise<void> {
    const users = await this.authService.getAllRegisteredUsers();
    const target = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!target) return;

    // Si es vendedor: eliminar todos sus productos primero.
    if (target.role === 'vendedor') {
      const products = await this.productService.getBySeller(target.email);
      for (const p of products) {
        await this.productService.delete(p.id, target.email);
      }
    }

    // Marcar la cuenta como eliminada.
    target.status = 'deleted';
    await this.authService.persistUsers(users);
  }

  // ──────────────────────────────────────────────────────────
  // LISTAR PRODUCTOS DE UN VENDEDOR (para gestión admin)
  // ──────────────────────────────────────────────────────────
  async getProductsBySeller(email: string): Promise<Product[]> {
    return this.productService.getBySeller(email);
  }

  /**
   * Suspende o reactiva un producto concreto de un vendedor.
   * El admin lo usa en su pestaña "Productos".
   */
  async setProductStatus(productId: string, suspended: boolean): Promise<void> {
    await this.productService.suspend(productId, suspended);
  }

  /**
   * Elimina definitivamente un producto (solo admin).
   * Necesita el sellerEmail para localizarlo.
   */
  async deleteProduct(productId: string, sellerEmail: string): Promise<void> {
    await this.productService.delete(productId, sellerEmail);
  }

  /**
   * Devuelve la lista de vendedores activos con sus productos.
   * El admin la usa para elegir qué vendedor revisar.
   */
  async getSellersWithProducts(): Promise<{ seller: StoredUser; products: Product[] }[]> {
    const users = await this.authService.getAllRegisteredUsers();
    const sellers = users.filter(
      (u) => u.role === 'vendedor' && u.status === 'active'
    );

    const result: { seller: StoredUser; products: Product[] }[] = [];
    for (const s of sellers) {
      const products = await this.productService.getBySeller(s.email);
      result.push({ seller: s, products });
    }
    return result;
  }
}