// ============================================================
// SERVICIO DE VENTAS (SaleService)
// ------------------------------------------------------------
// Registra las ventas cuando un comprador finaliza la compra.
// Es la pieza que conecta al COMPRADOR con el VENDEDOR:
//
//   Comprador finaliza compra
//     → SaleService.recordFromCart(items, buyerEmail)
//     → Por cada producto de un vendedor, crea una Sale
//     → El vendedor la ve en su pestaña "Ventas"
//
// Las ventas son INMUTABLES: no se editan ni eliminan.
// Si el admin elimina una cuenta, sus ventas se conservan
// para auditoría (registro contable).
// ============================================================

import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import type { CartItem } from '../models/cart.model';
import type { Sale } from '../models/sale.model';

// Clave de Preferences donde se persisten todas las ventas.
const SALES_KEY = 'sales';

// Correo del "vendedor por defecto" de los productos demo.
// Las ventas de esos productos NO se asignan a nadie real,
// así que no se registran (no hay vendedor que ver la venta).
const DEFAULT_SELLER = 'seller@default.com';

@Injectable({ providedIn: 'root' })
export class SaleService {

  // ──────────────────────────────────────────────────────────
  // REGISTRAR VENTAS DESDE EL CARRITO
  // ──────────────────────────────────────────────────────────
  // Se llama al finalizar la compra. Recibe los items del
  // carrito y el correo del comprador, y crea UNA venta por
  // cada producto que pertenezca a un vendedor real.
  //
  // ¿Por qué una venta por producto y no una por compra?
  // Porque cada venta le pertenece a UN vendedor. Si el
  // comprador llevó productos de 3 vendedores, cada uno debe
  // ver SOLO sus ventas (no las de los demás).
  async recordFromCart(items: CartItem[], buyerEmail: string): Promise<Sale[]> {

    // Leemos las ventas existentes para añadir las nuevas.
    const existing = await this.getAll();

    // Array de ventas nuevas que vamos a generar.
    const newSales: Sale[] = [];

    // Recorremos cada item del carrito.
    for (const item of items) {

      // Saltamos los productos del catálogo por defecto:
      // no tienen vendedor real, no hay a quién notificar.
      if (item.product.sellerEmail === DEFAULT_SELLER) continue;

      // Construimos la venta con los datos actuales del producto.
      // Guardamos nombre y precio como "snapshot": si el producto
      // se elimina después, la venta conserva los datos originales.
      const sale: Sale = {
        id: `sale_${Date.now()}_${item.product.id}`,
        sellerEmail: item.product.sellerEmail,
        buyerEmail,
        productId: item.product.id,
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
        date: new Date().toISOString(),
      };

      newSales.push(sale);
    }

    // Si no hay ventas que registrar (solo productos default),
    // terminamos aquí sin escribir nada.
    if (newSales.length === 0) return [];

    // Persistimos las ventas (existentes + nuevas).
    await this.persist([...existing, ...newSales]);

    return newSales;
  }

  // ──────────────────────────────────────────────────────────
  // CONSULTAS
  // ──────────────────────────────────────────────────────────

  /**
   * Devuelve TODAS las ventas (uso interno y para admin).
   */
  async getAll(): Promise<Sale[]> {
    const { value } = await Preferences.get({ key: SALES_KEY });
    return value ? (JSON.parse(value) as Sale[]) : [];
  }

  /**
   * Devuelve las ventas de un vendedor concreto, ordenadas
   * de la más reciente a la más antigua.
   * Se usa en la pestaña "Ventas" del vendedor.
   */
  async getBySeller(sellerEmail: string): Promise<Sale[]> {
    const all = await this.getAll();
    return all
      .filter((s) => s.sellerEmail === sellerEmail)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Devuelve SOLO los últimos N compradores de un vendedor,
   * sin repetir (si el mismo comprador compró 3 veces, aparece
   * una sola vez con el total acumulado).
   *
   * Requisito de la FACE 2, tab3: "máximo los últimos 20
   * usuarios que han comprado su producto".
   */
  async getRecentBuyers(
    sellerEmail: string,
    limit: number = 20
  ): Promise<{ buyerEmail: string; totalSpent: number; totalItems: number; lastDate: string }[]> {

    const sales = await this.getBySeller(sellerEmail);

    // Agrupamos por comprador usando un Map.
    // Map guarda clave → valor sin duplicar claves.
    const byBuyer = new Map<string, { totalSpent: number; totalItems: number; lastDate: string }>();

    for (const sale of sales) {
      const current = byBuyer.get(sale.buyerEmail);

      if (current) {
        // Ya existe: acumulamos.
        current.totalSpent += sale.total;
        current.totalItems += sale.quantity;
        // Guardamos la fecha más reciente.
        if (sale.date > current.lastDate) current.lastDate = sale.date;
      } else {
        // Primera vez que aparece este comprador.
        byBuyer.set(sale.buyerEmail, {
          totalSpent: sale.total,
          totalItems: sale.quantity,
          lastDate: sale.date,
        });
      }
    }

    // Convertimos el Map a array, ordenamos por fecha desc
    // y recortamos a los primeros `limit`.
    return Array.from(byBuyer.entries())
      .map(([buyerEmail, data]) => ({ buyerEmail, ...data }))
      .sort((a, b) => b.lastDate.localeCompare(a.lastDate))
      .slice(0, limit);
  }

  /**
   * Total de ganancias de un vendedor (suma de todos sus totales).
   * Se usa al final de la pestaña "Ventas".
   */
  async getTotalEarnings(sellerEmail: string): Promise<number> {
    const sales = await this.getBySeller(sellerEmail);
    return sales.reduce((sum, s) => sum + s.total, 0);
  }

  /**
   * Total de unidades vendidas por un vendedor.
   */
  async getTotalUnitsSold(sellerEmail: string): Promise<number> {
    const sales = await this.getBySeller(sellerEmail);
    return sales.reduce((sum, s) => sum + s.quantity, 0);
  }

  // ──────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ──────────────────────────────────────────────────────────

  private async persist(sales: Sale[]): Promise<void> {
    await Preferences.set({
      key: SALES_KEY,
      value: JSON.stringify(sales),
    });
  }
}