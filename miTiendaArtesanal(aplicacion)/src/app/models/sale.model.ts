// ============================================================
// MODELO DE VENTA
// ------------------------------------------------------------
// Cada vez que un comprador finaliza una compra, se genera
// UNA venta por cada producto que pertenezca a un vendedor.
//
// Si el comprador compra 3 productos de 3 vendedores distintos,
// se generan 3 ventas (una por vendedor).
//
// Las ventas son INMUTABLES: no se pueden editar ni eliminar
// (esto es un registro contable). Si el admin elimina una
// cuenta de vendedor, las ventas se conservan para auditoría.
// ============================================================

export interface Sale {
  // ID único de la venta.
  id: string;

  // Correo del VENDEDOR que vendió (dueño del producto).
  sellerEmail: string;

  // Correo del COMPRADOR que compró.
  buyerEmail: string;

  // Datos del producto vendido (snapshot al momento de la venta).
  // Se guarda el nombre y precio por si el producto se elimina
  // después: la venta queda registrada con los datos originales.
  productId: string;
  productName: string;
  productPrice: number;

  // Cantidad vendida de ese producto.
  quantity: number;

  // Total de la venta (productPrice × quantity).
  total: number;

  // Fecha ISO 8601 (ej: '2026-11-19T14:30:00.000Z').
  date: string;
}