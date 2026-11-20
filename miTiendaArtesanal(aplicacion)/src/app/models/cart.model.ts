// ============================================================
// MODELO DE CARRITO
// ------------------------------------------------------------
// Un CartItem es un producto + la cantidad que el comprador
// quiere llevar. Separarlo del modelo de producto es clave:
// el producto es el catálogo; el CartItem es la intención
// de compra.
// ============================================================

import type { Product } from './product.model';

export interface CartItem {
  // Producto completo (así el carrito tiene toda la info sin
  // tener que consultar el ProductService de nuevo).
  product: Product;

  // Cantidad de unidades que el comprador quiere llevar.
  quantity: number;
}