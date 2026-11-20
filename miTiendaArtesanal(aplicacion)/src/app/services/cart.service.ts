// ============================================================
// SERVICIO DE CARRITO (CartService)
// ------------------------------------------------------------
// Gestiona el estado del carrito:
//   - Añadir productos (con cantidad).
//   - Incrementar / decrementar cantidades.
//   - Eliminar un producto del carrito.
//   - Vaciar el carrito.
//   - Calcular subtotal y total.
//
// Persiste el carrito en Preferences para que sobreviva al
// cierre de la app (igual que hicimos con las fotos).
// ============================================================

import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import type { CartItem, Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CartService {

  // Array en memoria con los items del carrito.
  // La UI (página del carrito) lo lee directamente.
  public items: CartItem[] = [];

  // Clave en Preferences para persistir el carrito.
  private CART_KEY = 'cart_items';

  /**
   * Añade un producto al carrito.
   * ------------------------------------------------------------
   * Si el producto ya existe, incrementa su cantidad.
   * Si no, lo añade como nuevo item con cantidad 1.
   */
  async addToCart(product: Product, quantity: number = 1): Promise<void> {
    // Buscamos si el producto ya está en el carrito.
    const existing = this.items.find((i) => i.product.id === product.id);

    if (existing) {
      // Ya existe: incrementamos la cantidad.
      existing.quantity += quantity;
    } else {
      // No existe: lo añadimos como item nuevo.
      this.items.push({ product, quantity });
    }

    // Persistimos el carrito actualizado.
    await this.persist();
  }

  /**
   * Incrementa la cantidad de un producto en 1.
   */
  async increment(productId: string): Promise<void> {
    const item = this.items.find((i) => i.product.id === productId);
    if (item) {
      item.quantity += 1;
      await this.persist();
    }
  }

  /**
   * Decrementa la cantidad de un producto en 1.
   * Si llega a 0, elimina el producto del carrito.
   */
  async decrement(productId: string): Promise<void> {
    const item = this.items.find((i) => i.product.id === productId);
    if (!item) return;

    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      // Cantidad 1 → lo eliminamos.
      this.items = this.items.filter((i) => i.product.id !== productId);
    }
    await this.persist();
  }

  /**
   * Elimina un producto del carrito sin importar la cantidad.
   */
  async remove(productId: string): Promise<void> {
    this.items = this.items.filter((i) => i.product.id !== productId);
    await this.persist();
  }

  /**
   * Vacía el carrito por completo (tras finalizar compra).
   */
  async clear(): Promise<void> {
    this.items = [];
    await Preferences.remove({ key: this.CART_KEY });
  }

  /**
   * Carga el carrito desde Preferences al iniciar la app.
   */
  async load(): Promise<void> {
    const { value } = await Preferences.get({ key: this.CART_KEY });
    this.items = value ? (JSON.parse(value) as CartItem[]) : [];
  }

  /**
   * Subtotal: suma de (precio × cantidad) de todos los items.
   */
  getSubtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }

  /**
   * Total: en este caso igual al subtotal (sin envío ni impuestos).
   * En un proyecto real se añadirían envío, IVA, descuentos, etc.
   */
  getTotal(): number {
    return this.getSubtotal();
  }

  /**
   * Cantidad total de unidades en el carrito.
   * Útil para mostrar el badge en la pestaña del carrito.
   */
  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Persiste el carrito en Preferences.
   * Es privado porque solo se usa dentro de este servicio.
   */
  private async persist(): Promise<void> {
    await Preferences.set({
      key: this.CART_KEY,
      value: JSON.stringify(this.items),
    });
  }
}