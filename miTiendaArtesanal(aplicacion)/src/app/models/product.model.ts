// ============================================================
// MODELO DE PRODUCTO
// ------------------------------------------------------------
// Un producto puede venir de dos fuentes:
//   1. Productos POR DEFECTO (hardcoded) → sellerEmail es
//      'seller@default.com'. No son editables ni eliminables.
//   2. Productos PUBLICADOS por vendedores → sellerEmail es
//      el correo del vendedor que los creó. El vendedor
//      puede eliminarlos; el admin puede suspenderlos.
// ============================================================

export interface Product {
  // ID único del producto. Se genera al publicarlo:
  //   'prod_' + timestamp (o uuid en backend real).
  id: string;

  // Categoría del producto (limita los valores).
  category: 'joyería' | 'textil' | 'artesanía' | 'alimentos' | 'cuidado personal';

  name: string;
  description: string;

  // Precio unitario en pesos colombianos.
  price: number;

  // URL o ruta de la imagen del producto.
  //   - Productos por defecto: URL de placehold.co.
  //   - Productos de vendedor: webviewPath (base64) o filepath
  //     del archivo guardado con Filesystem.
  imageUrl: string;

  // CORREO DEL VENDEDOR que publicó el producto.
  //   - 'seller@default.com' → producto del catálogo base.
  //   - correo real → producto de un vendedor registrado.
  sellerEmail: string;

  // Stock disponible (cuántas unidades puede comprar el cliente).
  stock: number;

  // Estado del producto. Si está 'suspended', el admin lo
  // ocultó del catálogo hasta que lo revise.
  status: 'active' | 'suspended';
}

export interface CartItem {
  product: Product;
  quantity: number;
}